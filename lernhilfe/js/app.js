(function () {
  'use strict';

  const L = window.LERN;
  const ORDER = ['mathe', 'englisch', 'franz'];
  const app = document.getElementById('app');

  // ---------- Anmeldung & Lernstand ----------
  // Anmeldung mit Name und Passwort (das Passwort legt jedes Kind beim ersten
  // Anmelden selbst fest). Der Lernstand wird sofort auf dem Gerät und im
  // Hintergrund in der Datenbank gespeichert (api/lernstand.php).
  const AKEY = 'lernhilfe:auth';
  const DKEY = 'lernhilfe:geraet';
  const SYNC_API = 'api/lernstand.php';
  let auth = null; // { token, kid: { id, name, color, rolle }, rev }
  try { auth = JSON.parse(localStorage.getItem(AKEY) || 'null'); } catch (e) { auth = null; }
  try { localStorage.removeItem('lernhilfe:kinder'); } catch (e) { /* alte Version */ }
  const keyFor = (id) => 'lernhilfe:v1:' + id;
  const currentKid = () => (auth && auth.token && auth.kid) || null;
  const isAdmin = () => !!(currentKid() && currentKid().rolle === 'admin');
  function saveAuth() {
    try { if (auth) localStorage.setItem(AKEY, JSON.stringify(auth)); else localStorage.removeItem(AKEY); } catch (e) { /* egal */ }
  }
  // Namen, die sich auf diesem Gerät schon angemeldet haben (für die Anmeldeseite)
  function deviceNames() {
    try { return JSON.parse(localStorage.getItem(DKEY) || '[]') || []; } catch (e) { return []; }
  }
  function rememberName(k) {
    const list = deviceNames().filter((x) => x.name.toLowerCase() !== k.name.toLowerCase());
    list.unshift({ name: k.name, color: k.color });
    try { localStorage.setItem(DKEY, JSON.stringify(list.slice(0, 8))); } catch (e) { /* egal */ }
  }
  function authHeaders() {
    const h = {};
    if (auth && auth.token) h['X-Lernhilfe-Token'] = auth.token;
    if (store && store.prefs && store.prefs.code) h['X-Lernhilfe-Code'] = store.prefs.code;
    return h;
  }

  const emptyStore = () => ({ vocab: {}, vt: {}, ex: {}, prefs: {}, _reset: 0 });
  // PHP liefert leere Objekte als [] zurück – wieder zu Objekten machen
  function normStore(d) {
    const out = Object.assign(emptyStore(), d && typeof d === 'object' && !Array.isArray(d) ? d : {});
    ['vocab', 'vt', 'ex', 'prefs'].forEach((k) => { if (!out[k] || typeof out[k] !== 'object' || Array.isArray(out[k])) out[k] = {}; });
    return out;
  }
  let store = emptyStore();
  function readLocal(id) {
    try {
      const raw = localStorage.getItem(keyFor(id));
      return normStore(raw ? JSON.parse(raw) : {});
    } catch (e) { return emptyStore(); }
  }
  function writeLocal(id, data) {
    try { localStorage.setItem(keyFor(id), JSON.stringify(data)); } catch (e) { /* egal */ }
  }
  function loadStore() {
    store = currentKid() ? readLocal(currentKid().id) : emptyStore();
  }
  // Fingerabdruck nur des Lernfortschritts (nicht der Anzeige-Einstellungen)
  const progressFp = (d) => JSON.stringify([d._reset || 0, Object.entries(d.vocab || {}).sort(), Object.entries(d.ex || {}).sort()]);
  let lastFp = '';
  function save() {
    if (!currentKid()) return;
    writeLocal(currentKid().id, store);
    const fp = progressFp(store);
    if (fp !== lastFp) { lastFp = fp; scheduleSync(); }
  }
  loadStore();
  lastFp = progressFp(store);

  // Zwei Stände zusammenführen: pro Vokabel gewinnt die neuere Antwort,
  // bei Übungen das beste Ergebnis. Nach "Lernstand zurücksetzen" gewinnt der neuere Neustart.
  function mergeStores(a, b) {
    a = normStore(a);
    b = normStore(b);
    if ((a._reset || 0) !== (b._reset || 0)) return JSON.parse(JSON.stringify((a._reset || 0) > (b._reset || 0) ? a : b));
    const out = emptyStore();
    out._reset = a._reset || 0;
    out.prefs = Object.assign({}, b.prefs, a.prefs);
    new Set([...Object.keys(a.vocab), ...Object.keys(b.vocab)]).forEach((k) => {
      const ta = a.vt[k] || 0, tb = b.vt[k] || 0;
      const fromA = ta !== tb ? ta > tb : (a.vocab[k] || 0) >= (b.vocab[k] || 0);
      const src = fromA ? a : b;
      if (src.vocab[k] != null) out.vocab[k] = src.vocab[k];
      if (src.vt[k]) out.vt[k] = src.vt[k];
    });
    new Set([...Object.keys(a.ex), ...Object.keys(b.ex)]).forEach((k) => {
      const x = a.ex[k], y = b.ex[k];
      out.ex[k] = !x ? y : !y ? x : (x.best / x.total >= y.best / y.total ? x : y);
    });
    return out;
  }

  async function syncCall(method, action, body) {
    const r = await fetch(`${SYNC_API}?action=${action}`, {
      method,
      cache: 'no-store',
      headers: Object.assign(body ? { 'Content-Type': 'application/json' } : {}, authHeaders()),
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await r.json().catch(() => ({}));
    if (r.status === 409 && d.kind) return { conflict: true, kind: d.kind };
    if (r.status === 401 && d.abgemeldet && auth) { forceLogout(); throw new Error(d.error || 'Bitte neu anmelden'); }
    if (!r.ok) { const e = new Error(d.error || 'Fehler ' + r.status); e.status = r.status; throw e; }
    return d;
  }

  let syncTimer = null;
  let syncing = null;
  let syncAgain = false;
  function scheduleSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncKid(), 1200);
  }
  // Lernstand des angemeldeten Kindes mit der Datenbank abgleichen
  async function syncKid(serverKid) {
    if (syncing) { syncAgain = true; return syncing; }
    const k = currentKid();
    if (!k) return;
    syncing = (async () => {
      await null; // erst nach der Zuweisung von "syncing" weiterlaufen
      try {
        let server = serverKid || (await syncCall('GET', 'get')).kind;
        for (let i = 0; i < 4; i++) {
          if (!currentKid() || currentKid().id !== k.id) return;
          const before = progressFp(store);
          const merged = mergeStores(store, server.data);
          store = merged;
          writeLocal(k.id, store);
          lastFp = progressFp(store);
          if (progressFp(merged) !== before) refreshView();
          if (progressFp(merged) === progressFp(normStore(server.data))) break;
          const res = await syncCall('POST', 'save', { base: server.ts, data: merged });
          if (!res.conflict) break;
          server = res.kind;
        }
        // Name/Farbe/Rolle könnten sich geändert haben
        if (server && auth && auth.kid && (auth.kid.name !== server.name || auth.kid.rolle !== server.rolle || auth.kid.color !== server.color)) {
          Object.assign(auth.kid, { name: server.name, rolle: server.rolle, color: server.color });
          saveAuth();
          renderUser();
          renderSide();
        }
        setSyncState('ok');
      } catch (e) {
        if (currentKid()) setSyncState('offline');
      } finally {
        syncing = null;
        if (syncAgain) { syncAgain = false; scheduleSync(); }
      }
    })();
    return syncing;
  }
  function refreshView() {
    const a = document.activeElement;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return; // nicht beim Tippen neu zeichnen
    if (typeof route === 'function') route(true);
  }
  let syncState = '';
  function setSyncState(st) {
    syncState = st;
    const el = document.getElementById('userBtn');
    if (el) el.classList.toggle('offline', st === 'offline');
  }

  // ---------- Hilfsfunktionen ----------
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function norm(s) {
    return String(s)
      .normalize('NFC')
      .toLowerCase()
      .replace(/[’‘`´ʼ]/g, "'")
      .replace(/[«»"„“”]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s+([?!:;.,])/g, '$1')
      .replace(/'\s+/g, "'")
      .replace(/[.!?;:,\s]+$/g, '')
      .trim();
  }
  const noAccents = (s) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/ß/g, 'ss');

  // Vergleicht eine Eingabe mit erlaubten Antworten: 'ok' | 'almost' | 'wrong'
  function compare(input, alts) {
    const n = norm(input);
    if (!n) return 'wrong';
    const ns = alts.map(norm);
    if (ns.includes(n)) return 'ok';
    if (ns.map(noAccents).includes(noAccents(n))) return 'almost';
    return 'wrong';
  }

  const ARTICLES = /^(le |la |les |l'|un |une |des |der |die |das |ein |eine |the |a |an )/;

  // Erlaubte Varianten einer Vokabel-Antwort
  function variants(target) {
    const out = new Set();
    const add = (s) => { s = s.trim(); if (s) out.add(s); };
    const base = target.replace(/’/g, "'");
    add(base);
    const noParen = base.replace(/\s*\([^)]*\)/g, '').replace(/^hier:\s*/, '');
    add(noParen);
    for (const v of [base, noParen]) {
      add(v.replace(/\b(qn|qc|s\.th\.|s\.o\.)/g, '').replace(/\s+/g, ' '));
      add(v.replace(/\bs\.th\./g, 'something').replace(/\bs\.o\./g, 'someone').replace(/\bqn\b/g, "quelqu'un").replace(/\bqc\b/g, 'quelque chose'));
      add(v.replace(/\betw\./g, 'etwas').replace(/\bjdn\./g, 'jemanden'));
    }
    for (const v of Array.from(out)) {
      for (const part of v.split(/\s*[\/,]\s*/)) add(part);
    }
    for (const v of Array.from(out)) {
      if (/^to /.test(v)) add(v.slice(3));
    }
    return Array.from(out);
  }

  function checkVocab(input, target, targetIsGerman) {
    const vs = variants(target);
    let r = compare(input, vs);
    if (r !== 'wrong') return r;
    // Artikel vergessen?
    const stripped = vs.map((v) => norm(v).replace(ARTICLES, ''));
    const n = norm(input).replace(ARTICLES, '');
    if (stripped.includes(n)) return targetIsGerman ? 'ok' : 'almost';
    if (stripped.map(noAccents).includes(noAccents(n))) return 'almost';
    return 'wrong';
  }

  function parseNum(s) {
    s = String(s).replace(/[^\d,.\-]/g, '');
    if (!s) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return parseFloat(s);
  }
  const numOk = (input, n) => {
    const v = parseNum(input);
    return !isNaN(v) && Math.abs(v - n) <= Math.max(1e-6, Math.abs(n) * 1e-6);
  };
  const fmtNum = (n) => L.trainer.fmt(n);
  const deL = (subj) => subj.deLabel || 'Deutsch';

  // Vorlesen
  const canSpeak = 'speechSynthesis' in window;
  function speak(text, lang) {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\bqn\b/g, "quelqu'un").replace(/\bqc\b/g, 'quelque chose').replace(/s\.th\./g, 'something').replace(/s\.o\./g, 'someone'));
    u.lang = lang;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }
  const speakLang = (subj) => subj.speakLang || (subj.id === 'franz' ? 'fr-FR' : subj.id === 'englisch' ? 'en-GB' : '');
  const speakBtn = (text, subj) =>
    canSpeak && speakLang(subj) ? `<button class="speak" type="button" data-speak="${esc(text)}" data-lang="${speakLang(subj)}" aria-label="Vorlesen" title="Vorlesen">🔊</button>` : '';

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-speak]');
    if (b) { e.stopPropagation(); speak(b.dataset.speak, b.dataset.lang); }
  }, true);

  // ---------- Vokabel-Daten ----------
  function allWords(subj, group) {
    const out = [];
    (subj.vocabGroups || []).forEach((g, gi) => {
      if (group != null && group !== 'all' && +group !== gi) return;
      g.words.forEach((w) => out.push({ fr: w[0], de: w[1], ex: w[2], key: subj.id + '|' + w[0], group: gi }));
    });
    return out;
  }
  const boxOf = (w) => store.vocab[w.key] || 0;
  function setBox(w, ok) {
    const b = boxOf(w);
    store.vocab[w.key] = ok ? Math.min(4, b + 1) : 0;
    store.vt[w.key] = Date.now();
    save();
  }
  function vocabStats(subj) {
    const ws = allWords(subj);
    const known = ws.filter((w) => boxOf(w) >= 2).length;
    return { known, total: ws.length };
  }
  function exStats(subj) {
    const done = subj.exercises.filter((x) => {
      const s = store.ex[subj.id + '|' + x.id];
      return s && s.best === s.total;
    }).length;
    return { done, total: subj.exercises.length };
  }

  // ---------- Fächer & gespeicherte Themen ----------
  const FAECHER = {
    mathe: ['Mathe', '📐'], englisch: ['Englisch', '🇬🇧'], franz: ['Französisch', '🇫🇷'], deutsch: ['Deutsch', '📖'],
    latein: ['Latein', '🏛️'], spanisch: ['Spanisch', '🇪🇸'], bio: ['Biologie', '🌱'], physik: ['Physik', '🔭'],
    chemie: ['Chemie', '⚗️'], geschichte: ['Geschichte', '🏰'], erdkunde: ['Erdkunde', '🌍'], musik: ['Musik', '🎵'],
    religion: ['Religion/Ethik', '🕊️'], sonstiges: ['Sonstiges', '📚'],
  };
  const fachName = (f) => (FAECHER[f] || FAECHER.sonstiges)[0];
  const fachIcon = (f) => (FAECHER[f] || FAECHER.sonstiges)[1];
  const BUILTIN_TITLE = {
    mathe: 'Fläche, Volumen, Oberfläche, Einheiten',
    englisch: 'Around the World in 80 Days – Kapitel 2',
    franz: 'Chapitre 1–3 · Le passé récent',
  };
  const LANG = {
    en: { label: 'English', speak: 'en-GB' },
    fr: { label: 'Français', speak: 'fr-FR', accents: ['é', 'è', 'ê', 'à', 'â', 'ç', 'ù', 'û', 'î', 'ï', 'ô', 'ë', 'œ', '’'] },
    es: { label: 'Español', speak: 'es-ES', accents: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'] },
    la: { label: 'Latein' },
  };
  const API = 'api/api.php';
  // Fotoerkennung (braucht API-Schlüssel auf dem Server) – vorerst aus
  const FOTOS_AKTIV = true;
  let remote = [];
  let apiOk = null;
  let busy = false;
  let photos = [];
  let lastResult = null;
  try { remote = JSON.parse(localStorage.getItem('lernhilfe:themen') || '[]') || []; } catch (e) { remote = []; }

  function setRemote(list) {
    remote = Array.isArray(list) ? list : [];
    subjCache.clear();
    try { localStorage.setItem('lernhilfe:themen', JSON.stringify(remote)); } catch (e) { /* egal */ }
  }
  async function loadRemote() {
    if (!FOTOS_AKTIV) { renderSide(); return; }
    try {
      const r = await fetch(API + '?action=list', { cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json();
      apiOk = true;
      setRemote(d.themen);
    } catch (e) {
      apiOk = false;
    }
    const h = location.hash;
    if (!busy && (!h || h === '#/' || h === '#/fotos' || h.startsWith('#/t/') || h.startsWith('#/f/'))) route(true);
    else renderSide();
  }

  // Einfaches, sicheres Markdown (alles wird zuerst maskiert)
  function md(src) {
    const lines = String(src || '').replace(/\r/g, '').split('\n');
    let out = '', list = null, para = [];
    const inline = (s) => esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/(^|[^*\w])\*(?=\S)(.+?)\*(?!\w)/g, '$1<i>$2</i>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
    const flushP = () => { if (para.length) { out += `<p>${para.map(inline).join('<br>')}</p>`; para = []; } };
    const flushL = () => { if (list) { out += `</${list}>`; list = null; } };
    const cells = (r) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    const isSep = (r) => /^\|?[\s:|-]+\|?$/.test(r) && r.includes('-');
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      let m;
      if (!t) { flushP(); flushL(); continue; }
      if ((m = t.match(/^#{1,6}\s+(.*)/))) { flushP(); flushL(); out += `<h4>${inline(m[1])}</h4>`; continue; }
      if (t.startsWith('|')) {
        flushP(); flushL();
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++].trim());
        i--;
        let head = null, body = rows;
        if (rows.length > 1 && isSep(rows[1])) { head = cells(rows[0]); body = rows.slice(2); }
        out += '<div class="table-wrap"><table>' +
          (head ? `<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>` : '') +
          `<tbody>${body.filter((r) => !isSep(r)).map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
        continue;
      }
      if ((m = t.match(/^[-*•]\s+(.*)/)) || (m = t.match(/^\d+[.)]\s+(.*)/))) {
        flushP();
        const type = /^\d/.test(t) ? 'ol' : 'ul';
        if (list !== type) { flushL(); out += `<${type}>`; list = type; }
        out += `<li>${inline(m[1])}</li>`;
        continue;
      }
      if ((m = t.match(/^>\s?(.*)/))) { flushP(); flushL(); out += `<div class="merke">${inline(m[1])}</div>`; continue; }
      flushL();
      para.push(t);
    }
    flushP(); flushL();
    return out;
  }

  const isNumStr = (s) => /^-?[\d\s., ]+$/.test(String(s).trim()) && /\d/.test(s);

  // Gespeichertes Thema in dieselbe Form bringen wie die eingebauten Fächer
  const subjCache = new Map();
  function topicSubj(t) {
    const key = t.id + '|' + t.updated_at;
    if (subjCache.has(key)) return subjCache.get(key);
    const d = t.data || {};
    const lang = LANG[d.sprache] || null;
    const voc = d.vokabeln || [];
    const s = {
      id: 't' + t.id,
      remote: t,
      fach: t.fach,
      route: '#/t/' + t.id,
      name: t.titel,
      icon: fachIcon(t.fach),
      subtitle: fachName(t.fach) + (d.zusammenfassung ? ' · ' + d.zusammenfassung : ''),
      langLabel: lang ? lang.label : 'Begriff',
      deLabel: lang ? 'Deutsch' : 'Bedeutung',
      speakLang: lang && lang.speak,
      accents: lang && lang.accents,
      tips: lang
        ? ['Vokabeln laut lesen und lernen.', 'Mit Karteikarten und Vokabeltest üben.', 'Grammatik lesen, dann die Übungen machen.']
        : ['Erklärungen lesen.', 'Übungen machen und prüfen.', 'Fehler verbessern und nochmal prüfen.'],
      grammarLabel: d.wissen_titel || (lang ? 'Grammatik' : 'Wissen'),
      vocabGroups: voc.length ? [{ title: 'Vokabeln', words: voc.map((v) => [v.begriff, v.bedeutung, v.erklaerung || '']) }] : [],
      pitfalls: d.stolperfallen || [],
      grammar: (d.grammatik || []).map((g) => ({ title: g.titel, html: md(g.inhalt) })),
      exercises: (d.uebungen || []).map((u, i) => ({
        id: 'u' + i,
        title: u.titel,
        intro: u.anleitung,
        items: (u.aufgaben || []).map((a) => (a.antwort && !(a.luecken || []).length ? { q: String(a.frage || ''), open: true, answer: String(a.antwort) } : {
          q: String(a.frage || ''),
          hint: a.hinweis,
          sol: a.erklaerung,
          a: (a.luecken || []).map((l) => {
            const ls = (l.loesungen || []).filter((x) => String(x).trim());
            if ((l.einheit || ls.every(isNumStr)) && ls.length && !isNaN(parseNum(ls[0]))) return { n: parseNum(ls[0]), u: l.einheit || '' };
            return ls;
          }),
        })),
      })),
    };
    subjCache.set(key, s);
    return s;
  }

  function topicsOf(fach) {
    const out = [];
    if (L[fach] && ORDER.includes(fach)) out.push({ subj: L[fach], title: BUILTIN_TITLE[fach], builtin: true });
    alleThemen().filter((t) => t.fach === fach).forEach((t) => out.push({ subj: topicSubj(t), title: t.titel, t }));
    return out;
  }
  function faecherList() {
    const set = new Set(ORDER);
    alleThemen().forEach((t) => set.add(t.fach));
    return Object.keys(FAECHER).filter((f) => set.has(f));
  }

  function progressOf(subj) {
    const ex = exStats(subj);
    let pct = ex.total ? ex.done / ex.total : 0, parts = [];
    const hasVoc = subj.vocabGroups && subj.vocabGroups.length && allWords(subj).length;
    if (hasVoc) {
      const v = vocabStats(subj);
      parts.push(`${v.known} / ${v.total} Vokabeln sicher`);
      pct = ex.total ? (v.known / v.total + pct) / 2 : v.known / v.total;
    }
    if (ex.total) parts.push(`${ex.done} / ${ex.total} Übungen geschafft`);
    return { pct, text: parts.join(' · ') };
  }

  // ---------- Seitenleiste ----------
  let currentFach = store.prefs.fach || '';
  function renderSide(activeRoute) {
    const side = document.getElementById('side');
    if (!side) return;
    if (!currentKid()) { side.innerHTML = ''; return; }
    const list = faecherList();
    if (currentFach && !list.includes(currentFach)) currentFach = '';
    const here = activeRoute || location.hash || '#/';
    side.innerHTML = `
      <div class="drawer-head">
        <a class="drawer-brand" href="#/"><img src="favicon.svg" alt="" width="34" height="34"> Lernhilfe</a>
        <button type="button" class="drawer-close" id="drawerClose" aria-label="Menü schließen">✕</button>
      </div>
      <nav class="nav-list" aria-label="Hauptmenü">
        <a href="#/" class="${here === '#/' ? 'active' : ''}"><span class="ni" aria-hidden="true">🏠</span>Übersicht</a>
        ${FOTOS_AKTIV ? `<a href="#/fotos" class="${here === '#/fotos' ? 'active' : ''}"><span class="ni" aria-hidden="true">📷</span>Neue Fotos</a>` : ''}
        ${isAdmin() ? `<a href="#/admin" class="${here === '#/admin' ? 'active' : ''}"><span class="ni" aria-hidden="true">⚙️</span>Benutzer verwalten</a>` : ''}
      </nav>
      <div class="nav-sep"></div>
      <div class="nav-title">Fächer</div>
      <nav class="nav-list" aria-label="Fächer">
        ${list.map((f) => `<a href="#/f/${f}" class="${f === currentFach ? 'active' : ''}">
          <span class="ni" aria-hidden="true">${fachIcon(f)}</span>${esc(fachName(f))}<span class="nc">${topicsOf(f).length}</span></a>`).join('')}
      </nav>
      `;
    side.querySelector('#drawerClose').addEventListener('click', closeDrawer);
  }

  // Ausklappbares Menü auf dem Handy
  function openDrawer() {
    document.body.classList.add('drawer-open');
    const c = document.getElementById('drawerClose');
    if (c) c.focus();
  }
  function closeDrawer() {
    document.body.classList.remove('drawer-open');
  }
  document.getElementById('menuBtn').addEventListener('click', openDrawer);
  document.getElementById('backdrop').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  document.getElementById('side').addEventListener('click', (e) => { if (e.target.closest('a')) closeDrawer(); });

  // ---------- Routing ----------
  function route(keepScroll) {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (keepScroll !== true) window.scrollTo(0, 0);
    renderUser();
    if (!currentKid()) return renderLogin();
    let subj = null, tabPart = null;
    if (parts[0] === 'f' && parts[1]) {
      currentFach = parts[1];
      store.prefs.fach = currentFach; save();
      renderSide();
      return renderFach(parts[1]);
    }
    if (parts[0] === 'druck' && parts[1]) {
      currentFach = parts[1];
      renderSide();
      return renderPrint(parts[1], parts[2] || '-');
    }
    if (parts[0] === 't' && parts[1]) {
      const t = alleThemen().find((x) => String(x.id) === parts[1]);
      if (!t) {
        renderSide();
        app.innerHTML = apiOk === null ? '<p class="muted">Lade …</p>' : '<div class="card"><h2>Thema nicht gefunden</h2><p>Vielleicht wurde es gelöscht.</p><a class="btn" href="#/">Zur Startseite</a></div>';
        return;
      }
      subj = topicSubj(t);
      tabPart = parts[2];
    } else if (L[parts[0]] && ORDER.includes(parts[0])) {
      subj = L[parts[0]];
      tabPart = parts[1];
    }
    if (parts[0] === 'admin') { renderSide('#/admin'); return renderAdmin(); }
    if (parts[0] === 'passwort') { renderSide(''); return renderPasswort(); }
    if (parts[0] === 'fotos' && FOTOS_AKTIV) { renderSide('#/fotos'); return renderFotos(); }
    if (!subj) { renderSide('#/'); return renderStart(); }
    currentFach = subj.fach;
    store.prefs.fach = currentFach; save();
    renderSide();
    const tabs = tabsFor(subj);
    const tab = tabs.find((t) => t[0] === tabPart) ? tabPart : tabs[0][0];
    renderSubject(subj, tab, tabs);
  }
  window.addEventListener('hashchange', () => route());

  function tabsFor(subj) {
    if (subj.id === 'mathe') return [['wissen', 'Wissen'], ['uebungen', 'Übungen'], ['training', 'Training']];
    const t = [];
    if (subj.vocabGroups && subj.vocabGroups.some((g) => g.words.length)) t.push(['vokabeln', 'Vokabeln'], ['karten', 'Karteikarten'], ['test', 'Vokabeltest']);
    if (subj.grammar && subj.grammar.length) t.push(['grammatik', subj.grammarLabel || 'Grammatik']);
    if (subj.exercises && subj.exercises.length) t.push(['uebungen', 'Übungen']);
    if (!t.length) t.push(['leer', 'Inhalt']);
    return t;
  }

  // ---------- Epochen ----------
  const BUILTIN_EPOCHE = { mathe: 'Flächen und Körper', englisch: '', franz: '' };
  const OHNE_EPOCHE = 'Fachunterricht (ohne Epoche)';
  const epocheOf = (x) => (x.builtin ? BUILTIN_EPOCHE[x.subj.id] : ((x.t && x.t.data && x.t.data.epoche) || '')).trim();
  const epocheKey = (e) => (e ? encodeURIComponent(e) : '-');
  function epochenOf(fach) {
    const groups = new Map();
    topicsOf(fach).forEach((x) => {
      const e = epocheOf(x);
      if (!groups.has(e)) groups.set(e, []);
      groups.get(e).push(x);
    });
    // Benannte Epochen zuerst (alphabetisch), ohne Epoche zuletzt
    return Array.from(groups.entries())
      .sort((a, b) => (!a[0]) - (!b[0]) || a[0].localeCompare(b[0], 'de'))
      .map(([name, topics]) => ({ name, topics }));
  }
  const printLink = (fach, e) => `#/druck/${fach}/${epocheKey(e)}`;

  async function apiPost(action, body) {
    const send = () => fetch(API + '?action=' + action, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify(body),
    });
    let r = await send();
    if (r.status === 401) {
      const c = prompt('Zugangscode:');
      if (!c) throw new Error('Kein Zugangscode');
      store.prefs.code = c.trim(); save();
      r = await send();
    }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Fehler ' + r.status);
    if (d.themen) setRemote(d.themen);
    return d;
  }

  // ---------- Druckansicht (Lernheft als PDF) ----------
  function printBlank(spec) {
    if (typeof spec === 'object' && !Array.isArray(spec)) {
      return `<span class="pblank num"></span>${spec.u ? ' ' + spec.u : ''}`;
    }
    const len = Math.max(...spec.map((s) => s.length));
    return `<span class="pblank ${len > 22 ? 'wide' : ''}" style="${len > 22 ? '' : `min-width:${Math.max(6, len + 3)}ch`}"></span>`;
  }

  function renderPrint(fach, key) {
    const epoche = key === '-' ? '' : decodeURIComponent(key);
    const group = epochenOf(fach).find((g) => g.name === epoche);
    const topics = group ? group.topics : [];
    const opt = Object.assign({ wissen: true, vokabeln: true, test: true, uebungen: true, loesungen: true }, store.prefs.print || {});
    const eName = epoche || OHNE_EPOCHE;
    const docTitle = `Lernheft ${fachName(fach)} – ${eName}`;
    document.title = docTitle;
    document.body.dataset.subject = ORDER.includes(fach) ? fach : '';

    let exNo = 0;
    const solutions = [];
    const body = topics.map((x, ti) => {
      const s = x.subj;
      let h = `<section class="p-topic ${ti ? 'p-break' : ''}"><h2>${esc(x.title)}</h2>`;
      if (opt.wissen && s.grammar && s.grammar.length) {
        h += s.grammar.map((g) => `<div class="p-block"><h3>${esc(g.title)}</h3>${g.html}</div>`).join('');
      }
      if (opt.wissen && s.pitfalls && s.pitfalls.length) {
        h += `<div class="p-block warn"><h3>Stolperfallen</h3><ul>${s.pitfalls.map((p) => `<li>${s.remote ? esc(p) : p}</li>`).join('')}</ul></div>`;
      }
      const words = allWords(s);
      if (opt.vokabeln && words.length) {
        h += `<div class="p-block"><h3>Vokabeln</h3><table class="p-vocab"><thead><tr><th>#</th><th>${esc(s.langLabel)}</th><th>${esc(deL(s))}</th></tr></thead><tbody>
          ${words.map((w, i) => `<tr><td>${i + 1}</td><td>${esc(w.fr)}</td><td>${esc(w.de)}${w.ex ? `<br><small>${esc(w.ex)}</small>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
      }
      if (opt.test && words.length) {
        const half = Math.ceil(words.length / 2);
        const left = words.slice(0, half), right = words.slice(half);
        const rows = [];
        for (let i = 0; i < half; i++) {
          const r = right[i];
          rows.push(`<tr><td>${esc(left[i].fr)}</td><td class="line"></td><td class="gap"></td>${r ? `<td>${esc(r.de)}</td><td class="line"></td>` : '<td></td><td></td>'}</tr>`);
        }
        h += `<div class="p-block p-test"><h3>Abdecktest</h3><p class="p-hint">Schreib die Übersetzung in die leere Spalte. Danach mit der Vokabelliste vergleichen.</p>
          <table><thead><tr><th>${esc(s.langLabel)}</th><th>${esc(deL(s))}</th><th class="gap"></th><th>${esc(deL(s))}</th><th>${esc(s.langLabel)}</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
      }
      if (opt.uebungen && s.exercises && s.exercises.length) {
        const sol = [];
        h += s.exercises.map((ex) => {
          exNo++;
          sol.push(`<p><b>${exNo}. ${esc(ex.title)}</b><br>${ex.items.map((it, i) => `${i + 1}) ${solutionText(it)}`).join(' · ')}</p>`);
          return `<div class="p-block p-ex"><h3>${exNo}. ${esc(ex.title)}</h3>${ex.intro ? `<p class="p-hint">${esc(ex.intro)}</p>` : ''}
            ${ex.wordbox ? `<p class="p-wordbox">${ex.wordbox.map(esc).join(' · ')}</p>` : ''}
            <ol>${ex.items.map((it) => {
              let bi = 0;
              if (it.open) return `<li>${esc(it.q)}<span class="pblank wide"></span><span class="pblank wide"></span></li>`;
              const q = it.choice
                ? esc(it.q).replace('___', `( ${it.choice.map(esc).join(' / ')} )`)
                : esc(it.q).replace(/___/g, () => printBlank(it.a[bi++]));
              return `<li>${it.fig ? `<div class="p-fig">${it.fig}</div>` : ''}${q}${it.hint ? ` <i>(${esc(it.hint)})</i>` : ''}</li>`;
            }).join('')}</ol></div>`;
        }).join('');
        solutions.push(`<h3>${esc(x.title)}</h3>${sol.join('')}`);
      }
      return h + '</section>';
    }).join('');

    app.innerHTML = `
      <div class="print-tools card">
        <nav class="crumbs"><a href="#/f/${fach}">← ${esc(fachName(fach))}</a></nav>
        <h1>🖨️ Lernheft drucken</h1>
        <p>${fachIcon(fach)} <b>${esc(fachName(fach))}</b> · ${epoche ? 'Epoche' : ''} <b>${esc(eName)}</b> · ${topics.length} ${topics.length === 1 ? 'Thema' : 'Themen'}</p>
        <div class="print-opts">
          ${[['wissen', 'Erklärungen'], ['vokabeln', 'Vokabelliste'], ['test', 'Abdecktest'], ['uebungen', 'Übungen'], ['loesungen', 'Lösungen am Ende']]
            .map(([k, l]) => `<label><input type="checkbox" data-opt="${k}" ${opt[k] ? 'checked' : ''}> ${l}</label>`).join('')}
        </div>
        <div class="actions"><button class="btn primary" id="doPrint">🖨️ Drucken / als PDF speichern</button></div>
        <p class="muted small">Im Druckdialog als Drucker „Als PDF speichern“ wählen, um eine PDF-Datei zu bekommen.</p>
      </div>
      <article class="print-doc">
        <header class="p-cover">
          <div class="p-kicker">Lernheft · ${esc(fachName(fach))}</div>
          <h1>${esc(eName)}</h1>
          <div class="p-name">Name: <span></span> Datum: <span></span></div>
          ${topics.length > 1 ? `<ol class="p-toc">${topics.map((x) => `<li>${esc(x.title)}</li>`).join('')}</ol>` : ''}
        </header>
        ${body || '<p>Keine Themen in dieser Epoche.</p>'}
        ${opt.loesungen && solutions.length ? `<section class="p-solutions p-break"><h2>Lösungen</h2>${solutions.join('')}</section>` : ''}
      </article>`;
    app.querySelectorAll('[data-opt]').forEach((c) => c.addEventListener('change', () => {
      store.prefs.print = Object.assign({}, opt, { [c.dataset.opt]: c.checked });
      save();
      renderPrint(fach, key);
    }));
    app.querySelector('#doPrint').addEventListener('click', () => window.print());
  }

  // ---------- Fach-Übersicht ----------
  function renderFach(fach) {
    document.title = `${fachName(fach)} – Lernhilfe`;
    document.body.dataset.subject = ORDER.includes(fach) ? fach : '';
    const topics = topicsOf(fach);
    app.innerHTML = `
      <header class="subject-head">
        <span class="subject-icon" aria-hidden="true">${fachIcon(fach)}</span>
        <div><h1>${esc(fachName(fach))}</h1><p>${topics.length} ${topics.length === 1 ? 'Thema' : 'Themen'}</p></div>
      </header>
      ${epochenOf(fach).map((g) => `<section class="epoche">
        <div class="epoche-head">
          <h2>${g.name ? 'Epoche: ' + esc(g.name) : esc(OHNE_EPOCHE)}</h2>
          <a class="btn" href="${printLink(fach, g.name)}" title="Alle Themen dieser Epoche als Lernheft drucken oder als PDF speichern">🖨️ Lern-PDF drucken</a>
        </div>
        <div class="topic-list">${g.topics.map((x) => topicCard(x)).join('')}</div>
      </section>`).join('') || '<p class="muted">Noch keine Themen.</p>'}
      ${FOTOS_AKTIV ? `<a class="btn" href="#/fotos">📷 Neue Fotos zu ${esc(fachName(fach))} hinzufügen</a>` : ''}`;
  }
  function topicCard(x) {
    const p = progressOf(x.subj);
    const d = x.t ? x.t.data || {} : null;
    const when = x.t && x.t.updated_at ? new Date(String(x.t.updated_at).replace(' ', 'T')).toLocaleDateString('de-DE') : '';
    return `<a class="topic-card" href="${x.subj.route}">
      <span class="topic-title">${esc(x.title)}${x.t && x.t.basis ? ' <span class="tag">Ergänzung</span>' : ''}</span>
      <span class="muted small">${x.builtin ? 'aus dem Lernheft' : `aus Fotos${when ? ' · zuletzt ' + when : ''}`}${d && d.zusammenfassung ? ' · ' + esc(d.zusammenfassung) : ''}</span>
      <span class="progress"><span style="width:${Math.round(p.pct * 100)}%"></span></span>
      <span class="muted small">${p.text || 'Noch nicht geübt'}</span>
    </a>`;
  }

  // Themen aus der Datei data-themen.js (fest im Repo) plus Themen aus der Datenbank
  function alleThemen() {
    return (L.themen || []).map((t) => Object.assign({ static: true }, t)).concat(remote);
  }

  // ---------- Anmeldung ----------
  const initials = (n) => n.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const avatar = (k, cls = '') => `<span class="avatar ${cls}" style="background:${esc(k.color || '#868e96')}" aria-hidden="true">${esc(initials(k.name))}</span>`;

  function onLoggedIn(res) {
    auth = { token: res.token, kid: { id: res.kind.id, name: res.kind.name, color: res.kind.color, rolle: res.kind.rolle } };
    saveAuth();
    rememberName(auth.kid);
    loadStore();
    store = mergeStores(store, res.kind.data);
    writeLocal(auth.kid.id, store);
    lastFp = progressFp(store);
    currentFach = store.prefs.fach || '';
    loginState = { step: 'name' };
    if (location.hash && location.hash !== '#/') location.hash = '#/';
    else route();
    syncKid(res.kind);
  }
  function clearSession() {
    clearTimeout(syncTimer);
    auth = null;
    saveAuth();
    loadStore();
    lastFp = progressFp(store);
    currentFach = '';
    closeUserMenu();
    if (location.hash && location.hash !== '#/') location.hash = '#/';
    else route();
  }
  async function logout() {
    if (!auth) return;
    // noch nicht gespeicherten Stand zuerst hochladen
    try { await syncKid(); } catch (e) { /* egal */ }
    const token = auth.token;
    clearSession();
    try {
      await fetch(SYNC_API + '?action=logout', { method: 'POST', headers: { 'X-Lernhilfe-Token': token } });
    } catch (e) { /* egal */ }
  }
  function forceLogout() {
    const name = auth && auth.kid ? auth.kid.name : '';
    loginState = { step: 'name', name, msg: 'Bitte melde dich neu an.' };
    clearSession();
  }

  // ---------- Nutzer-Knopf oben rechts ----------
  function renderUser() {
    const el = document.getElementById('userBox');
    const k = currentKid();
    document.body.classList.toggle('no-user', !k);
    if (!el) return;
    el.innerHTML = k ? `<button type="button" class="user-btn ${syncState === 'offline' ? 'offline' : ''}" id="userBtn" aria-haspopup="true" aria-expanded="false" title="${esc(k.name)}">${avatar(k, 'sm')}<span class="user-name">${esc(k.name)}</span></button>
      <div class="user-menu" id="userMenu" hidden>
        <div class="user-menu-head">${avatar(k)}<div><b>${esc(k.name)}</b><br><span class="muted small">${k.rolle === 'admin' ? 'Admin' : 'Kind'}${syncState === 'offline' ? ' · offline' : ''}</span></div></div>
        ${k.rolle === 'admin' ? '<a href="#/admin" class="um-item">⚙️ Benutzer verwalten</a>' : ''}
        <button type="button" class="um-item" id="umPass">🔑 Passwort ändern</button>
        <button type="button" class="um-item" id="umLogout">🚪 Abmelden</button>
      </div>` : '';
    const b = document.getElementById('userBtn');
    if (!b) return;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const m = document.getElementById('userMenu');
      m.hidden = !m.hidden;
      b.setAttribute('aria-expanded', String(!m.hidden));
    });
    document.getElementById('umLogout').addEventListener('click', logout);
    document.getElementById('umPass').addEventListener('click', () => { closeUserMenu(); location.hash = '#/passwort'; });
    document.getElementById('userMenu').addEventListener('click', (e) => { if (e.target.closest('a')) closeUserMenu(); });
  }
  function closeUserMenu() {
    const m = document.getElementById('userMenu');
    if (m) m.hidden = true;
  }
  document.addEventListener('click', (e) => { if (!e.target.closest('#userBox')) closeUserMenu(); });

  // ---------- Anmeldeseite ----------
  let loginState = { step: 'name' };
  function renderLogin() {
    document.title = 'Anmelden – Lernhilfe';
    document.body.dataset.subject = '';
    const side = document.getElementById('side');
    if (side) side.innerHTML = '';
    const st = loginState;
    const known = deviceNames();
    let form;
    if (st.step === 'name') {
      form = `
        ${known.length ? `<div class="kids">${known.map((k) => `<button type="button" class="kid" data-name="${esc(k.name)}">${avatar(k, 'lg')}<span>${esc(k.name)}</span></button>`).join('')}</div>` : ''}
        <form class="add-kid" id="loginForm" autocomplete="on">
          <label for="lgName">Name</label>
          <div class="add-row">
            <input type="text" id="lgName" name="username" autocomplete="username" maxlength="30" placeholder="Vorname" autocapitalize="words" value="${esc(st.name || '')}">
            <button class="btn primary" type="submit">Weiter</button>
          </div>
        </form>`;
    } else {
      const neu = st.step === 'neu';
      form = `
        <div class="kids"><div class="kid static">${avatar({ name: st.name, color: st.color || '#868e96' }, 'lg')}<span>${esc(st.name)}</span></div></div>
        <form class="add-kid" id="loginForm" autocomplete="on">
          <input type="text" name="username" autocomplete="username" value="${esc(st.name)}" hidden>
          ${neu ? `<p class="first-login">👋 Du meldest dich zum ersten Mal an. Denk dir ein Passwort aus (mindestens 4 Zeichen) und merke es dir gut.</p>` : ''}
          <label for="lgPass">${neu ? 'Neues Passwort' : 'Passwort'}</label>
          <input type="password" id="lgPass" autocomplete="${neu ? 'new-password' : 'current-password'}" class="full">
          ${neu ? `<label for="lgPass2">Passwort wiederholen</label><input type="password" id="lgPass2" autocomplete="new-password" class="full">` : ''}
          ${neu && st.admin ? `<label for="lgCode">Zugangscode <span class="muted small">(steht bei GitHub als Secret LERNHILFE_CODE)</span></label><input type="password" id="lgCode" class="full" autocomplete="off">` : ''}
          <button class="btn primary full" type="submit">${neu ? 'Passwort speichern und anmelden' : 'Anmelden'}</button>
          <button class="link small" type="button" id="lgBack">Anderer Name</button>
        </form>`;
    }
    app.innerHTML = `
      <section class="login">
        <img src="favicon.svg" alt="" width="64" height="64">
        <h1>${st.step === 'name' ? 'Wer lernt heute?' : `Hallo ${esc(st.name)}!`}</h1>
        ${form}
        <div id="lgMsg" aria-live="polite">${st.msg ? `<div class="msg ${st.ok ? 'ok' : 'wrong'}">${esc(st.msg)}</div>` : ''}</div>
      </section>`;
    const msg = (t) => { app.querySelector('#lgMsg').innerHTML = t ? `<div class="msg wrong">${esc(t)}</div>` : ''; };
    const f = app.querySelector('#loginForm');
    const busyBtn = (on) => { const b = f.querySelector('button[type=submit]'); b.disabled = on; };

    async function checkName(name) {
      name = name.trim();
      if (!name) return;
      busyBtn(true);
      try {
        const d = await syncCall('POST', 'status', { name });
        const k = known.find((x) => x.name.toLowerCase() === d.name.toLowerCase());
        loginState = { step: d.neu ? 'neu' : 'pass', name: d.name, admin: d.admin, color: k && k.color };
        renderLogin();
      } catch (e) {
        busyBtn(false);
        msg(e.status ? e.message : 'Keine Verbindung zum Server. Bitte später nochmal versuchen.');
      }
    }

    if (st.step === 'name') {
      app.querySelectorAll('.kid[data-name]').forEach((b) => b.addEventListener('click', () => checkName(b.dataset.name)));
      f.addEventListener('submit', (e) => { e.preventDefault(); checkName(app.querySelector('#lgName').value); });
      if (!known.length) app.querySelector('#lgName').focus();
    } else {
      app.querySelector('#lgPass').focus();
      app.querySelector('#lgBack').addEventListener('click', () => { loginState = { step: 'name' }; renderLogin(); });
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pass = app.querySelector('#lgPass').value;
        if (st.step === 'neu') {
          if (pass.length < 4) return msg('Das Passwort muss mindestens 4 Zeichen haben.');
          if (pass !== app.querySelector('#lgPass2').value) return msg('Die beiden Passwörter sind nicht gleich.');
        }
        busyBtn(true);
        try {
          const body = { name: st.name, passwort: pass };
          const c = app.querySelector('#lgCode');
          if (c) body.code = c.value;
          onLoggedIn(await syncCall('POST', 'login', body));
        } catch (err) {
          busyBtn(false);
          msg(err.status ? err.message : 'Keine Verbindung zum Server. Bitte später nochmal versuchen.');
          if (err.status === 409) { loginState = { step: 'pass', name: st.name, msg: err.message }; renderLogin(); }
        }
      });
    }
  }

  // ---------- Passwort ändern ----------
  function renderPasswort() {
    document.title = 'Passwort ändern – Lernhilfe';
    app.innerHTML = `
      <nav class="crumbs"><a href="#/">← Übersicht</a></nav>
      <section class="card narrow">
        <h1>🔑 Passwort ändern</h1>
        <form id="pwForm" class="stack">
          <input type="text" name="username" autocomplete="username" value="${esc(currentKid().name)}" hidden>
          <label for="pwAlt">Altes Passwort</label><input type="password" id="pwAlt" autocomplete="current-password" class="full">
          <label for="pwNeu">Neues Passwort</label><input type="password" id="pwNeu" autocomplete="new-password" class="full">
          <label for="pwNeu2">Neues Passwort wiederholen</label><input type="password" id="pwNeu2" autocomplete="new-password" class="full">
          <button class="btn primary" type="submit">Speichern</button>
        </form>
        <div id="pwMsg" aria-live="polite"></div>
      </section>`;
    const f = app.querySelector('#pwForm');
    const out = (cls, t) => { app.querySelector('#pwMsg').innerHTML = `<div class="msg ${cls}">${esc(t)}</div>`; };
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const neu = app.querySelector('#pwNeu').value;
      if (neu.length < 4) return out('wrong', 'Das Passwort muss mindestens 4 Zeichen haben.');
      if (neu !== app.querySelector('#pwNeu2').value) return out('wrong', 'Die beiden neuen Passwörter sind nicht gleich.');
      try {
        await syncCall('POST', 'passwort', { alt: app.querySelector('#pwAlt').value, neu });
        f.reset();
        out('ok', '✔ Passwort geändert.');
      } catch (err) {
        out('wrong', err.status ? err.message : 'Keine Verbindung zum Server.');
      }
    });
  }

  // ---------- Benutzerverwaltung (nur Admin) ----------
  async function renderAdmin() {
    document.title = 'Benutzer verwalten – Lernhilfe';
    document.body.dataset.subject = '';
    if (!isAdmin()) { app.innerHTML = '<div class="card"><h2>Nur für Admins</h2><a class="btn" href="#/">Zur Übersicht</a></div>'; return; }
    app.innerHTML = '<p class="muted">Lade Benutzer …</p>';
    let users;
    try { users = (await syncCall('GET', 'users')).users; } catch (e) {
      app.innerHTML = `<div class="card"><h2>Benutzer konnten nicht geladen werden</h2><p>${esc(e.message)}</p></div>`;
      return;
    }
    if (location.hash !== '#/admin') return;
    const me = currentKid();
    const when = (t) => (t ? new Date(String(t).replace(' ', 'T')).toLocaleDateString('de-DE') : 'noch nie');
    app.innerHTML = `
      <header class="subject-head"><span class="subject-icon" aria-hidden="true">⚙️</span>
        <div><h1>Benutzer verwalten</h1><p>Kinder und Admins anlegen, umbenennen, Passwörter zurücksetzen</p></div></header>
      <section class="card">
        <h2>Neuer Benutzer</h2>
        <form id="addUser" class="add-row wrap">
          <input type="text" id="auName" maxlength="30" placeholder="Vorname" aria-label="Name" required>
          <select id="auRolle" aria-label="Rolle"><option value="kind">Kind</option><option value="admin">Admin</option></select>
          <button class="btn primary" type="submit">Anlegen</button>
        </form>
        <p class="muted small">Ein neuer Benutzer legt sein Passwort beim ersten Anmelden selbst fest.</p>
        <div id="auMsg" aria-live="polite"></div>
      </section>
      <div class="user-list">${users.map((u) => `
        <section class="card user-card" data-id="${esc(u.id)}">
          <div class="uc-head">${avatar(u)}
            <div class="uc-name"><span><b>${esc(u.name)}</b>${u.id === me.id ? ' <span class="tag">du</span>' : ''}</span>
              <span class="muted small">${u.rolle === 'admin' ? 'Admin' : 'Kind'} · ${u.hat_passwort ? 'Passwort gesetzt' : '<b>wartet auf erstes Anmelden</b>'} · zuletzt aktiv: ${when(u.zuletzt)}</span>
              <span class="muted small">Lernstand: ${u.stand.vokabeln} Vokabeln sicher · ${u.stand.uebungen} Übungen geschafft</span>
            </div>
          </div>
          <div class="actions">
            <button class="btn" data-act="rename">Umbenennen</button>
            ${u.hat_passwort ? '<button class="btn" data-act="resetpw">Passwort zurücksetzen</button>' : ''}
            <button class="btn" data-act="rolle">${u.rolle === 'admin' ? 'Zum Kind machen' : 'Zum Admin machen'}</button>
            <button class="btn" data-act="resetstand">Lernstand löschen</button>
            ${u.id !== me.id ? '<button class="btn bad" data-act="delete">Löschen</button>' : ''}
          </div>
        </section>`).join('')}</div>`;

    const run = async (fn) => {
      try { await fn(); renderAdmin(); } catch (e) { alert(e.message); }
    };
    app.querySelector('#addUser').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = app.querySelector('#auName').value.trim();
      if (!name) return;
      run(() => syncCall('POST', 'user_add', { name, rolle: app.querySelector('#auRolle').value }));
    });
    app.querySelectorAll('.user-card').forEach((card) => {
      const u = users.find((x) => x.id === card.dataset.id);
      card.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        const act = b.dataset.act;
        if (act === 'rename') {
          const n = prompt('Neuer Name:', u.name);
          if (n && n.trim() && n.trim() !== u.name) run(() => syncCall('POST', 'user_update', { id: u.id, name: n.trim() }));
        } else if (act === 'resetpw') {
          if (confirm(`Passwort von ${u.name} zurücksetzen? ${u.name} legt beim nächsten Anmelden ein neues fest und wird auf allen Geräten abgemeldet.`)) {
            run(() => syncCall('POST', 'user_update', { id: u.id, reset_passwort: true }));
          }
        } else if (act === 'rolle') {
          run(() => syncCall('POST', 'user_update', { id: u.id, rolle: u.rolle === 'admin' ? 'kind' : 'admin' }));
        } else if (act === 'resetstand') {
          if (confirm(`Den gesamten Lernstand von ${u.name} löschen?`)) run(() => syncCall('POST', 'user_update', { id: u.id, reset_stand: true }));
        } else if (act === 'delete') {
          if (confirm(`${u.name} mit dem gesamten Lernstand endgültig löschen?`)) run(() => syncCall('POST', 'user_delete', { id: u.id }));
        }
      });
    });
  }

  // ---------- Startseite: Übersicht ----------
  function renderStart() {
    document.title = 'Lernhilfe';
    document.body.dataset.subject = '';
    const neu = alleThemen().filter((t) => t.updated_at)
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 4)
      .map((t) => ({ subj: topicSubj(t), title: t.titel, t }));
    app.innerHTML = `
      <section class="hero small-hero">
        <h1>Hallo ${esc(currentKid().name)}!</h1>
        <p>Wähle ein Fach. Pro Epoche kannst du ein Lernheft als PDF drucken.</p>
        ${FOTOS_AKTIV ? '<p><a class="btn primary big-btn" href="#/fotos">📷 Neue Fotos auswerten</a></p>' : ''}
      </section>
      <div class="subjects">${faecherList().map((f) => {
        const eps = epochenOf(f);
        const n = eps.reduce((k, g) => k + g.topics.length, 0);
        return `<a class="subject-card" data-s="${f}" href="#/f/${f}">
          <span class="subject-icon" aria-hidden="true">${fachIcon(f)}</span>
          <span class="subject-name">${esc(fachName(f))}</span>
          <span class="subject-sub">${eps.map((g) => esc(g.name || 'Fachunterricht')).join(' · ')}</span>
          <span class="subject-meta"><span>${n} ${n === 1 ? 'Thema' : 'Themen'}</span></span>
        </a>`;
      }).join('')}</div>
      ${neu.length ? `<section><h2 style="margin-top:24px">Zuletzt hinzugefügt</h2><div class="topic-list">${neu.map(topicCard).join('')}</div></section>` : ''}`;
  }

  // ---------- Startseite: Fotos ----------
  function renderFotos() {
    document.title = 'Lernhilfe';
    document.body.dataset.subject = '';
    const recent = remote.slice(0, 5).map((t) => ({ subj: topicSubj(t), title: t.titel, t }));
    const r = lastResult;
    let status = '';
    if (busy) {
      status = `<div class="busy"><span class="spinner" aria-hidden="true"></span><div><b>Fotos werden ausgewertet …</b><br><span class="muted small">Fach und Thema erkennen, Vokabeln, Erklärungen und Übungen erstellen. Das dauert meist 1–2 Minuten. <span id="elapsed"></span></span></div></div>`;
    } else if (r && r.needCode) {
      status = `<form class="code-form" id="codeForm"><p>${esc(r.error || 'Bitte den Zugangscode eingeben.')}</p>
        <input type="password" id="codeIn" placeholder="Zugangscode" autocomplete="current-password" aria-label="Zugangscode">
        <button class="btn primary" type="submit">Weiter</button></form>`;
    } else if (r && r.error) {
      status = `<div class="msg wrong">✘ ${esc(r.error)}</div>`;
    } else if (r && r.ok === false) {
      status = `<div class="msg almost">${esc(r.begruendung)}</div>`;
    } else if (r && r.ok) {
      const parts = [];
      if (r.anzahl.vokabeln) parts.push(`${r.anzahl.vokabeln} Vokabeln`);
      if (r.anzahl.grammatik) parts.push(`${r.anzahl.grammatik} Erklärungen`);
      if (r.anzahl.uebungen) parts.push(`${r.anzahl.uebungen} Übungen`);
      status = `<div class="result-card ${r.neu ? 'neu' : 'ergaenzung'}">
        <div class="result-kind">${r.neu ? '✨ Neues Thema' : '➕ Ergänzung zu einem bekannten Thema'}</div>
        <h3>${fachIcon(r.fach)} ${esc(r.fach_name)} · ${esc(r.titel)}</h3>
        ${!r.neu && r.abschnitt && r.abschnitt !== r.titel ? `<p class="muted">Neuer Abschnitt: ${esc(r.abschnitt)}</p>` : ''}
        <p>${esc(r.begruendung)}</p>
        ${parts.length ? `<p class="muted small">Erstellt: ${parts.join(' · ')}</p>` : ''}
        <a class="btn primary" href="#/t/${r.thema_id}">Jetzt lernen →</a>
        ${r.basis ? ` <a class="btn" href="${String(r.basis).startsWith('repo-') ? '#/t/' + esc(String(r.basis).slice(5)) : '#/' + esc(r.fach)}">Zum Hauptthema</a>` : ''}
      </div>`;
    }
    app.innerHTML = `
      <section class="hero small-hero">
        <h1>Neue Fotos</h1>
        <p>Fotografiere Arbeitsblätter, Buchseiten oder Hefteinträge. Die Lernhilfe erkennt automatisch das Fach und ob es ein neues Thema ist – und macht daraus Vokabeln, Erklärungen und Übungen.</p>
      </section>
      <section class="card photo-card">
        ${apiOk === false ? '<div class="msg almost">Die Fotoerkennung ist gerade nicht erreichbar. Sie funktioniert nur, wenn die Seite auf dem Server läuft.</div>' : ''}
        <div class="photo-buttons">
          <label class="btn primary big-btn ${busy ? 'disabled' : ''}">📷 Foto aufnehmen<input class="vh" type="file" accept="image/*" capture="environment" id="camIn" ${busy ? 'disabled' : ''}></label>
          <label class="btn big-btn ${busy ? 'disabled' : ''}">🖼️ Aus der Galerie<input class="vh" type="file" accept="image/*" multiple id="galIn" ${busy ? 'disabled' : ''}></label>
        </div>
        <div class="thumbs">${photos.map((p, i) => `<figure class="thumb"><img src="${p.url}" alt="Foto ${i + 1}">${busy ? '' : `<button type="button" class="thumb-x" data-rm="${i}" aria-label="Foto ${i + 1} entfernen">×</button>`}</figure>`).join('')}</div>
        <p class="muted small">${photos.length ? `${photos.length} von ${MAX_PHOTOS} Fotos. ` : ''}Tipp: Mehrere Seiten zum selben Thema zusammen auswerten. Gerade von oben und bei gutem Licht fotografieren.</p>
        <div class="actions"><button class="btn primary" id="go" ${!photos.length || busy || apiOk === false ? 'disabled' : ''}>${photos.length > 1 ? `${photos.length} Fotos auswerten` : 'Foto auswerten'}</button></div>
        <div id="status" aria-live="polite">${status}</div>
      </section>
      ${recent.length ? `<section><h2>Zuletzt hinzugefügt</h2><div class="topic-list">${recent.map(topicCard).join('')}</div></section>` : ''}
      <section><h2>Fächer</h2><div class="fach-grid">${faecherList().map((f) => `<a class="fach-chip" href="#/f/${f}"><span>${fachIcon(f)}</span>${esc(fachName(f))}<small>${topicsOf(f).length}</small></a>`).join('')}</div></section>`;

    const add = (files) => {
      for (const f of Array.from(files || [])) {
        if (!f.type.startsWith('image/') && !/\.(heic|heif)$/i.test(f.name)) continue;
        if (photos.length >= MAX_PHOTOS) break;
        photos.push({ file: f, url: URL.createObjectURL(f) });
      }
      lastResult = null;
      renderFotos();
    };
    app.querySelector('#camIn').addEventListener('change', (e) => add(e.target.files));
    app.querySelector('#galIn').addEventListener('change', (e) => add(e.target.files));
    app.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => {
      const [p] = photos.splice(+b.dataset.rm, 1);
      URL.revokeObjectURL(p.url);
      renderFotos();
    }));
    app.querySelector('#go').addEventListener('click', analyzePhotos);
    const cf = app.querySelector('#codeForm');
    if (cf) {
      cf.querySelector('input').focus();
      cf.addEventListener('submit', (e) => {
        e.preventDefault();
        store.prefs.code = cf.querySelector('input').value.trim(); save();
        analyzePhotos();
      });
    }
    if (busy) tickElapsed();
  }
  const MAX_PHOTOS = 8;
  let busyStart = 0;
  function tickElapsed() {
    const el = document.getElementById('elapsed');
    if (!el || !busy) return;
    el.textContent = `(${Math.round((Date.now() - busyStart) / 1000)} s)`;
    setTimeout(tickElapsed, 1000);
  }

  async function shrink(file) {
    const max = 1600;
    let src;
    try {
      src = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (e) {
      src = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('Ein Foto konnte nicht gelesen werden.'));
        i.src = URL.createObjectURL(file);
      });
    }
    const w = src.width, h = src.height, f = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.round(w * f);
    c.height = Math.round(h * f);
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return { type: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.85).split(',')[1] };
  }

  async function analyzePhotos() {
    if (busy || !photos.length) return;
    busy = true;
    busyStart = Date.now();
    lastResult = null;
    if (location.hash !== '#/fotos') location.hash = '#/fotos';
    renderFotos();
    try {
      const images = [];
      for (const p of photos) images.push(await shrink(p.file));
      const r = await fetch(API + '?action=analyze', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify({ images }),
      });
      const d = await r.json().catch(() => ({ error: `Der Server hat nicht richtig geantwortet (${r.status}).` }));
      if (r.status === 401) {
        lastResult = { needCode: true, error: store.prefs.code ? 'Der Zugangscode stimmt nicht. Bitte nochmal eingeben.' : 'Bitte den Zugangscode eingeben.' };
      } else if (!r.ok) {
        lastResult = { error: d.error || `Fehler ${r.status}` };
      } else {
        if (d.themen) setRemote(d.themen);
        lastResult = d;
        if (d.ok) {
          photos.forEach((p) => URL.revokeObjectURL(p.url));
          photos = [];
        }
      }
    } catch (e) {
      lastResult = { error: (e && e.message && !/fetch/i.test(e.message)) ? e.message : 'Keine Verbindung zum Server. Bitte nochmal versuchen.' };
    }
    busy = false;
    if (location.hash === '#/fotos') { renderSide('#/fotos'); renderFotos(); } else renderSide();
  }

  async function deleteTopic(subj) {
    if (!confirm(`Thema „${subj.name}“ wirklich löschen?`)) return;
    const send = () => fetch(API + '?action=delete', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({ id: subj.remote.id }),
    });
    try {
      let r = await send();
      if (r.status === 401) {
        const c = prompt('Zugangscode:');
        if (!c) return;
        store.prefs.code = c.trim(); save();
        r = await send();
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || r.status);
      setRemote(d.themen);
      location.hash = '#/f/' + subj.fach;
    } catch (e) {
      alert('Löschen hat nicht geklappt: ' + e.message);
    }
  }

  // ---------- Themenseite ----------
  function renderSubject(subj, tab, tabs) {
    document.title = `${subj.name} – Lernhilfe`;
    document.body.dataset.subject = ORDER.includes(subj.fach) ? subj.fach : '';
    const t = subj.remote;
    const verlauf = t && t.data && t.data.verlauf ? t.data.verlauf : [];
    app.innerHTML = `
      <nav class="crumbs"><a href="#/f/${subj.fach}">← ${esc(fachName(subj.fach))}</a></nav>
      <header class="subject-head">
        <span class="subject-icon" aria-hidden="true">${subj.icon}</span>
        <div><h1>${esc(subj.name)}</h1><p>${esc(subj.subtitle)}</p></div>
      </header>
      <div class="tabs" role="tablist">${tabs.map(([id, label]) =>
        `<a role="tab" href="${subj.route}/${id}" class="${id === tab ? 'active' : ''}" aria-selected="${id === tab}">${label}</a>`).join('')}</div>
      <div id="view"></div>
      <footer class="topic-foot">
        ${t && !t.static ? `<form class="epoche-form" id="epForm">
          <label for="epIn">Epoche</label>
          <input type="text" id="epIn" list="epList" value="${esc((t.data && t.data.epoche) || '')}" placeholder="z. B. Geometrie" maxlength="100">
          <datalist id="epList">${epochenOf(subj.fach).filter((g) => g.name).map((g) => `<option value="${esc(g.name)}">`).join('')}</datalist>
          <button class="btn" type="submit">Speichern</button>
        </form>` : ''}
        <a class="btn" href="${printLink(subj.fach, epocheOf(t ? { t } : { builtin: true, subj }))}">🖨️ Lern-PDF dieser Epoche</a>
        ${t && t.static ? `<p class="muted small">Epoche: ${esc((t.data && t.data.epoche) || OHNE_EPOCHE)}</p>` : ''}
        ${t && !t.static ? `<p class="muted small">Aus ${verlauf.reduce((n, v) => n + (v.fotos || 0), 0)} Fotos erstellt${verlauf.length > 1 ? ` (${verlauf.length} Auswertungen)` : ''}.
        <button type="button" class="link" id="delTopic">Thema löschen</button></p>` : ''}
      </footer>`;
    const view = document.getElementById('view');
    ({
      vokabeln: renderVocabList,
      karten: renderCards,
      test: renderTest,
      grammatik: renderGrammar,
      wissen: renderGrammar,
      uebungen: renderExercises,
      training: renderTraining,
      leer: (s, v) => { v.innerHTML = '<p class="muted">Zu diesem Thema gibt es noch keine Inhalte.</p>'; },
    })[tab](subj, view);
    const epForm = document.getElementById('epForm');
    if (epForm) epForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = epForm.querySelector('button');
      btn.disabled = true;
      try {
        await apiPost('update', { id: t.id, epoche: epForm.querySelector('input').value });
        btn.textContent = '✔ Gespeichert';
        renderSide();
      } catch (err) {
        alert('Speichern hat nicht geklappt: ' + err.message);
      }
      btn.disabled = false;
    });
    const del = document.getElementById('delTopic');
    if (del) del.addEventListener('click', () => deleteTopic(subj));
    const active = app.querySelector('.tabs .active');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function tipsBox(subj) {
    return `<details class="tips" ${subj.id === 'mathe' ? 'open' : ''}><summary>${subj.tipsTitle || 'So lernst du'}</summary>
      <ol>${subj.tips.map((t) => `<li>${t}</li>`).join('')}</ol></details>`;
  }

  // ---------- Vokabelliste mit Abdeckfunktion ----------
  function renderVocabList(subj, view) {
    const cover = store.prefs.cover || 'none';
    const isEn = subj.id === 'englisch' || allWords(subj).some((w) => w.ex);
    view.innerHTML = `
      ${tipsBox(subj)}
      <div class="toolbar">
        <span class="label">Abdecken:</span>
        <div class="seg" id="cover">
          <button data-c="none">nichts</button>
          <button data-c="de">${deL(subj)}</button>
          <button data-c="fr">${subj.langLabel}</button>
        </div>
      </div>
      <p class="muted small" id="coverHint" ${cover === 'none' ? 'hidden' : ''}>Sag die Übersetzung laut und tippe dann auf das Feld, um nachzuschauen.</p>
      ${subj.vocabGroups.map((g, gi) => `
        <section class="card">
          <h2>${esc(g.title)}</h2>
          <div class="table-wrap"><table class="vocab">
            <thead><tr><th class="num">#</th><th>${subj.langLabel}</th>${isEn ? '<th class="hide-sm">Erklärung</th>' : ''}<th>${deL(subj)}</th></tr></thead>
            <tbody>${allWords(subj, gi).map((w) => `
              <tr>
                <td class="num"><span class="dot b${boxOf(w)}" title="Lernstand"></span></td>
                <td><span class="cell" data-side="fr">${esc(w.fr)}</span> ${speakBtn(w.fr, subj)}</td>
                ${isEn ? `<td class="hide-sm muted">${esc(w.ex || '')}</td>` : ''}
                <td><span class="cell" data-side="de">${esc(w.de)}</span></td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        </section>`).join('')}
      ${subj.pitfalls && subj.pitfalls.length ? `<section class="card warn-card"><h2>Stolperfallen</h2><ul>${subj.pitfalls.map((p) => `<li>${subj.remote ? esc(p) : p}</li>`).join('')}</ul></section>` : ''}
      <p class="legend small muted"><span class="dot b0"></span> neu <span class="dot b1"></span> geübt <span class="dot b2"></span> sicher <span class="dot b4"></span> sitzt</p>`;

    function apply(c) {
      store.prefs.cover = c; save();
      view.querySelectorAll('#cover button').forEach((b) => b.classList.toggle('active', b.dataset.c === c));
      view.querySelectorAll('.cell').forEach((el) => {
        el.classList.toggle('covered', el.dataset.side === c);
        el.classList.remove('revealed');
      });
      view.querySelector('#coverHint').hidden = c === 'none';
    }
    view.querySelector('#cover').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (b) apply(b.dataset.c);
    });
    view.addEventListener('click', (e) => {
      const c = e.target.closest('.cell.covered'); if (c) c.classList.toggle('revealed');
    });
    apply(cover);
  }

  // Gemeinsame Einstellungen für Karten und Test
  function vocabSettings(subj, opts) {
    const groups = subj.vocabGroups.length > 1
      ? `<label>Kapitel <select id="sGroup"><option value="all">alle</option>${subj.vocabGroups.map((g, i) => `<option value="${i}">${esc(g.title)}</option>`).join('')}</select></label>` : '';
    return `<div class="settings card">
      <label>Richtung <select id="sDir">
        <option value="fd">${subj.langLabel} → ${deL(subj)}</option>
        <option value="df">${deL(subj)} → ${subj.langLabel}</option>
        <option value="mix">gemischt</option>
      </select></label>
      ${groups}
      <label>Auswahl <select id="sSel"><option value="all">alle Wörter</option><option value="weak">nur unsichere</option></select></label>
      ${opts.count ? `<label>Anzahl <select id="sCount"><option value="10">10</option><option value="20">20</option><option value="0">alle</option></select></label>` : ''}
      <button class="btn primary" id="sStart">${opts.startLabel}</button>
    </div>`;
  }
  function readSettings(view, subj) {
    const p = store.prefs;
    const q = (id) => view.querySelector(id);
    const s = {
      dir: q('#sDir').value,
      group: q('#sGroup') ? q('#sGroup').value : 'all',
      sel: q('#sSel').value,
      count: q('#sCount') ? +q('#sCount').value : 0,
    };
    p[subj.id + ':settings'] = s; save();
    let words = allWords(subj, s.group);
    if (s.sel === 'weak') {
      const weak = words.filter((w) => boxOf(w) < 2);
      words = weak.length ? weak : words;
    }
    words = shuffle(words);
    if (s.count) words = words.slice(0, s.count);
    return words.map((w) => Object.assign({}, w, {
      dir: s.dir === 'mix' ? (Math.random() < 0.5 ? 'fd' : 'df') : s.dir,
    }));
  }
  function restoreSettings(view, subj) {
    const s = store.prefs[subj.id + ':settings'];
    if (!s) return;
    const set = (id, v) => { const el = view.querySelector(id); if (el && v != null) el.value = String(v); };
    set('#sDir', s.dir); set('#sGroup', s.group); set('#sSel', s.sel); set('#sCount', s.count);
  }

  // ---------- Karteikarten ----------
  function renderCards(subj, view) {
    view.innerHTML = vocabSettings(subj, { startLabel: 'Karten mischen' }) + '<div id="cardArea"></div>';
    restoreSettings(view, subj);
    const area = view.querySelector('#cardArea');
    view.querySelector('#sStart').addEventListener('click', start);
    start();

    function start() {
      let queue = readSettings(view, subj);
      const total = queue.length;
      let known = 0, tries = 0;
      const wrong = new Set();
      next();

      function next() {
        if (!queue.length) {
          area.innerHTML = `<div class="card done">
            <div class="big">🎉</div><h2>Alle Karten geschafft!</h2>
            <p>${total} Karten, ${tries} Versuche. ${wrong.size ? `${wrong.size} Wörter musstest du wiederholen.` : 'Alles auf Anhieb gewusst – stark!'}</p>
            <button class="btn primary" id="again">Nochmal</button></div>`;
          area.querySelector('#again').onclick = start;
          return;
        }
        const w = queue[0];
        const front = w.dir === 'fd' ? w.fr : w.de;
        const back = w.dir === 'fd' ? w.de : w.fr;
        area.innerHTML = `
          <div class="progress-line"><span>${known} / ${total} gewusst</span><span class="progress"><span style="width:${(known / total) * 100}%"></span></span></div>
          <div class="flash" tabindex="0" role="button" aria-label="Karte umdrehen">
            <div class="flash-inner">
              <div class="face front"><small>${w.dir === 'fd' ? subj.langLabel : deL(subj)}</small><div class="word">${esc(front)}</div>${w.dir === 'fd' ? speakBtn(w.fr, subj) : ''}<small class="muted">Tippen zum Umdrehen</small></div>
              <div class="face back"><small>${w.dir === 'fd' ? deL(subj) : subj.langLabel}</small><div class="word">${esc(back)}</div>${w.ex ? `<div class="muted">${esc(w.ex)}</div>` : ''}${w.dir === 'df' ? speakBtn(w.fr, subj) : ''}</div>
            </div>
          </div>
          <div class="rate" hidden>
            <button class="btn bad" id="no">😕 Noch nicht</button>
            <button class="btn good" id="yes">🙂 Gewusst</button>
          </div>`;
        const flash = area.querySelector('.flash');
        const rate = area.querySelector('.rate');
        const flip = () => { flash.classList.add('flipped'); rate.hidden = false; };
        flash.onclick = flip;
        flash.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
        area.querySelector('#yes').onclick = () => {
          tries++; queue.shift();
          if (!wrong.has(w.key)) setBox(w, true);
          known++; next();
        };
        area.querySelector('#no').onclick = () => {
          tries++; setBox(w, false); wrong.add(w.key);
          queue.shift(); queue.splice(Math.min(3, queue.length), 0, w); next();
        };
      }
    }
  }

  // ---------- Vokabeltest (schreiben) ----------
  function accentBar(subj) {
    return subj.accents ? `<div class="accents">${subj.accents.map((a) => `<button type="button" tabindex="-1" data-acc="${a}">${a}</button>`).join('')}</div>` : '';
  }
  function bindAccents(root) {
    let last = null;
    root.addEventListener('focusin', (e) => { if (e.target.matches('input[type=text]')) last = e.target; });
    root.addEventListener('mousedown', (e) => { if (e.target.closest('[data-acc]')) e.preventDefault(); });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-acc]');
      if (!b) return;
      const inp = last || root.querySelector('input[type=text]');
      if (!inp || inp.readOnly) return;
      const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? inp.value.length;
      inp.value = inp.value.slice(0, s) + b.dataset.acc + inp.value.slice(en);
      inp.focus();
      inp.setSelectionRange(s + b.dataset.acc.length, s + b.dataset.acc.length);
    });
  }

  function renderTest(subj, view) {
    view.innerHTML = vocabSettings(subj, { startLabel: 'Test starten', count: true }) + '<div id="testArea"></div>';
    restoreSettings(view, subj);
    const area = view.querySelector('#testArea');
    bindAccents(area);
    view.querySelector('#sStart').addEventListener('click', () => start());
    start();

    function start(words) {
      const list = words || readSettings(view, subj);
      let i = 0, right = 0;
      const mistakes = [];
      ask();

      function ask() {
        if (i >= list.length) return finish();
        const w = list[i];
        const prompt = w.dir === 'fd' ? w.fr : w.de;
        const target = w.dir === 'fd' ? w.de : w.fr;
        area.innerHTML = `
          <div class="progress-line"><span>Frage ${i + 1} / ${list.length} · ${right} richtig</span><span class="progress"><span style="width:${(i / list.length) * 100}%"></span></span></div>
          <form class="card quiz" autocomplete="off">
            <small class="muted">Gesucht: ${w.dir === 'fd' ? deL(subj) : subj.langLabel}</small>
            <div class="word">${esc(prompt)} ${w.dir === 'fd' ? speakBtn(w.fr, subj) : ''}</div>
            ${w.ex && w.dir === 'df' ? `<div class="muted small">Tipp: ${esc(w.ex)}</div>` : ''}
            <input type="text" class="answer" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Deine Antwort">
            ${w.dir === 'df' ? accentBar(subj) : ''}
            <div class="feedback" aria-live="polite"></div>
            <div class="actions"><button class="btn primary" type="submit">Prüfen</button></div>
          </form>`;
        const form = area.querySelector('form');
        const inp = form.querySelector('input');
        const fb = form.querySelector('.feedback');
        const actions = form.querySelector('.actions');
        inp.focus();
        let checked = false;
        form.onsubmit = (e) => {
          e.preventDefault();
          if (checked) { i++; return ask(); }
          if (!inp.value.trim()) { inp.focus(); return; }
          checked = true;
          const r = checkVocab(inp.value, target, w.dir === 'fd');
          inp.readOnly = true;
          inp.classList.add(r);
          if (r === 'ok') {
            right++; setBox(w, true);
            fb.innerHTML = `<div class="msg ok">✔ Richtig! <b>${esc(target)}</b></div>`;
          } else {
            setBox(w, false); mistakes.push(w);
            fb.innerHTML = `<div class="msg ${r}">${r === 'almost' ? '≈ Fast! Achte auf Accents / Artikel.' : '✘ Leider nicht.'} Richtig: <b>${esc(target)}</b></div>
              <button type="button" class="link" id="override">Ich hatte doch recht</button>`;
            fb.querySelector('#override').onclick = () => {
              right++; setBox(w, true); mistakes.pop();
              fb.innerHTML = `<div class="msg ok">✔ Als richtig gezählt.</div>`;
              actions.querySelector('button').focus();
            };
          }
          actions.innerHTML = `<button class="btn primary" type="submit">${i + 1 < list.length ? 'Weiter' : 'Auswertung'}</button>`;
          actions.querySelector('button').focus();
        };
      }

      function finish() {
        const pct = list.length ? Math.round((right / list.length) * 100) : 0;
        area.innerHTML = `<div class="card done">
          <div class="big">${pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
          <h2>${right} von ${list.length} richtig (${pct} %)</h2>
          ${mistakes.length ? `<p>Diese Wörter solltest du noch üben:</p>
            <ul class="mistakes">${mistakes.map((w) => `<li><b>${esc(w.fr)}</b> – ${esc(w.de)}</li>`).join('')}</ul>
            <button class="btn primary" id="redo">Fehler nochmal üben</button>` : '<p>Fehlerfrei – super!</p>'}
          <button class="btn" id="again">Neuer Test</button></div>`;
        const redo = area.querySelector('#redo');
        if (redo) redo.onclick = () => start(shuffle(mistakes));
        area.querySelector('#again').onclick = () => start();
      }
    }
  }

  // ---------- Grammatik / Wissen ----------
  function renderGrammar(subj, view) {
    view.innerHTML = (subj.id === 'mathe' ? tipsBox(subj) : '') +
      subj.grammar.map((g, i) => `<section class="card gram" id="g${i}"><h2>${esc(g.title)}</h2>${g.html}</section>`).join('') +
      (subj.remote && subj.pitfalls.length && !allWords(subj).length
        ? `<section class="card warn-card"><h2>Stolperfallen</h2><ul>${subj.pitfalls.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></section>` : '') +
      (subj.exercises && subj.exercises.length ? `<div class="next"><a class="btn primary" href="${subj.route}/uebungen">Weiter zu den Übungen →</a></div>` : '');
  }

  // ---------- Übungen ----------
  function blankHtml(spec, idx) {
    if (typeof spec === 'object' && !Array.isArray(spec)) {
      return `<span class="numwrap"><input type="text" inputmode="decimal" class="blank num" data-i="${idx}" aria-label="Lücke ${idx + 1}">${spec.u ? `<span class="unit">${spec.u}</span>` : ''}</span>`;
    }
    const len = Math.max(...spec.map((s) => s.length));
    const wide = len > 22;
    return `<input type="text" class="blank${wide ? ' wide' : ''}" data-i="${idx}" style="${wide ? '' : `width:${len > 10 ? 16 : 10}ch`}" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Lücke ${idx + 1}">`;
  }
  function solutionText(item) {
    if (item.choice) return item.a;
    if (item.open) return esc(item.answer);
    const parts = item.a.map((s) => (Array.isArray(s) ? s[0] : `${fmtNum(s.n)}${s.u ? ' ' + s.u : ''}`));
    let t = parts.join(' · ');
    if (item.sol) t += ` <span class="muted">(${esc(item.sol)})</span>`;
    else if (item.note) t += ` <span class="muted">(${esc(item.note)})</span>`;
    return t;
  }

  function renderExercises(subj, view) {
    view.innerHTML = `<p class="muted">Fülle die Lücken aus und drücke <b>Prüfen</b>. Grün = richtig, Gelb = fast (Accent oder Kleinigkeit), Rot = nochmal überlegen. Die Lösungen erst am Ende anschauen!</p>` +
      subj.exercises.map((ex) => {
        const st = store.ex[subj.id + '|' + ex.id];
        return `<section class="card exercise" data-ex="${ex.id}">
          <h2>${esc(ex.title)} ${st ? `<span class="badge ${st.best === st.total ? 'full' : ''}">${st.best}/${st.total}</span>` : ''}</h2>
          ${ex.intro ? `<p class="muted">${esc(ex.intro)}</p>` : ''}
          ${ex.wordbox ? `<p class="chips wordbox">${ex.wordbox.map((w) => `<span>${esc(w)}</span>`).join('')}</p>` : ''}
          <ol class="items">${ex.items.map((it, ii) => {
            let bi = 0;
            let q;
            if (it.open) {
              q = `${esc(it.q)}<textarea class="open-answer" rows="2" aria-label="Deine Antwort" placeholder="Deine Antwort (oder im Kopf beantworten)"></textarea>`;
            } else if (it.choice) {
              q = esc(it.q).replace('___', `<span class="choice" role="radiogroup">${it.choice.map((c) => `<button type="button" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</span>`);
            } else {
              q = esc(it.q).replace(/___/g, () => blankHtml(it.a[bi], bi++));
            }
            return `<li data-ii="${ii}">${it.fig ? `<div class="figwrap">${it.fig}</div>` : ''}
              <div class="q">${q}${it.hint ? ` <span class="hint">(${esc(it.hint)})</span>` : ''}</div>
              <div class="sol" hidden>Lösung: ${solutionText(it)}</div></li>`;
          }).join('')}</ol>
          ${subj.accents ? accentBar(subj) : ''}
          <div class="result" aria-live="polite"></div>
          <div class="actions">
            <button class="btn primary" data-act="check">Prüfen</button>
            <button class="btn" data-act="solve">Lösungen zeigen</button>
            <button class="btn ghost" data-act="reset">Leeren</button>
          </div>
        </section>`;
      }).join('');

    view.querySelectorAll('.exercise').forEach((sec) => {
      const ex = subj.exercises.find((x) => x.id === sec.dataset.ex);
      bindAccents(sec);
      const inputs = Array.from(sec.querySelectorAll('input.blank'));
      inputs.forEach((inp, k) => {
        inp.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (inputs[k + 1]) inputs[k + 1].focus(); else check();
        });
        inp.addEventListener('input', () => inp.classList.remove('ok', 'almost', 'wrong'));
      });
      sec.addEventListener('click', (e) => {
        const c = e.target.closest('.choice button');
        if (c) {
          c.parentElement.querySelectorAll('button').forEach((b) => b.classList.remove('sel', 'ok', 'wrong'));
          c.classList.add('sel');
          return;
        }
        const a = e.target.closest('[data-act]');
        if (!a) return;
        if (a.dataset.act === 'check') check();
        if (a.dataset.act === 'solve') sec.querySelectorAll('.sol').forEach((s) => (s.hidden = false));
        if (a.dataset.act === 'reset') {
          inputs.forEach((i) => { i.value = ''; i.classList.remove('ok', 'almost', 'wrong'); });
          sec.querySelectorAll('textarea').forEach((t) => { t.value = ''; });
          sec.querySelectorAll('.choice button').forEach((b) => b.classList.remove('sel', 'ok', 'wrong'));
          sec.querySelectorAll('.sol').forEach((s) => (s.hidden = true));
          sec.querySelector('.result').innerHTML = '';
        }
      });

      function check() {
        let right = 0, total = 0, almost = 0;
        ex.items.forEach((it, ii) => {
          const li = sec.querySelector(`li[data-ii="${ii}"]`);
          if (it.open) { li.querySelector('.sol').hidden = false; return; }
          if (it.choice) {
            total++;
            const sel = li.querySelector('.choice .sel');
            if (sel) {
              const ok = sel.dataset.c === it.a;
              sel.classList.add(ok ? 'ok' : 'wrong');
              if (ok) right++;
            }
            return;
          }
          li.querySelectorAll('input.blank').forEach((inp) => {
            total++;
            const spec = it.a[+inp.dataset.i];
            let r;
            if (Array.isArray(spec)) r = compare(inp.value, spec);
            else r = numOk(inp.value, spec.n) ? 'ok' : 'wrong';
            if (!inp.value.trim()) r = 'wrong';
            inp.classList.remove('ok', 'almost', 'wrong');
            inp.classList.add(r);
            if (r === 'ok') right++;
            if (r === 'almost') almost++;
          });
        });
        const key = subj.id + '|' + ex.id;
        if (!total) {
          // nur offene Fragen: Musterlösungen zeigen, selbst vergleichen
          store.ex[key] = { best: 1, total: 1 };
          save();
          sec.querySelector('.result').innerHTML = '<div class="msg ok">Vergleiche deine Antworten mit den Musterlösungen unter jeder Frage.</div>';
          return;
        }
        const prev = store.ex[key];
        store.ex[key] = { best: Math.max(right, prev ? prev.best : 0), total };
        save();
        const badge = sec.querySelector('h2 .badge');
        const st = store.ex[key];
        const bhtml = `<span class="badge ${st.best === st.total ? 'full' : ''}">${st.best}/${st.total}</span>`;
        if (badge) badge.outerHTML = bhtml; else sec.querySelector('h2').insertAdjacentHTML('beforeend', ' ' + bhtml);
        sec.querySelector('.result').innerHTML = right === total
          ? `<div class="msg ok">🎉 Alles richtig – ${right} von ${total}!</div>`
          : `<div class="msg ${right / total >= 0.5 ? 'almost' : 'wrong'}">${right} von ${total} richtig${almost ? ` · ${almost}× fast (Accent/Schreibweise prüfen)` : ''}. Verbessere die markierten Lücken und prüfe nochmal.</div>`;
      }
    });
  }

  // ---------- Mathe-Training ----------
  function renderTraining(subj, view) {
    const T = L.trainer;
    let chosen = store.prefs.trainTopics || T.topics.map((t) => t.id);
    let score = 0, count = 0, streak = 0;
    view.innerHTML = `
      <p class="muted">Hier bekommst du immer neue Zufallsaufgaben. Wähle die Themen aus:</p>
      <div class="chips selectable" id="topics">${T.topics.map((t) => `<button type="button" data-t="${t.id}">${t.label}</button>`).join('')}</div>
      <div id="trainArea"></div>`;
    const topicsEl = view.querySelector('#topics');
    const area = view.querySelector('#trainArea');
    const syncTopics = () => topicsEl.querySelectorAll('button').forEach((b) => b.classList.toggle('sel', chosen.includes(b.dataset.t)));
    topicsEl.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const t = b.dataset.t;
      chosen = chosen.includes(t) ? chosen.filter((x) => x !== t) : chosen.concat(t);
      if (!chosen.length) chosen = [t];
      store.prefs.trainTopics = chosen; save();
      syncTopics(); next();
    });
    syncTopics();
    next();

    function next() {
      const topic = T.topics.filter((t) => chosen.includes(t.id));
      const tp = topic[Math.floor(Math.random() * topic.length)];
      const task = tp.gen();
      area.innerHTML = `
        <div class="progress-line"><span>${score} / ${count} richtig</span><span>${streak >= 3 ? `🔥 ${streak} in Folge` : ''}</span></div>
        <form class="card quiz" autocomplete="off">
          <small class="muted">${tp.label}</small>
          <div class="q big-q">${esc(task.q).replace('___', `<span class="numwrap"><input type="text" inputmode="decimal" class="blank num answer-inline" aria-label="Ergebnis"><span class="unit">${task.u || ''}</span></span>`)}</div>
          <div class="feedback" aria-live="polite"></div>
          <div class="actions"><button class="btn primary" type="submit">Prüfen</button><button class="btn ghost" type="button" id="skip">Andere Aufgabe</button></div>
        </form>`;
      const form = area.querySelector('form');
      const inp = form.querySelector('input');
      inp.focus();
      form.querySelector('#skip').onclick = next;
      let done = false;
      form.onsubmit = (e) => {
        e.preventDefault();
        if (done) return next();
        if (!inp.value.trim()) return inp.focus();
        done = true; count++;
        const ok = numOk(inp.value, task.n);
        inp.readOnly = true;
        inp.classList.add(ok ? 'ok' : 'wrong');
        if (ok) { score++; streak++; } else streak = 0;
        form.querySelector('.feedback').innerHTML = `<div class="msg ${ok ? 'ok' : 'wrong'}">${ok ? '✔ Richtig!' : `✘ Richtig ist <b>${fmtNum(task.n)} ${task.u || ''}</b>`}<br><span class="small">${esc(task.sol)}</span></div>`;
        form.querySelector('.actions').innerHTML = '<button class="btn primary" type="submit">Nächste Aufgabe</button>';
        form.querySelector('.actions button').focus();
        area.querySelector('.progress-line span').textContent = `${score} / ${count} richtig`;
      };
    }
  }

  // ---------- Fortschritt zurücksetzen ----------
  document.getElementById('resetAll').addEventListener('click', () => {
    const k = currentKid();
    if (!k || !confirm(`Den Lernstand von ${k.name} löschen (auf allen Geräten)?`)) return;
    store = Object.assign(emptyStore(), { prefs: store.prefs, _reset: Date.now() });
    save();
    route();
  });

  ORDER.forEach((id) => { L[id].route = '#/' + id; L[id].fach = id; });
  loadRemote();
  route();
  if (currentKid()) syncKid();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && currentKid()) syncKid(); });
  window.addEventListener('online', () => { if (currentKid()) syncKid(); });
})();
