// Lernhilfe Mathe – Fläche, Volumen, Oberfläche, Einheiten
(function () {
  const S = 22; // Pixel pro cm in den Skizzen

  // Zeichnet ein Polygon (Koordinaten in cm, y nach unten) mit Beschriftungen.
  function fig(w, h, shapes, labels, extra = '') {
    const pad = 34;
    const vw = w * S + pad * 2;
    const vh = h * S + pad * 2;
    const p = (x, y) => `${x * S + pad},${y * S + pad}`;
    let out = `<svg class="fig" viewBox="0 0 ${vw} ${vh}" style="max-width:${vw}px" role="img" aria-label="Skizze">`;
    for (const sh of shapes) {
      const cls = sh.cls || 'shape';
      if (sh.rect) {
        const [x, y, rw, rh] = sh.rect;
        out += `<rect class="${cls}" x="${x * S + pad}" y="${y * S + pad}" width="${rw * S}" height="${rh * S}"/>`;
      } else if (sh.line) {
        const [x1, y1, x2, y2] = sh.line;
        out += `<line class="${cls}" x1="${x1 * S + pad}" y1="${y1 * S + pad}" x2="${x2 * S + pad}" y2="${y2 * S + pad}"/>`;
      } else {
        out += `<polygon class="${cls}" points="${sh.pts.map(([x, y]) => p(x, y)).join(' ')}"/>`;
      }
    }
    for (const [x, y, t, anchor] of labels) {
      out += `<text x="${x * S + pad}" y="${y * S + pad}" text-anchor="${anchor || 'middle'}" dominant-baseline="middle">${t}</text>`;
    }
    return out + extra + '</svg>';
  }

  const lShape = (cls) => ({ pts: [[0, 0], [4, 0], [4, 5], [10, 5], [10, 8], [0, 8]], cls });

  const figZerlegen = fig(10, 8, [
    { rect: [0, 0, 4, 8], cls: 'shape part1' },
    { rect: [4, 5, 6, 3], cls: 'shape part2' },
    lShape('outline'),
  ], [
    [2, -0.7, '4 cm'], [-0.4, 4, '8 cm', 'end'], [10.4, 6.5, '3 cm', 'start'], [5, 8.8, '10 cm'],
    [2, 4, '①'], [7, 6.5, '②'], [7, 4.4, '6 cm'],
  ]);

  const figErgaenzen = fig(10, 8, [
    { rect: [0, 0, 10, 8], cls: 'shape dashed' },
    { rect: [4, 0, 6, 5], cls: 'shape missing' },
    lShape('outline'),
  ], [
    [2, -0.7, '4 cm'], [-0.4, 4, '8 cm', 'end'], [10.4, 6.5, '3 cm', 'start'], [5, 8.8, '10 cm'],
    [7, 2.5, 'fehlt'], [10.4, 2.5, '5 cm', 'start'],
  ]);

  const figT = fig(9, 7, [
    { pts: [[0, 0], [9, 0], [9, 2], [6, 2], [6, 7], [3, 7], [3, 2], [0, 2]] },
  ], [
    [4.5, -0.7, '9'], [-0.4, 1, '2', 'end'], [4.5, 7.7, '3'], [6.4, 4.5, '5', 'start'],
  ]);

  const figLoch = fig(12, 8, [
    { rect: [0, 0, 12, 8] },
    { rect: [4, 2.5, 4, 3], cls: 'hole' },
  ], [
    [6, -0.7, '12'], [-0.4, 4, '8', 'end'], [6, 2, '4'], [8.4, 4, '3', 'start'],
  ]);

  const figTreppe = fig(9, 6, [
    { pts: [[0, 6], [0, 4], [3, 4], [3, 2], [6, 2], [6, 0], [9, 0], [9, 6]] },
  ], [
    [1.5, 3.4, '3'], [4.5, 1.4, '3'], [7.5, -0.6, '3'],
    [-0.4, 5, '2', 'end'], [9.4, 3, '6', 'start'], [4.5, 6.7, '9'],
  ]);

  const figDreieck = fig(10, 6, [
    { rect: [0, 0, 10, 6], cls: 'shape dashed' },
    { pts: [[0, 6], [10, 6], [3.5, 0]] },
    { line: [3.5, 0, 3.5, 6], cls: 'height' },
  ], [
    [5, 6.8, 'g = 10 cm'], [3.8, 3.3, 'h = 6 cm', 'start'],
  ], `<rect class="rightangle" x="${3.5 * S + 34}" y="${6 * S + 34 - 10}" width="10" height="10"/>`);

  // Quader in Schrägbild
  const figQuader = (() => {
    const a = 170, c = 90, dx = 55, dy = 40, x0 = 30, y0 = 30 + dy;
    const f = [x0, y0], g = [x0 + a, y0], hh = [x0 + a, y0 + c], e = [x0, y0 + c];
    const o = (q) => [q[0] + dx, q[1] - dy];
    const pt = (q) => q.join(',');
    return `<svg class="fig" viewBox="0 0 ${a + dx + 110} ${c + dy + 80}" style="max-width:${a + dx + 110}px" role="img" aria-label="Quader">
      <polygon class="shape" points="${[f, g, hh, e].map(pt).join(' ')}"/>
      <polygon class="shape part2" points="${[f, o(f), o(g), g].map(pt).join(' ')}"/>
      <polygon class="shape part1" points="${[g, o(g), o(hh), hh].map(pt).join(' ')}"/>
      <line class="height" x1="${e[0] + dx}" y1="${e[1] - dy}" x2="${e[0]}" y2="${e[1]}"/>
      <line class="height" x1="${e[0] + dx}" y1="${e[1] - dy}" x2="${hh[0] + dx}" y2="${hh[1] - dy}"/>
      <line class="height" x1="${e[0] + dx}" y1="${e[1] - dy}" x2="${f[0] + dx}" y2="${f[1] - dy}"/>
      <text x="${x0 + a / 2}" y="${y0 + c + 20}" text-anchor="middle">a = Länge</text>
      <text x="${x0 + a + dx / 2 + 8}" y="${y0 + c - dy / 2 + 14}" text-anchor="start">b = Breite</text>
      <text x="${x0 + a + dx + 8}" y="${y0 - dy + c / 2}" text-anchor="start">c = Höhe</text>
    </svg>`;
  })();

  window.LERN = window.LERN || {};
  window.LERN.mathe = {
    id: 'mathe',
    name: 'Mathe',
    icon: '📐',
    subtitle: 'Flächenberechnung · Dreieck · Volumen · Oberfläche · Einheiten umrechnen',
    tips: [
      'Skizze machen und Maße eintragen.',
      'Formel hinschreiben.',
      'Zahlen einsetzen – vorher alles in dieselbe Einheit umrechnen!',
      'Ausrechnen (Nebenrechnung) und das Ergebnis mit Einheit doppelt unterstreichen.',
    ],
    tipsTitle: 'Die 4 goldenen Regeln beim Rechnen',
    grammarLabel: 'Wissen',
    grammar: [
      {
        title: 'Alle Formeln auf einen Blick',
        html: `
          <div class="table-wrap"><table>
            <thead><tr><th>Figur / Körper</th><th>Fläche A bzw. Volumen V</th><th>Umfang u bzw. Oberfläche O</th><th>Einheit</th></tr></thead>
            <tbody>
              <tr><td>Rechteck</td><td><b>A = a · b</b></td><td>u = 2 · a + 2 · b</td><td>cm², m² …</td></tr>
              <tr><td>Quadrat</td><td><b>A = a · a = a²</b></td><td>u = 4 · a</td><td>cm², m² …</td></tr>
              <tr><td>Dreieck</td><td><b>A = g · h : 2</b></td><td>u = alle 3 Seiten addieren</td><td>cm², m² …</td></tr>
              <tr><td>Quader</td><td><b>V = a · b · c</b></td><td>O = 2·a·b + 2·a·c + 2·b·c</td><td>V: cm³ · O: cm²</td></tr>
              <tr><td>Würfel</td><td><b>V = a · a · a = a³</b></td><td>O = 6 · a²</td><td>V: cm³ · O: cm²</td></tr>
            </tbody>
          </table></div>
          <h4>Woran erkenne ich, was gefragt ist?</h4>
          <ul>
            <li><b>Umfang</b> = der Rand rundherum (Zaun, Bordüre) → Länge: cm, m</li>
            <li><b>Fläche</b> = was drinnen liegt (Teppich, Rasen, Fliesen) → cm², m² („hoch 2“, weil 2 Längen mal genommen)</li>
            <li><b>Volumen</b> = was hineinpasst (Wasser, Sand, Würfel) → cm³, m³, Liter („hoch 3“, weil 3 Längen)</li>
            <li><b>Oberfläche</b> = alle Außenflächen eines Körpers (Geschenkpapier, Farbe) → cm², m²</li>
          </ul>`,
      },
      {
        title: 'Einheiten umrechnen',
        html: `
          <div class="merke"><b>Merke:</b> Je „größer“ die Hochzahl, desto größer die Umrechnungszahl. Zur <b>größeren</b> Einheit → <b>teilen</b>, zur <b>kleineren</b> Einheit → <b>malnehmen</b>.</div>
          <div class="table-wrap"><table>
            <thead><tr><th></th><th>Längen (Faktor 10)</th><th>Flächen (Faktor 100)</th><th>Volumen (Faktor 1000)</th></tr></thead>
            <tbody>
              <tr><td>Kette</td><td>mm → cm → dm → m<br>m → km: · 1000</td><td>mm² → cm² → dm² → m² → a → ha → km²</td><td>mm³ → cm³ → dm³ → m³</td></tr>
              <tr><td>Beispiel</td><td>1 m = 10 dm = 100 cm = 1000 mm</td><td>1 m² = 100 dm² = 10 000 cm²</td><td>1 m³ = 1000 dm³ = 1 000 000 cm³</td></tr>
              <tr><td>Komma</td><td>1 Stelle schieben</td><td>2 Stellen schieben</td><td>3 Stellen schieben</td></tr>
            </tbody>
          </table></div>
          <div class="two-col">
            <div class="box"><h4>Ar und Hektar</h4>
              <p>1 a (Ar) = 100 m² – z. B. ein Feld 10 m × 10 m<br>
              1 ha (Hektar) = 100 a = 10 000 m² – z. B. 100 m × 100 m<br>
              1 km² = 100 ha<br><span class="muted">Ein Fußballfeld ist etwa 0,7 ha groß.</span></p></div>
            <div class="box"><h4>Liter und Kubik</h4>
              <p>1 dm³ = 1 l (Liter)<br>1 cm³ = 1 ml (Milliliter)<br>1 m³ = 1000 l<br>1 l = 1000 ml = 1000 cm³<br>
              <span class="muted">Ein Würfel mit 10 cm Kante fasst genau 1 Liter.</span></p></div>
          </div>
          <h4>Beispiele – Schritt für Schritt</h4>
          <div class="table-wrap"><table>
            <thead><tr><th>Aufgabe</th><th>Rechnung</th><th>Ergebnis</th></tr></thead>
            <tbody>
              <tr><td>3,5 m in cm (Länge)</td><td>größer → kleiner: · 100</td><td><b>350 cm</b></td></tr>
              <tr><td>4 m² in dm² (Fläche)</td><td>1 Schritt bei Flächen: · 100</td><td><b>400 dm²</b></td></tr>
              <tr><td>25 000 m² in ha</td><td>m² → a: : 100 = 250 a; a → ha: : 100</td><td><b>2,5 ha</b></td></tr>
              <tr><td>3 dm³ in cm³</td><td>1 Schritt bei Volumen: · 1000</td><td><b>3000 cm³</b></td></tr>
              <tr><td>1500 cm³ in Liter</td><td>cm³ → dm³: : 1000 = 1,5 dm³</td><td><b>1,5 l</b></td></tr>
            </tbody>
          </table></div>
          <div class="warn"><b>Typischer Fehler:</b> 1 m² ist nicht 100 cm², sondern <b>10 000 cm²</b> (100 cm · 100 cm). Bei Flächen immer 2 Nullen pro Schritt, bei Volumen 3!</div>`,
      },
      {
        title: 'Zusammengesetzte Flächen',
        html: `
          <p>Schwierige Figuren zerlegt man mit Hilfslinien in Rechtecke. Fehlende Strecken findet man so: <b>lange Strecke minus kurze Strecke</b>.</p>
          <div class="two-col">
            <div class="box"><h4>Weg 1: Zerlegen</h4>${figZerlegen}
              <p>① 4 cm · 8 cm = 32 cm²<br>② 6 cm · 3 cm = 18 cm²<br><b>A = 32 + 18 = 50 cm²</b></p></div>
            <div class="box"><h4>Weg 2: Ergänzen</h4>${figErgaenzen}
              <p>großes Rechteck: 10 · 8 = 80 cm²<br>fehlendes Stück: 6 · 5 = 30 cm²<br><b>A = 80 − 30 = 50 cm²</b></p></div>
          </div>
          <p>Fehlende Strecken: 10 − 4 = 6 cm und 8 − 3 = 5 cm. Beide Wege geben dasselbe Ergebnis – so kannst du dich selbst kontrollieren!</p>
          <div class="merke"><b>Loch in der Fläche?</b> Große Fläche minus Loch. Beispiel: Rahmen 12 m × 8 m mit Fenster 4 m × 3 m → 96 − 12 = 84 m²</div>`,
      },
      {
        title: 'Die Fläche beim Dreieck',
        html: `
          <div class="rule">A = g · h : 2</div>
          <p><b>g</b> = Grundlinie, <b>h</b> = Höhe (steht senkrecht auf g).</p>
          ${figDreieck}
          <p><b>Warum : 2?</b> Jedes Dreieck ist genau die Hälfte eines Rechtecks mit g und h (gestrichelt).</p>
          <p>Beispiel: A = 10 cm · 6 cm : 2 = 60 : 2 = <b>30 cm²</b></p>`,
      },
      {
        title: 'Volumen von Quader und Würfel',
        html: `
          <div class="rule">V = a · b · c</div>
          <p>Das Volumen sagt, wie viele 1-cm-Würfel in den Körper passen.</p>
          ${figQuader}
          <p><b>Würfel:</b> alle Kanten gleich lang → V = a · a · a = a³</p>
          <h4>Musteraufgabe Quader: a = 5 cm, b = 12 cm, c = 8,5 cm</h4>
          <div class="table-wrap"><table><tbody>
            <tr><td>Formel</td><td>V = a · b · c</td></tr>
            <tr><td>Einsetzen</td><td>V = 5 cm · 12 cm · 8,5 cm</td></tr>
            <tr><td>Nebenrechnung</td><td>5 · 12 = 60 (im Kopf) → 60 · 8,5 = 480 + 30 = 510</td></tr>
            <tr><td>Ergebnis</td><td><b>V = 510 cm³</b> (Kubikzentimeter) = 0,51 l</td></tr>
          </tbody></table></div>
          <p>Würfel mit a = 3 cm: V = 3 · 3 · 3 = <b>27 cm³</b></p>`,
      },
      {
        title: 'Oberfläche von Quader und Würfel',
        html: `
          <p>Die Oberfläche ist die Summe aller <b>6 Seitenflächen</b>. Beim Quader sind immer 2 Flächen gleich (vorne/hinten, oben/unten, links/rechts) – deshalb steht überall „2 ·“.</p>
          <div class="table-wrap"><table>
            <thead><tr><th>Fläche</th><th>Rechnung (a = 5 cm, b = 3 cm, c = 2 cm)</th><th>Ergebnis</th></tr></thead>
            <tbody>
              <tr><td>oben + unten</td><td>2 · a · b = 2 · 5 · 3</td><td>30 cm²</td></tr>
              <tr><td>vorne + hinten</td><td>2 · a · c = 2 · 5 · 2</td><td>20 cm²</td></tr>
              <tr><td>links + rechts</td><td>2 · b · c = 2 · 3 · 2</td><td>12 cm²</td></tr>
              <tr><td><b>Oberfläche O</b></td><td>30 + 20 + 12</td><td><b>62 cm²</b></td></tr>
            </tbody>
          </table></div>
          <p><b>Würfel</b> (6 gleiche Quadrate): O = 6 · a². Mit a = 3 cm: O = 6 · 9 = <b>54 cm²</b></p>
          <div class="warn"><b>Nicht verwechseln:</b> Volumen hat ³ (cm³) – Oberfläche hat ² (cm²). Beim Würfel: V = a³ (a·a·a), aber O = 6·a² (6·a·a).</div>`,
      },
    ],
    exercises: [
      {
        id: '1',
        title: 'Übung 1 – Rechteck und Quadrat',
        intro: 'Fläche und Umfang. Gib nur die Zahl ein – die Einheit steht schon da.',
        items: [
          { q: 'Rechteck: a = 9 cm, b = 6 cm → A = ___ , u = ___', a: [{ n: 54, u: 'cm²' }, { n: 30, u: 'cm' }] },
          { q: 'Quadrat: a = 7 m → A = ___ , u = ___', a: [{ n: 49, u: 'm²' }, { n: 28, u: 'm' }] },
          { q: 'Ein Garten ist 25 m lang und 16 m breit. Wie groß ist er? ___ = ___', a: [{ n: 400, u: 'm²' }, { n: 4, u: 'a' }] },
          { q: 'Ein Rechteck hat A = 72 cm² und a = 8 cm. Wie lang ist b? b = ___', a: [{ n: 9, u: 'cm' }], sol: '72 : 8 = 9 cm' },
          { q: 'Ein Rechteck hat u = 30 cm und a = 10 cm. Berechne b und A. b = ___ , A = ___', a: [{ n: 5, u: 'cm' }, { n: 50, u: 'cm²' }], sol: '2 · 10 = 20, 30 − 20 = 10, 10 : 2 → b = 5 cm; A = 50 cm²' },
        ],
      },
      {
        id: '2',
        title: 'Übung 2 – Zusammengesetzte Flächen',
        intro: 'Maße in cm. Überlege, wo du Hilfslinien einzeichnen würdest!',
        items: [
          { fig: figT, q: 'a) A = ___', a: [{ n: 33, u: 'cm²' }], sol: 'Balken 9 · 2 = 18 + Stiel 3 · 5 = 15 → 33 cm²' },
          { fig: figLoch, q: 'b) A = ___ (ohne Loch)', a: [{ n: 84, u: 'cm²' }], sol: '12 · 8 = 96 − Loch 4 · 3 = 12 → 84 cm²' },
          { fig: figTreppe, q: 'c) A = ___', a: [{ n: 36, u: 'cm²' }], sol: 'drei Säulen: 3 · 2 + 3 · 4 + 3 · 6 = 6 + 12 + 18 → 36 cm²' },
        ],
      },
      {
        id: '3',
        title: 'Übung 3 – Dreiecke',
        items: [
          { q: 'g = 8 cm, h = 5 cm → A = ___', a: [{ n: 20, u: 'cm²' }], sol: '8 · 5 : 2 = 20 cm²' },
          { q: 'g = 11,5 cm, h = 4 cm → A = ___', a: [{ n: 23, u: 'cm²' }], sol: '11,5 · 4 : 2 = 23 cm²' },
          { q: '★ Ein Dreieck hat A = 24 cm² und g = 8 cm. Wie hoch ist es? h = ___', a: [{ n: 6, u: 'cm' }], sol: '24 · 2 = 48, 48 : 8 → h = 6 cm' },
        ],
      },
      {
        id: '4',
        title: 'Übung 4 – Einheiten umrechnen',
        items: [
          { q: '3 m = ___', a: [{ n: 300, u: 'cm' }] },
          { q: '45 mm = ___', a: [{ n: 4.5, u: 'cm' }] },
          { q: '5 cm² = ___', a: [{ n: 500, u: 'mm²' }] },
          { q: '2 m² = ___', a: [{ n: 200, u: 'dm²' }] },
          { q: '3 ha = ___ = ___', a: [{ n: 300, u: 'a' }, { n: 30000, u: 'm²' }] },
          { q: '750 a = ___', a: [{ n: 7.5, u: 'ha' }] },
          { q: '2 dm³ = ___', a: [{ n: 2000, u: 'cm³' }] },
          { q: '4 l = ___', a: [{ n: 4000, u: 'cm³' }] },
          { q: '2500 cm³ = ___', a: [{ n: 2.5, u: 'l' }] },
        ],
      },
      {
        id: '5',
        title: 'Übung 5 – Volumen im Kopf',
        items: [
          { q: 'l = 4 cm, b = 5 cm, h = 2 cm → V = ___', a: [{ n: 40, u: 'cm³' }] },
          { q: 'l = 10 m, b = 3 m, h = 6 m → V = ___', a: [{ n: 180, u: 'm³' }] },
          { q: 'Würfel mit 4 cm Kantenlänge → V = ___', a: [{ n: 64, u: 'cm³' }] },
          { q: 'Würfel mit 10 cm Kantenlänge → V = ___ = ___', a: [{ n: 1000, u: 'cm³' }, { n: 1, u: 'l' }] },
        ],
      },
      {
        id: '6',
        title: 'Übung 6 – Oberfläche',
        items: [
          { q: 'Quader: a = 6 cm, b = 4 cm, c = 2 cm → O = ___', a: [{ n: 88, u: 'cm²' }], sol: '2·24 + 2·12 + 2·8 = 48 + 24 + 16 = 88 cm²' },
          { q: 'Würfel: a = 5 cm → O = ___', a: [{ n: 150, u: 'cm²' }], sol: '6 · 25 = 150 cm²' },
        ],
      },
      {
        id: '7',
        title: 'Übung 7 – Textaufgaben',
        intro: 'Skizze – Formel – Einsetzen – Ausrechnen!',
        items: [
          { q: 'Ein Aquarium ist 60 cm lang, 30 cm breit und 40 cm hoch. Wie viele Liter Wasser passen hinein? ___', a: [{ n: 72, u: 'l' }], sol: '60 · 30 · 40 = 72 000 cm³ = 72 l' },
          { q: 'Ein Zimmer ist 5 m lang und 4 m breit. Teppich kostet 30 € pro m². Was kostet der Teppich? ___', a: [{ n: 600, u: '€' }], sol: '5 · 4 = 20 m², 20 · 30 € = 600 €' },
          { q: 'Ein würfelförmiges Geschenk hat 20 cm Kantenlänge. Wie viel Geschenkpapier braucht man mindestens? ___', a: [{ n: 2400, u: 'cm²' }], sol: '6 · 20 · 20 = 2400 cm²' },
          { q: 'Ein Feld ist 200 m lang und 150 m breit. Wie viel Hektar sind das? ___', a: [{ n: 3, u: 'ha' }], sol: '200 · 150 = 30 000 m² = 3 ha' },
        ],
      },
      {
        id: '8',
        title: 'Übung 8 – Forscheraufgabe: Was passiert beim Verdoppeln?',
        items: [
          { q: 'a = 5 cm: Fläche Quadrat a² = ___ , Volumen Würfel a³ = ___', a: [{ n: 25, u: 'cm²' }, { n: 125, u: 'cm³' }] },
          { q: 'a = 10 cm: Fläche Quadrat a² = ___ , Volumen Würfel a³ = ___', a: [{ n: 100, u: 'cm²' }, { n: 1000, u: 'cm³' }] },
          { q: 'a = 20 cm: Fläche Quadrat a² = ___ , Volumen Würfel a³ = ___', a: [{ n: 400, u: 'cm²' }, { n: 8000, u: 'cm³' }] },
          { q: 'a = 40 cm: Fläche Quadrat a² = ___', a: [{ n: 1600, u: 'cm²' }] },
          { q: 'Wenn ich die Seitenlänge verdopple, wird die Fläche ___-mal so groß und das Volumen ___-mal so groß.', a: [{ n: 4 }, { n: 8 }], sol: 'Fläche 4-mal (2·2), Volumen 8-mal (2·2·2)' },
        ],
      },
    ],
  };
})();
