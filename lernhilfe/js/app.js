(function () {
  'use strict';

  const L = window.LERN;
  const ORDER = ['mathe', 'englisch', 'franz'];
  const app = document.getElementById('app');

  // ---------- Speicher (nur auf diesem Gerät) ----------
  const KEY = 'lernhilfe:v1';
  let store = { vocab: {}, ex: {}, prefs: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) store = Object.assign(store, JSON.parse(raw));
  } catch (e) { /* ohne Speicher weiter */ }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* egal */ }
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
    subj.vocabGroups.forEach((g, gi) => {
      if (group != null && group !== 'all' && +group !== gi) return;
      g.words.forEach((w) => out.push({ fr: w[0], de: w[1], ex: w[2], key: subj.id + '|' + w[0], group: gi }));
    });
    return out;
  }
  const boxOf = (w) => store.vocab[w.key] || 0;
  function setBox(w, ok) {
    const b = boxOf(w);
    store.vocab[w.key] = ok ? Math.min(4, b + 1) : 0;
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
    if (!busy && (!h || h === '#/' || h.startsWith('#/t/') || h.startsWith('#/f/'))) route(true);
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
      grammarLabel: lang ? 'Grammatik' : 'Wissen',
      vocabGroups: voc.length ? [{ title: 'Vokabeln', words: voc.map((v) => [v.begriff, v.bedeutung, v.erklaerung || '']) }] : [],
      pitfalls: d.stolperfallen || [],
      grammar: (d.grammatik || []).map((g) => ({ title: g.titel, html: md(g.inhalt) })),
      exercises: (d.uebungen || []).map((u, i) => ({
        id: 'u' + i,
        title: u.titel,
        intro: u.anleitung,
        items: (u.aufgaben || []).map((a) => ({
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
    remote.filter((t) => t.fach === fach).forEach((t) => out.push({ subj: topicSubj(t), title: t.titel, t }));
    return out;
  }
  function faecherList() {
    const set = new Set(ORDER);
    remote.forEach((t) => set.add(t.fach));
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
    const list = faecherList();
    if (currentFach && !list.includes(currentFach)) currentFach = '';
    const topics = currentFach ? topicsOf(currentFach) : [];
    const here = activeRoute || location.hash;
    side.innerHTML = `
      <a class="side-photo ${!here || here === '#/' ? 'active' : ''}" href="#/">📷 Neue Fotos</a>
      <label class="side-label" for="fachSel">Fach</label>
      <select id="fachSel">
        <option value="">– Fach wählen –</option>
        ${list.map((f) => `<option value="${f}" ${f === currentFach ? 'selected' : ''}>${fachIcon(f)} ${fachName(f)}</option>`).join('')}
      </select>
      ${currentFach ? `<nav class="side-topics" aria-label="Themen">
        <a href="#/f/${currentFach}" class="${here === '#/f/' + currentFach ? 'active' : ''}">Alle Themen in ${esc(fachName(currentFach))}</a>
        ${topics.map((x) => `<a href="${x.subj.route}" class="${here.startsWith(x.subj.route + '/') || here === x.subj.route ? 'active' : ''}">${esc(x.title)}${x.builtin ? '' : x.t.basis ? ' <span class="tag">Ergänzung</span>' : ''}</a>`).join('')}
      </nav>` : ''}`;
    side.querySelector('#fachSel').addEventListener('change', (e) => {
      currentFach = e.target.value;
      store.prefs.fach = currentFach; save();
      location.hash = currentFach ? '#/f/' + currentFach : '#/';
    });
  }

  // ---------- Routing ----------
  function route(keepScroll) {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (keepScroll !== true) window.scrollTo(0, 0);
    let subj = null, tabPart = null;
    if (parts[0] === 'f' && parts[1]) {
      currentFach = parts[1];
      store.prefs.fach = currentFach; save();
      renderSide();
      return renderFach(parts[1]);
    }
    if (parts[0] === 't' && parts[1]) {
      const t = remote.find((x) => String(x.id) === parts[1]);
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
    if (!subj) { renderSide('#/'); return renderFotos(); }
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
      <div class="topic-list">${topics.map((x) => topicCard(x)).join('') || '<p class="muted">Noch keine Themen.</p>'}</div>
      <a class="btn" href="#/">📷 Neue Fotos zu ${esc(fachName(fach))} hinzufügen</a>`;
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
        ${r.basis ? ` <a class="btn" href="#/${esc(r.fach)}">Zum Lernheft</a>` : ''}
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
    if (location.hash && location.hash !== '#/') location.hash = '#/';
    renderFotos();
    try {
      const images = [];
      for (const p of photos) images.push(await shrink(p.file));
      const r = await fetch(API + '?action=analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Lernhilfe-Code': store.prefs.code || '' },
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
    if (!location.hash || location.hash === '#/') { renderSide('#/'); renderFotos(); } else renderSide();
  }

  async function deleteTopic(subj) {
    if (!confirm(`Thema „${subj.name}“ wirklich löschen?`)) return;
    const send = () => fetch(API + '?action=delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Lernhilfe-Code': store.prefs.code || '' },
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
      ${t ? `<footer class="topic-foot muted small">
        Aus ${verlauf.reduce((n, v) => n + (v.fotos || 0), 0)} Fotos erstellt${verlauf.length > 1 ? ` (${verlauf.length} Auswertungen)` : ''}.
        <button type="button" class="link" id="delTopic">Thema löschen</button></footer>` : ''}`;
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
            if (it.choice) {
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
          sec.querySelectorAll('.choice button').forEach((b) => b.classList.remove('sel', 'ok', 'wrong'));
          sec.querySelectorAll('.sol').forEach((s) => (s.hidden = true));
          sec.querySelector('.result').innerHTML = '';
        }
      });

      function check() {
        let right = 0, total = 0, almost = 0;
        ex.items.forEach((it, ii) => {
          const li = sec.querySelector(`li[data-ii="${ii}"]`);
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
    if (!confirm('Den gesamten Lernstand auf diesem Gerät löschen?')) return;
    store = { vocab: {}, ex: {}, prefs: {} };
    save();
    route();
  });

  ORDER.forEach((id) => { L[id].route = '#/' + id; L[id].fach = id; });
  loadRemote();
  route();
})();
