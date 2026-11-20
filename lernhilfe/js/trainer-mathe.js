// Zufallsaufgaben für das Mathe-Training
(function () {
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const round = (x) => Math.round(x * 1e6) / 1e6;
  const fmt = (x) =>
    round(x).toLocaleString('de-DE', { maximumFractionDigits: 6 }).replace(/\./g, ' ');

  const CHAINS = {
    Länge: { units: [['mm', 1], ['cm', 10], ['dm', 100], ['m', 1000], ['km', 1e6]], step: 10 },
    Fläche: { units: [['mm²', 1], ['cm²', 100], ['dm²', 1e4], ['m²', 1e6], ['a', 1e8], ['ha', 1e10], ['km²', 1e12]], step: 100 },
    Volumen: { units: [['mm³', 1], ['cm³', 1e3], ['dm³', 1e6], ['m³', 1e9]], step: 1000 },
  };

  function einheiten() {
    // Liter-Aufgaben extra
    if (Math.random() < 0.2) {
      const t = pick([
        () => { const v = pick([1, 2, 3, 4, 5, 1.5, 2.5, 0.5, 0.25, 12]); return { q: `${fmt(v)} l = ___`, n: v * 1000, u: 'cm³', sol: `1 l = 1 dm³ = 1000 cm³ → ${fmt(v)} · 1000 = ${fmt(v * 1000)} cm³` }; },
        () => { const v = pick([500, 1500, 2500, 3000, 750, 250, 4000]); return { q: `${fmt(v)} cm³ = ___`, n: v / 1000, u: 'l', sol: `1000 cm³ = 1 l → ${fmt(v)} : 1000 = ${fmt(v / 1000)} l` }; },
        () => { const v = pick([1, 2, 3, 0.5, 1.5]); return { q: `${fmt(v)} m³ = ___`, n: v * 1000, u: 'l', sol: `1 m³ = 1000 l → ${fmt(v)} · 1000 = ${fmt(v * 1000)} l` }; },
        () => { const v = pick([2, 5, 12, 0.5, 1.5]); return { q: `${fmt(v)} dm³ = ___`, n: v, u: 'l', sol: '1 dm³ = 1 l' }; },
      ]);
      return t();
    }
    const kind = pick(Object.keys(CHAINS));
    const { units, step } = CHAINS[kind];
    for (;;) {
      const i = rnd(0, units.length - 1);
      const dist = Math.random() < 0.7 ? 1 : 2;
      const j = Math.random() < 0.5 ? i + dist : i - dist;
      if (j < 0 || j >= units.length) continue;
      // km nur von/zu m
      if (kind === 'Länge' && (units[i][0] === 'km' || units[j][0] === 'km')) {
        if (units[Math.min(i, j)][0] !== 'm' || Math.abs(i - j) !== 1) continue;
      }
      const v = pick([rnd(1, 9), rnd(2, 99), pick([0.5, 1.5, 2.5, 3.5, 0.25, 0.75, 4.5, 12.5]), rnd(1, 9) * 100, rnd(11, 99) * 100]);
      const res = round((v * units[i][1]) / units[j][1]);
      if (res < 0.01 || res > 5e6) continue;
      const factor = units[i][1] / units[j][1];
      const big = factor > 1;
      const f = big ? factor : 1 / factor;
      const realStep = kind === 'Länge' && (units[i][0] === 'km' || units[j][0] === 'km') ? 1000 : step;
      const sol = `${kind}: Faktor ${fmt(realStep)} pro Schritt. ${big ? 'Zur kleineren Einheit → malnehmen' : 'Zur größeren Einheit → teilen'}: ${fmt(v)} ${big ? '·' : ':'} ${fmt(f)} = ${fmt(res)} ${units[j][0]}`;
      return { q: `${fmt(v)} ${units[i][0]} = ___`, n: res, u: units[j][0], sol };
    }
  }

  function rechteck() {
    const t = rnd(0, 4);
    const a = rnd(3, 15), b = rnd(2, 12), unit = pick(['cm', 'm']);
    if (t === 0) return { q: `Rechteck: a = ${a} ${unit}, b = ${b} ${unit}. Fläche A = ___`, n: a * b, u: unit + '²', sol: `A = a · b = ${a} · ${b} = ${a * b} ${unit}²` };
    if (t === 1) return { q: `Rechteck: a = ${a} ${unit}, b = ${b} ${unit}. Umfang u = ___`, n: 2 * a + 2 * b, u: unit, sol: `u = 2 · a + 2 · b = ${2 * a} + ${2 * b} = ${2 * a + 2 * b} ${unit}` };
    if (t === 2) return { q: `Quadrat: a = ${a} ${unit}. Fläche A = ___`, n: a * a, u: unit + '²', sol: `A = a · a = ${a} · ${a} = ${a * a} ${unit}²` };
    if (t === 3) return { q: `Ein Rechteck hat A = ${a * b} ${unit}² und a = ${a} ${unit}. Wie lang ist b? b = ___`, n: b, u: unit, sol: `b = A : a = ${a * b} : ${a} = ${b} ${unit}` };
    return { q: `Ein Rechteck hat u = ${2 * a + 2 * b} ${unit} und a = ${a} ${unit}. Wie lang ist b? b = ___`, n: b, u: unit, sol: `2 · ${a} = ${2 * a}, ${2 * a + 2 * b} − ${2 * a} = ${2 * b}, ${2 * b} : 2 = ${b} ${unit}` };
  }

  function dreieck() {
    let g = rnd(3, 16), h = rnd(2, 12);
    if ((g * h) % 2) g += 1;
    if (Math.random() < 0.25) {
      return { q: `Ein Dreieck hat A = ${(g * h) / 2} cm² und g = ${g} cm. Wie hoch ist es? h = ___`, n: h, u: 'cm', sol: `A · 2 = ${g * h}, ${g * h} : ${g} = ${h} cm` };
    }
    return { q: `Dreieck: g = ${g} cm, h = ${h} cm. A = ___`, n: (g * h) / 2, u: 'cm²', sol: `A = g · h : 2 = ${g} · ${h} : 2 = ${g * h} : 2 = ${(g * h) / 2} cm²` };
  }

  function volumen() {
    if (Math.random() < 0.35) {
      const a = rnd(2, 10);
      return { q: `Würfel mit a = ${a} cm. Volumen V = ___`, n: a ** 3, u: 'cm³', sol: `V = a · a · a = ${a} · ${a} · ${a} = ${a ** 3} cm³` };
    }
    const a = rnd(2, 12), b = rnd(2, 10), c = rnd(2, 10);
    if (Math.random() < 0.25) {
      const A = a * 10, B = b * 5, C = c * 5; // Aquarium in Liter
      const v = A * B * C;
      return { q: `Ein Aquarium ist ${A} cm lang, ${B} cm breit und ${C} cm hoch. Wie viele Liter passen hinein? ___`, n: v / 1000, u: 'l', sol: `V = ${A} · ${B} · ${C} = ${fmt(v)} cm³ = ${fmt(v / 1000)} l` };
    }
    return { q: `Quader: a = ${a} cm, b = ${b} cm, c = ${c} cm. Volumen V = ___`, n: a * b * c, u: 'cm³', sol: `V = a · b · c = ${a} · ${b} · ${c} = ${a * b * c} cm³` };
  }

  function oberflaeche() {
    if (Math.random() < 0.4) {
      const a = rnd(2, 12);
      return { q: `Würfel mit a = ${a} cm. Oberfläche O = ___`, n: 6 * a * a, u: 'cm²', sol: `O = 6 · a² = 6 · ${a * a} = ${6 * a * a} cm²` };
    }
    const a = rnd(2, 10), b = rnd(2, 8), c = rnd(1, 6);
    const o = 2 * a * b + 2 * a * c + 2 * b * c;
    return { q: `Quader: a = ${a} cm, b = ${b} cm, c = ${c} cm. Oberfläche O = ___`, n: o, u: 'cm²', sol: `O = 2·${a}·${b} + 2·${a}·${c} + 2·${b}·${c} = ${2 * a * b} + ${2 * a * c} + ${2 * b * c} = ${o} cm²` };
  }

  window.LERN = window.LERN || {};
  window.LERN.trainer = {
    fmt,
    topics: [
      { id: 'einheiten', label: 'Einheiten umrechnen', gen: einheiten },
      { id: 'rechteck', label: 'Rechteck & Quadrat', gen: rechteck },
      { id: 'dreieck', label: 'Dreieck', gen: dreieck },
      { id: 'volumen', label: 'Volumen', gen: volumen },
      { id: 'oberflaeche', label: 'Oberfläche', gen: oberflaeche },
    ],
  };
})();
