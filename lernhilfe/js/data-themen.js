// Themen, die aus Fotos von Schulmaterial erstellt wurden (werden hier im Repo gepflegt).
//
// Aufbau eines Themas:
// {
//   id: 'mathe-geometrie-1',          // eindeutig, nur a-z, 0-9 und -
//   fach: 'mathe',                    // mathe, englisch, franz, deutsch, latein, spanisch, bio, physik,
//                                     // chemie, geschichte, erdkunde, musik, religion, sonstiges
//   titel: 'Winkel',
//   updated_at: '2026-11-20',
//   data: {
//     epoche: 'Geometrie',            // leer = Fachunterricht ohne Epoche
//     zusammenfassung: '…',
//     sprache: '',                    // en, fr, es, la bei Vokabeln einer Fremdsprache, sonst leer
//     vokabeln: [{ begriff: '…', bedeutung: '…', erklaerung: '' }],
//     stolperfallen: ['…'],
//     grammatik: [{ titel: '…', inhalt: 'Markdown: **fett**, *kursiv*, - Listen, | Tabellen |, ### Überschrift, > Merksatz' }],
//     uebungen: [{
//       titel: '…', anleitung: '…',
//       aufgaben: [{ frage: 'Text mit ___ als Lücke', hinweis: '', erklaerung: '',
//                    luecken: [{ loesungen: ['richtig', 'auch richtig'], einheit: '' }] }],
//     }],
//   },
// }
window.LERN = window.LERN || {};
window.LERN.themen = [];
