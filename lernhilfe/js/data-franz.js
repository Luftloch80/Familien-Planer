// Lernhilfe Französisch – Vocabulaire Chapitres 1–3 · Le passé récent
window.LERN = window.LERN || {};
window.LERN.franz = {
  id: 'franz',
  name: 'Französisch',
  icon: '🇫🇷',
  subtitle: 'Vocabulaire Chapitre 1–3 (Voisins et amis · Les étrangers) · Le passé récent',
  langLabel: 'Français',
  accents: ['é', 'è', 'ê', 'à', 'â', 'ç', 'ù', 'û', 'î', 'ï', 'ô', 'ë', 'œ', '’'],
  tips: [
    'Vokabeln laut lesen – auf die Accents achten!',
    'Vokabeltest machen (beide Richtungen).',
    'Grammatik lesen und die Übungen machen.',
    'Erst am Ende die Lösungen anschauen.',
  ],
  vocabGroups: [
    {
      title: 'Chapitre 1 (Ende)',
      words: [
        ['aller chercher', 'holen'],
        ['la clé', 'der Schlüssel'],
      ],
    },
    {
      title: 'Chapitre 2 – Voisins et amis',
      words: [
        ['s’adresser à qn', 'sich an jdn. wenden'],
        ['suivre', 'folgen'],
        ['à droite', 'rechts'],
        ['à côté de', 'neben'],
        ['juif / juive', 'jüdisch'],
        ['pêcher', 'fischen'],
        ['jamais', 'nie, niemals'],
        ['essayer', 'versuchen'],
        ['Tu vas voir.', 'Du wirst sehen.'],
        ['C’est toi.', 'Das bist du.'],
        ['Bienvenue !', 'Willkommen!'],
        ['en face', 'gegenüber'],
        ['le voisin / la voisine', 'der Nachbar / die Nachbarin'],
        ['Chouette !', 'Toll!'],
      ],
    },
    {
      title: 'Chapitre 3 – Les étrangers',
      words: [
        ['d’où', 'woher'],
        ['d’ici', 'von hier, hierher'],
        ['bizarre', 'komisch'],
        ['étrange', 'merkwürdig'],
        ['un étranger / une étrangère', 'ein Fremder / eine Fremde'],
        ['la plupart', 'die meisten'],
        ['quitter', 'verlassen'],
        ['à cause de', 'wegen'],
        ['passer les vacances', 'die Ferien verbringen'],
        ['le temps libre', 'die Freizeit'],
        ['au bord de', 'hier: am Ufer'],
        ['être de mauvaise humeur', 'schlechter Laune sein'],
        ['s’installer', 'sich niederlassen'],
        ['tranquille', 'ruhig (hier: in Ruhe)'],
        ['vide', 'leer'],
        ['en bas', 'unten'],
        ['prudent / prudente', 'vorsichtig'],
        ['une robe', 'ein Kleid'],
        ['propre', 'sauber'],
        ['siffler', 'pfeifen'],
        ['d’un air furieux', 'wütend'],
        ['Allez-vous en !', 'Verschwindet!'],
        ['Qu’est-ce qui se passe ?', 'Was ist los?'],
        ['s’en aller', 'weggehen (hier: verschwinden)'],
        ['commencer à faire qc', 'anfangen, etw. zu tun'],
        ['se battre', 'sich schlagen'],
        ['le bruit', 'das Geräusch'],
        ['séparer', 'trennen'],
        ['les adolescents', 'die Jugendlichen'],
        ['se sauver', 'fliehen'],
        ['être puni', 'bestraft werden'],
        ['injuste', 'ungerecht'],
        ['décider', 'beschließen'],
        ['se venger', 'sich rächen'],
      ],
    },
  ],
  pitfalls: [
    '<b>jamais</b> steht im Satz mit <b>ne</b>: <i>Je ne pêche jamais.</i> (Ich angle nie.)',
    '<b>à côté de / à cause de / au bord de</b> + le → <b>du</b>: <i>à côté du parc, à cause du bruit</i> · + les → <b>des</b>',
    '<b>la plupart des</b> + Plural, Verb im Plural: <i>La plupart des voisins sont gentils.</i>',
    '<b>quitter</b> braucht immer ein Objekt: <i>Il quitte la maison.</i> (ohne Objekt: <i>Il part.</i>)',
    '<b>s’en aller</b>: je m’en vais, tu t’en vas, il s’en va … · Befehl: <i>Va-t’en ! / Allez-vous en !</i>',
    'Reflexive Verben (s’installer, se battre, se sauver, se venger): je <b>me</b> …, tu <b>te</b> …, il <b>se</b> …, nous <b>nous</b> …, vous <b>vous</b> …, ils <b>se</b> …',
    '<b>commencer à</b> + Infinitiv: <i>Ils commencent à se battre.</i>',
  ],
  grammar: [
    {
      title: 'Le passé récent – gerade eben passiert',
      html: `
        <div class="rule">venir (Präsens) + <b>de</b> + Infinitiv</div>
        <p>Mit dem <b>passé récent</b> sagst du, dass etwas <b>gerade eben</b> passiert ist. Im Deutschen übersetzt man es mit „gerade“ + Perfekt.</p>
        <div class="table-wrap"><table>
          <thead><tr><th>Person</th><th>venir</th><th>Beispiel</th></tr></thead>
          <tbody>
            <tr><td>je</td><td><b>viens</b></td><td>Je viens de manger.</td></tr>
            <tr><td>tu</td><td><b>viens</b></td><td>Tu viens de finir.</td></tr>
            <tr><td>il / elle / on</td><td><b>vient</b></td><td>Elle vient de rentrer.</td></tr>
            <tr><td>nous</td><td><b>venons</b></td><td>Nous venons de regarder un film.</td></tr>
            <tr><td>vous</td><td><b>venez</b></td><td>Vous venez d’arriver.</td></tr>
            <tr><td>ils / elles</td><td><b>viennent</b></td><td>Ils viennent de partir.</td></tr>
          </tbody>
        </table></div>
        <h4>Wichtige Hinweise</h4>
        <ul class="checks">
          <li>Vor Vokal oder stummem h wird <b>de → d’</b>: <i>Il vient d’arriver. Nous venons d’entrer.</i></li>
          <li>Bei reflexiven Verben passt das Pronomen zur Person: <i>Je viens de <b>me</b> lever. Nous venons de <b>nous</b> installer.</i></li>
          <li>Verneinung um <b>venir</b> herum: <i>Je <b>ne</b> viens <b>pas</b> de manger.</i></li>
          <li>Achtung: <b>vient</b> und <b>viennent</b> – im Plural doppeltes <b>n</b>!</li>
        </ul>`,
    },
    {
      title: 'Nicht verwechseln: passé récent ↔ futur proche',
      html: `
        <div class="table-wrap"><table>
          <thead><tr><th></th><th>Passé récent (gerade eben)</th><th>Futur proche (gleich, bald)</th></tr></thead>
          <tbody>
            <tr><td>Bildung</td><td><b>venir + de</b> + Infinitiv</td><td><b>aller</b> + Infinitiv</td></tr>
            <tr><td>Beispiel</td><td>Je viens de manger.<br><span class="muted">Ich habe gerade gegessen.</span></td><td>Je vais manger.<br><span class="muted">Ich werde gleich essen.</span></td></tr>
            <tr><td>Zeitstrahl</td><td>← kurz vor JETZT</td><td>kurz nach JETZT →</td></tr>
          </tbody>
        </table></div>
        <div class="merke"><b>Merke dir:</b> „Ich komme gerade von etwas“ → <i>je viens de …</i> = es ist gerade vorbei.</div>`,
    },
  ],
  exercises: [
    {
      id: 'lt',
      title: 'Lückentext – Vocabulaire',
      intro: 'Setze das passende Wort ein.',
      items: [
        { q: 'Les ___ ont ___ leur maison à cause de la guerre.', hint: 'die Fremden · verlassen', a: [['étrangers'], ['quitté']] },
        { q: 'Notre ___ habite ___ – juste de l’autre côté de la rue.', hint: 'Nachbar · gegenüber', a: [['voisin'], ['en face']] },
        { q: 'Le dimanche, mon père va ___ au bord de la rivière.', hint: 'fischen', a: [['pêcher']] },
        { q: 'Les deux garçons commencent à ___. Le professeur doit les ___.', hint: 'sich schlagen · trennen', a: [['se battre'], ['séparer']] },
        { q: '« ___ ? » – « Rien, je suis juste de mauvaise humeur. »', hint: 'Was ist los?', a: [['Qu’est-ce qui se passe']] },
        { q: 'Il ne mange ___ de viande.', hint: 'nie', a: [['jamais']] },
      ],
    },
    {
      id: 'A',
      title: 'Übung A – Die richtige Form von venir',
      intro: 'Setze die richtige Form von venir ein.',
      items: [
        { q: 'Nous ___ de quitter la maison.', a: [['venons']] },
        { q: 'Elle ___ de s’installer à côté de nous.', a: [['vient']] },
        { q: 'Tu ___ de siffler ?', a: [['viens']] },
        { q: 'Les adolescents ___ de se sauver.', a: [['viennent']] },
        { q: 'Je ___ d’essayer.', a: [['viens']] },
        { q: 'Vous ___ de décider ?', a: [['venez']] },
      ],
    },
    {
      id: 'B',
      title: 'Übung B – Ins passé récent setzen',
      intro: 'Schreibe den ganzen Satz im passé récent.',
      items: [
        { q: 'Il quitte la ville. → ___', a: [['Il vient de quitter la ville.']] },
        { q: 'Nous passons les vacances au bord de la mer. → ___', a: [['Nous venons de passer les vacances au bord de la mer.']] },
        { q: 'Les voisins arrivent. → ___', a: [['Les voisins viennent d’arriver.']] },
        { q: 'Je me lève. → ___', a: [['Je viens de me lever.']] },
        { q: 'Elles se battent. → ___', a: [['Elles viennent de se battre.']] },
      ],
    },
    {
      id: 'C',
      title: 'Übung C – Passé récent oder futur proche?',
      intro: 'Übersetze ins Französische.',
      items: [
        { q: 'Ich habe gerade den Schlüssel geholt. → ___', a: [['Je viens d’aller chercher la clé.']], note: 'passé récent' },
        { q: 'Wir werden gleich fischen. → ___', a: [['Nous allons pêcher.', 'On va pêcher.']], note: 'futur proche' },
        { q: 'Die Nachbarin ist gerade angekommen. → ___', a: [['La voisine vient d’arriver.']], note: 'passé récent' },
        { q: 'Er wird sich rächen. → ___', a: [['Il va se venger.']], note: 'futur proche' },
        { q: 'Ihr seid gerade bestraft worden. → ___', a: [['Vous venez d’être punis.', 'Vous venez d’être punies.']], note: 'passé récent' },
      ],
    },
    {
      id: 'D',
      title: 'Übung D – Finde den Fehler',
      intro: 'Schreibe den Satz richtig.',
      items: [
        { q: 'Je viens de arriver. → ___', a: [['Je viens d’arriver.']], note: 'Vokal → d’' },
        { q: 'Ils vienent de partir. → ___', a: [['Ils viennent de partir.']], note: 'doppeltes n' },
        { q: 'Nous venons de se lever. → ___', a: [['Nous venons de nous lever.']], note: 'Pronomen passt zur Person' },
      ],
    },
  ],
};
