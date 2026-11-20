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
window.LERN.themen = [
 {
  "id": "bio-skelett-gelenke-muskeln",
  "fach": "bio",
  "titel": "Skelett, Gelenke und Muskeln",
  "updated_at": "2026-11-20",
  "data": {
   "epoche": "Menschenkunde",
   "zusammenfassung": "Skelettarten, Knochen (lateinische Namen), Knochenaufbau und -typen, Fuß, Hand, Wirbelsäule, Gelenke, Sehnen und Bänder, Muskeln, Muskelkater.",
   "sprache": "la",
   "wissen_titel": "Wissen",
   "vokabeln": [
    {
     "begriff": "Cranium",
     "bedeutung": "Schädel",
     "erklaerung": ""
    },
    {
     "begriff": "Orbita",
     "bedeutung": "Augenhöhle",
     "erklaerung": ""
    },
    {
     "begriff": "Maxilla",
     "bedeutung": "Oberkiefer",
     "erklaerung": ""
    },
    {
     "begriff": "Mandibula",
     "bedeutung": "Unterkiefer",
     "erklaerung": ""
    },
    {
     "begriff": "Vertebrae cervicales",
     "bedeutung": "Halswirbel",
     "erklaerung": ""
    },
    {
     "begriff": "Columna vertebralis",
     "bedeutung": "Wirbelsäule",
     "erklaerung": ""
    },
    {
     "begriff": "Thorax",
     "bedeutung": "Brustkorb",
     "erklaerung": ""
    },
    {
     "begriff": "Sternum",
     "bedeutung": "Brustbein",
     "erklaerung": ""
    },
    {
     "begriff": "Costae",
     "bedeutung": "Rippen",
     "erklaerung": ""
    },
    {
     "begriff": "Arcus costalis",
     "bedeutung": "Rippenbogen",
     "erklaerung": ""
    },
    {
     "begriff": "Clavicula",
     "bedeutung": "Schlüsselbein",
     "erklaerung": ""
    },
    {
     "begriff": "Scapula",
     "bedeutung": "Schulterblatt",
     "erklaerung": ""
    },
    {
     "begriff": "Humerus",
     "bedeutung": "Oberarmknochen",
     "erklaerung": ""
    },
    {
     "begriff": "Radius",
     "bedeutung": "Speiche",
     "erklaerung": ""
    },
    {
     "begriff": "Ulna",
     "bedeutung": "Elle",
     "erklaerung": ""
    },
    {
     "begriff": "Ossa carpi",
     "bedeutung": "Handwurzelknochen",
     "erklaerung": ""
    },
    {
     "begriff": "Os ilium",
     "bedeutung": "Darmbein",
     "erklaerung": ""
    },
    {
     "begriff": "Os sacrum",
     "bedeutung": "Kreuzbein",
     "erklaerung": ""
    },
    {
     "begriff": "Os pubis",
     "bedeutung": "Schambein",
     "erklaerung": ""
    },
    {
     "begriff": "Os ischii",
     "bedeutung": "Sitzbein",
     "erklaerung": ""
    },
    {
     "begriff": "Femur",
     "bedeutung": "Oberschenkelknochen",
     "erklaerung": ""
    },
    {
     "begriff": "Trochanter major / minor",
     "bedeutung": "großer / kleiner Rollhügel",
     "erklaerung": ""
    },
    {
     "begriff": "Patella",
     "bedeutung": "Kniescheibe",
     "erklaerung": ""
    },
    {
     "begriff": "Tibia",
     "bedeutung": "Schienbein",
     "erklaerung": ""
    },
    {
     "begriff": "Fibula",
     "bedeutung": "Wadenbein",
     "erklaerung": ""
    },
    {
     "begriff": "Calcaneus",
     "bedeutung": "Fersenbein",
     "erklaerung": ""
    },
    {
     "begriff": "Ossa tarsi",
     "bedeutung": "Fußwurzelknochen",
     "erklaerung": ""
    },
    {
     "begriff": "Hallux",
     "bedeutung": "großer Zeh",
     "erklaerung": ""
    },
    {
     "begriff": "Digitus II",
     "bedeutung": "zweiter Zeh",
     "erklaerung": ""
    },
    {
     "begriff": "Gluteus maximus",
     "bedeutung": "großer Gesäßmuskel",
     "erklaerung": ""
    }
   ],
   "stolperfallen": [
    "Sehne = Muskel mit Knochen, Band = Knochen mit Knochen",
    "Fuß 26, Hand 27: Unterschied nur in der Wurzel (7 und 8)",
    "Kahnbein gibt es in Fuß und Hand; Keilbein, Würfelbein, Fersenbein nur im Fuß",
    "Speiche = Daumenseite, Elle = Seite des kleinen Fingers",
    "Großer Zeh und Daumen: je 2 Knochen, alle anderen 3",
    "Schienbein = Tibia, Wadenbein = Fibula, Speiche = Radius, Elle = Ulna",
    "Im Heft korrigieren: S. 4 Schienbein (nicht „Schienenbein“), Zehenknochen (nicht „Zehnknochen“)",
    "Im Heft korrigieren: S. 9 Sesambeine schützen die Sehnen (nicht „vor Sehnen“)",
    "Im Heft korrigieren: S. 12 Grundglied/Endglied (nicht „Grundzehe/Endzehe“), Fersenbein (nicht „Fersbein“)",
    "Im Heft korrigieren: S. 16 Hakenbein (nicht „Hackenbein“) · S. 1–2 Hydroskelett, Zytoskelett, Außenskelett mit einem l"
   ],
   "grammatik": [
    {
     "titel": "Die wichtigsten Zahlen auf einen Blick",
     "inhalt": "| Was | Zahl |\n|---|---|\n| Knochen pro Fuß | **26** (zusammen 52): 7 Fußwurzel · 5 Mittelfuß · 14 Zehen |\n| Knochen pro Hand | **27**: 8 Handwurzel · 5 Mittelhand · 14 Finger |\n| freie Wirbel | **24**: 7 Hals, 12 Brust, 5 Lende |\n| Abschnitte der Wirbelsäule | **5** |\n| Gelenkarten | **5** |\n| Knochentypen | **6** |\n| Muskelkater | nach **24–36 Stunden**, bis zu 1 Woche |"
    },
    {
     "titel": "1 · Was ist ein Skelett? (Heft S. 1–2)",
     "inhalt": "Skelett kommt vom griechischen **„skeletós“** und bedeutet „ausgetrockneter Körper“ oder „Gerippe“. Es ist die stabile Struktur, die Lebewesen Form gibt und Bewegung ermöglicht. Nicht jedes Skelett besteht aus Knochen.\n\n| Art | Merkmale | Beispiele |\n|---|---|---|\n| **Zytoskelett** („unsichtbares Skelett“) | Netzwerk aus feinen Fasern in jeder Zelle; stabilisiert die Zelle und hilft ihr, sich zu bewegen; mit bloßem Auge nicht sichtbar | Pflanze, Tier, Mensch |\n| **Hydroskelett** | kein festes Skelett; Form durch Flüssigkeitsdruck. Muskeln arbeiten gegen eine flüssigkeitsgefüllte Körperhöhle, so kann sich das Tier strecken und zusammenziehen | Würmer, Quallen, Seeanemonen |\n| **Exoskelett** (Außenskelett) | außen am Körper; schützt vor Feinden und gibt Stabilität. Es wächst nicht mit, darum müssen sich die Tiere regelmäßig **häuten** | Insekten, Krebse |\n| **Endoskelett** (inneres Skelett) | die Knochen wachsen mit, schützen wichtige Organe und ermöglichen Bewegung | Menschen, Vögel, Fische, Säugetiere |\n\n> **Fazit:** Ob unsichtbar in der Zelle, flexibel durch Flüssigkeit, schützend von außen oder stabil von innen: Jedes Lebewesen hat eine Bauweise, die perfekt an sein Leben angepasst ist."
    },
    {
     "titel": "2 · Das menschliche Skelett (Heft S. 4–5)",
     "inhalt": "### Aufgaben des Skeletts\n- **Wirbelsäule:** macht beweglich\n- **Beinskelett:** gibt Stabilität und Schutz\n- **Brustkorb (Rippen):** schützt Herz und Lunge\n\n### Die Knochen\n| Bereich | Knochen (lateinischer Name) |\n|---|---|\n| Kopf | Schädel (Cranium), Augenhöhle (Orbita), Nasenbein, Jochbein, Oberkiefer (Maxilla), Unterkiefer (Mandibula) |\n| Rumpf | Halswirbel (Vertebrae cervicales), Wirbelsäule (Columna vertebralis), Brustkorb (Thorax), Brustbein (Sternum), Rippen (Costae), Rippenbogen (Arcus costalis) |\n| Schulter, Arm | Schlüsselbein (Clavicula), Schulterblatt (Scapula), Oberarmknochen (Humerus), Speiche (Radius), Elle (Ulna), Handwurzelknochen (Ossa carpi), Mittelhandknochen, Fingerknochen |\n| Becken | Darmbein (Os ilium), Kreuzbein (Os sacrum), Schambein (Os pubis), Sitzbein (Os ischii), Steißbein |\n| Bein, Fuß | Oberschenkelknochen (Femur), großer und kleiner Rollhügel (Trochanter major/minor), Kniescheibe (Patella), Schienbein (Tibia), Wadenbein (Fibula), Fersenbein (Calcaneus), Fußwurzelknochen (Ossa tarsi), Mittelfußknochen, Zehenknochen |"
    },
    {
     "titel": "3 · Aufbau und Typen der Knochen (Heft S. 7–9)",
     "inhalt": "| Bestandteil | Wo? | Funktion |\n|---|---|---|\n| **Knorpel** | am Knochenende | dämpft Stöße, macht Gelenke beweglich; gibt auch Struktur und Form (Nase, Ohr, Wirbelsäule) |\n| **Knochenbälkchen** | in den Knochenenden | Stabilität, Schutz vor Brüchen; dichtes Netz wie die Verstrebungen des Eiffelturms; leicht und porös |\n| **Knochenrinde** | harte Schicht um die Bälkchen | mechanische Stabilität, gibt Form, begrenzt das Knochenmark; elastisch, damit der Knochen nicht so leicht bricht |\n| **Knochenmark** | im Schaft (Knochenmarkhöhle) | **Blutbildung**; Regeneration und Reparatur nach Verletzung der Blutgefäße |\n| **Blutgefäße** | in Knochenhaut und Knochenmark | versorgen und ernähren den Knochen |\n| **Knochenhaut** | ganz außen um den Knochen | versorgt mit Nährstoffen, schützt, Ansatz für Sehnen, Bänder, Muskeln; viele Nervenfasern, darum tun Brüche so weh |\n\n> **Merke:** Knochen sind nicht starr und tot, sondern **lebende Organe**. Weil sie durchblutet sind, können sie nach einem Bruch wieder zusammenwachsen und heilen.\n\n### Die sechs Knochentypen\n| Knochentyp | Eigenschaften | Beispiele |\n|---|---|---|\n| 1 Lange Knochen (Röhrenknochen) | länglich, gerade, stabil, leicht; federn Gewicht und Kraft gut ab | Oberschenkelknochen, Oberarmknochen |\n| 2 Flache/platte Knochen | „Schutzschild“: flach, stabil, schützen andere Körperteile; viele Muskeln setzen an | Schulterblatt, Becken, Rippen |\n| 3 Unregelmäßige Knochen | schützen Nervenbahnen, tragen das Körpergewicht | Wirbelknochen, Gesichtsschädel |\n| 4 Kurze Knochen | klein, würfelförmig, kompakt, beweglich und trotzdem stabil | Fußwurzel- und Handwurzelknochen |\n| 5 Sesambeine | in Sehnen eingelagert; schützen die Sehnen, sorgen für Stabilität | Kniescheibe |\n| 6 Luftgefüllte Knochen | haben Hohlräume; Platz zum Atmen und Entfalten der Stimme | Stirnbein, Oberkieferknochen |"
    },
    {
     "titel": "4 · Der Fuß (Heft S. 11–15)",
     "inhalt": "Zusammenspiel aus Knochen, Gelenken, Bändern, Sehnen und Muskeln: stabil und beweglich zugleich. Er trägt das gesamte Körpergewicht, hält das Gleichgewicht und passt sich dem Untergrund an.\n\n| 7 | 5 | 14 |\n|---|---|---|\n| Fußwurzel | Mittelfuß | Zehen (großer Zeh 2, die anderen je 3) |\n\n- **Fußwurzel:** Fersenbein, Sprungbein, Kahnbein, Würfelbein, inneres, mittleres und seitliches Keilbein\n- **Fersenbein:** hinterer Teil des Fußes, nimmt beim Auftreten viel Belastung auf. **Sprungbein:** verbindet den Fuß über das obere Sprunggelenk mit dem Unterschenkel\n- **Mittelfußknochen:** verbinden Fußwurzel und Zehen, verteilen das Gewicht\n- **Zehen:** Grund-, Mittel- und Endglied; der große Zeh ist wichtig fürs Abdrücken. Sesambein unter dem großen Zeh\n- Gelenke verbinden die Knochen, Bänder stabilisieren, Sehnen übertragen die Muskelkraft\n\n### Fußgewölbe: wie eine elastische Brücke\n**Längsgewölbe** (Innenseite liegt nicht auf dem Boden) und **Quergewölbe** (quer über den Fuß). Vier Aufgaben:\n- Gewichtsverteilung\n- Stoßdämpfung beim Gehen, Laufen, Springen\n- Anpassungsfähigkeit an den Untergrund\n- Beweglichkeit: flüssiges Abrollen\n\n**Gehen:** Ferse setzt auf → Gewicht wandert nach vorne → Abdruck über Vorfuß und Zehen = federnd, energiesparend\n\n### Sinnesorgan\nSinnesrezeptoren in der Fußsohle registrieren **Druck, Berührung und Vibration**. Nerven leiten die Infos ans Gehirn. So merken wir, worauf wir stehen, und passen Haltung und Muskelspannung an – wichtig für das Gleichgewicht.\n\n### Aufrechter Gang und Evolution\n| Schimpanse | Mensch |\n|---|---|\n| großer Zeh deutlich abgespreizt, hilft beim Greifen und Festhalten an Ästen | großer Zeh in einer Reihe mit den anderen, kein Greifdaumen; unterstützt das Tragen des Gewichts und kräftiges Abdrücken |\n\nAuch Fersenbein und Fußgewölbe sind an den aufrechten Gang angepasst.\n\n### Die fünf Fußformen\n| Form | Merkmal |\n|---|---|\n| Ägyptisch | 2. Zeh kürzer als der große Zeh |\n| Griechisch | 2. Zeh länger als der große Zeh |\n| Römisch | 2. Zeh und großer Zeh gleich groß |\n| Germanisch | großer Zeh am längsten, alle anderen etwa gleich lang |\n| Keltisch | 2. Zeh länger als der große; der 3. etwa so lang wie der große, ebenso die kleineren |\n\nDie Formen sagen nichts über antike Kulturen aus, sie sind ein Schönheitsideal. Alle sind normal. **Hallux** = großer Zeh, **Digitus II** = zweiter Zeh."
    },
    {
     "titel": "5 · Die Hand (Heft S. 16–17)",
     "inhalt": "| 8 | 5 | 14 |\n|---|---|---|\n| Handwurzel | Mittelhand | Finger (Daumen 2, die anderen je 3) |\n\n- **Handwurzel:** Kahnbein, Mondbein, Dreieckbein, Erbsenbein, großes und kleines Vieleckbein, Kopfbein, Hakenbein\n- **Finger:** Grundglieder, Mittelglieder, Endglieder (dem Daumen fehlt das Mittelglied)\n- **Unterarm:** zwei Knochen. **Speiche** auf der Daumenseite, **Elle** auf der Seite des kleinen Fingers. Gemeinsam ermöglichen sie die Drehung des Unterarms\n- **Handgelenk:** drehen, beugen, strecken, seitlich bewegen. Muskeln und Sehnen bewegen die Finger\n- **Kraftgriff:** Flasche öffnen. **Präzisionsgriff:** Lego bauen, basteln, Stift halten"
    },
    {
     "titel": "6 · Die Wirbelsäule (Heft S. 18–20)",
     "inhalt": "| Hals | Brust | Lende | Kreuzbein | Steißbein |\n|---|---|---|---|---|\n| 7 | 12 | 5 | verwachsen | verwachsen |\n\n- Fünf Abschnitte. Die oberen drei bilden **24 Wirbel**, dazwischen liegen die **Bandscheiben**. Kreuz- und Steißbein bestehen aus verwachsenen Wirbeln. Der **Atlas** ist der oberste Halswirbel\n- Von der Seite: **Doppel-S-Form**. So werden Erschütterungen des Kopfes und damit des Gehirns abgefedert\n- Die Wirbellöcher liegen übereinander und bilden einen Kanal. Darin liegt das **Rückenmark**, die Verbindung zwischen Gehirn und allen anderen Organen\n- Teile eines Wirbels: Wirbelkörper, Wirbelloch, Querfortsatz, Dornfortsatz, Gelenkfortsatz. Aus dem Rückenmark zweigen die Spinalnerven ab"
    },
    {
     "titel": "7 · Gelenke (Heft S. 21–22)",
     "inhalt": "Gelenke sind **bewegliche Verbindungen** zwischen zwei oder mehr Knochen. Sie ermöglichen Mobilität, übertragen Kräfte und dienen als Stoßdämpfer.\n\n| Gelenkart | Bewegung | Beispiel | Vergleich |\n|---|---|---|---|\n| **Kugelgelenk** | kugelförmiger Gelenkkopf; Bewegung in viele Richtungen | Schulter, Hüfte | Anhängerkupplung |\n| **Eigelenk** | eiförmig; beugen, strecken und seitlich bewegen | Handgelenk | eiförmige Anhängerkupplung |\n| **Sattelgelenk** | wie ein Reitsattel; zwei Richtungen | Daumen | Pferdesattel |\n| **Scharniergelenk** | einfachste Art; nur beugen und strecken | Ellbogen | Buch |\n| **Zapfengelenk** | walzenförmiger Gelenkkopf dreht sich in einem Ring; nur Drehen | Kopfgelenk | Schraube mit Mutter |\n\n### Aufbau (bei allen fünf gleich)\n- **Gelenkkopf** und **Gelenkpfanne** passen zusammen\n- **Knorpel** überzieht die Flächen: Stoßdämpfer und Gleitmittel\n- **Gelenkschmiere:** schmierige Flüssigkeit, damit nichts aneinander reibt\n- **Gelenkkapsel:** umgibt das Gelenk und bildet mit Bändern, Muskeln und Sehnen eine schützende Außenhülle"
    },
    {
     "titel": "8 · Sehnen und Bänder (Heft S. 23, 26)",
     "inhalt": "| Teil | Rolle | Verbindet |\n|---|---|---|\n| Muskel | Motor | – |\n| **Sehne** | Kraftüberträger | Knochen mit **Muskel** |\n| **Band** | Stabilisation | Knochen mit **Knochen** |\n\n- Sehnen bestehen aus festem, kaum dehnbarem Bindegewebe\n- Viele parallel laufende Fasern: sehr belastbar, aber wenig dehnbar\n- **Wenig durchblutet**, darum heilen sie eher langsam\n- Beispiele: Achillessehne, Patellasehne, Quadrizepssehne, Bizepssehne, Schultersehnen"
    },
    {
     "titel": "9 · Muskeln (Heft S. 24–25)",
     "inhalt": "- ermöglichen Bewegung und sind über Sehnen am Knochen verankert\n- bestehen aus vielen Muskelfasern\n- zieht sich ein Muskel zusammen, wird er **kürzer und dicker**\n- zwei Muskeln arbeiten oft als **Gegenspieler** zusammen (Antagonistenprinzip), z. B. Bizeps und Trizeps\n- gut durchblutetes Gewebe, Schutz für innere Organe\n\n| Rekord | Muskel |\n|---|---|\n| stärkster | Kaumuskel |\n| größter | Gluteus maximus (großer Gesäßmuskel) |\n| kräftigster | Herzmuskel |\n| wichtigster Atemmuskel | Zwerchfell |\n\n| Ansicht | Muskeln |\n|---|---|\n| Vorne | Trapezmuskel, Brustmuskeln, Bizeps, Bauchmuskeln, Oberschenkelstrecker, vorderer Schienbeinmuskel |\n| Hinten | Trapezmuskel, Deltamuskel, Trizeps, breiter Rückenmuskel (Latissimus), großer Gesäßmuskel, Wadenmuskel |\n| Seite | äußere schräge Bauchmuskulatur, hinterer Oberschenkelmuskel, Wadenmuskel |"
    },
    {
     "titel": "10 · Muskelkater (Heft S. 25)",
     "inhalt": "- **Was ist das?** Schmerz nach starker Belastung oder ungewohnten Bewegungen. Das Wort stammt vermutlich von „Katarrh“, also eine Art „Muskelerkältung“\n- **Zeitverlauf:** merkbar nach rund 24–36 Stunden, dauert bis zu einer Woche\n- **Symptome:** Muskeln schmerzen schon bei schwachen Bewegungen, sind verhärtet und druckempfindlich, fühlen sich schwach und kraftlos an\n- **Auslöser:** Muskeln werden über das gewohnte Maß belastet, etwa durch abrupte Bremsbewegungen und schnelle Antritte\n- **Exzentrische Bewegungen** (z. B. Gewicht beim Bankdrücken ablassen, in die Kniebeuge gehen): weniger Fasern sind aktiv, jede wird stärker belastet\n\n> **Falsch:** Muskelkater kommt nicht von Übersäuerung durch Laktat (Milchsäure). **Richtig:** Es sind Mikroverletzungen in den Muskelfasern.\n\n### Vom Muskel zum Sarkomer\nMuskelfaser → Muskelfibrillenbündel → Muskelfibrillen → Sarkomere → Actinfilamente an Z-Scheiben\n\nDas **Sarkomer** ist die kleinste funktionelle Einheit des Muskels; Hunderte liegen hintereinander. Bei starker Belastung können die gespannten Actinfilamente die Z-Scheiben verletzen. Die Reparatur dieser Mikroverletzungen spüren wir als Muskelkater."
    }
   ],
   "uebungen": [
    {
     "titel": "Die wichtigsten Zahlen",
     "anleitung": "Trage die Zahlen ein.",
     "aufgaben": [
      {
       "frage": "Ein Fuß hat ___ Knochen, eine Hand ___ Knochen.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "26"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "27"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Fuß: ___ Fußwurzel-, ___ Mittelfuß- und ___ Zehenknochen.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "7"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "5"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "14"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Hand: ___ Handwurzel-, ___ Mittelhand- und ___ Fingerknochen.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "8"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "5"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "14"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Der große Zeh und der Daumen haben je ___ Knochen, die anderen Zehen und Finger je ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "2"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "3"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Die Wirbelsäule hat ___ freie Wirbel: ___ Hals-, ___ Brust- und ___ Lendenwirbel.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "24"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "7"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "12"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "5"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Es gibt ___ Knochentypen und ___ Gelenkarten.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "6"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "5"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Muskelkater merkt man nach etwa ___ bis ___ Stunden.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "24"
         ],
         "einheit": "h"
        },
        {
         "loesungen": [
          "36"
         ],
         "einheit": "h"
        }
       ]
      }
     ]
    },
    {
     "titel": "Skelettarten",
     "anleitung": "Setze das passende Wort ein.",
     "aufgaben": [
      {
       "frage": "„Skelett“ kommt aus dem ___ und bedeutet „ausgetrockneter Körper“ oder „Gerippe“.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Griechischen",
          "griechischen",
          "Griechisch"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Das Fasernetz in jeder Zelle heißt ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Zytoskelett"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Würmer, Quallen und Seeanemonen haben ein ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Hydroskelett"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Insekten und Krebse haben ein ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Exoskelett",
          "Außenskelett"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Menschen, Vögel und Fische haben ein ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Endoskelett",
          "Innenskelett",
          "inneres Skelett"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Tiere mit Exoskelett müssen sich ___, weil es nicht mitwächst.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "häuten"
         ],
         "einheit": ""
        }
       ]
      }
     ]
    },
    {
     "titel": "Aufbau und Typen der Knochen",
     "anleitung": "Setze das passende Wort ein.",
     "aufgaben": [
      {
       "frage": "Im ___ wird Blut gebildet.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Knochenmark"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Die ___ hat viele Nervenfasern, darum tun Brüche so weh.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Knochenhaut"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Der ___ am Knochenende dämpft Stöße.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Knorpel"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Die ___ bilden ein dichtes Netz wie die Verstrebungen des Eiffelturms.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Knochenbälkchen"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Knochen können nach einem Bruch heilen, weil sie ___ sind.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "durchblutet",
          "lebende Organe",
          "lebendig"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Der Oberschenkelknochen ist ein ___ Knochen (Röhrenknochen).",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "langer"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Das Schulterblatt ist ein ___ Knochen.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "flacher",
          "platter"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Wirbelknochen sind ___ Knochen.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "unregelmäßige"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Hand- und Fußwurzelknochen sind ___ Knochen.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "kurze"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Die Kniescheibe ist ein ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Sesambein"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Das Stirnbein ist ein ___ Knochen.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "luftgefüllter"
         ],
         "einheit": ""
        }
       ]
      }
     ]
    },
    {
     "titel": "Fuß und Hand",
     "anleitung": "Setze das passende Wort ein.",
     "aufgaben": [
      {
       "frage": "Das ___ verbindet den Fuß über das obere Sprunggelenk mit dem Unterschenkel.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Sprungbein"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Die zwei Fußgewölbe heißen ___ und ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Längsgewölbe",
          "Quergewölbe"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "Quergewölbe",
          "Längsgewölbe"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Rezeptoren in der Fußsohle registrieren Druck, Berührung und ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Vibration"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Der große Zeh heißt auf Latein ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Hallux"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Ist der 2. Zeh kürzer als der große Zeh, ist es die ___ Fußform.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "ägyptische"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Sind 2. Zeh und großer Zeh gleich groß, ist es die ___ Fußform.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "römische"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Ist der große Zeh am längsten und alle anderen etwa gleich lang, ist es die ___ Fußform.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "germanische"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Die Speiche liegt auf der Seite des ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Daumens",
          "Daumen"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Die Elle liegt auf der Seite des ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "kleinen Fingers",
          "kleinen Finger"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Dem Daumen fehlt das ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Mittelglied"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Eine Flasche öffnen ist ein ___, einen Stift halten ein ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Kraftgriff"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "Präzisionsgriff"
         ],
         "einheit": ""
        }
       ]
      }
     ]
    },
    {
     "titel": "Wirbelsäule und Gelenke",
     "anleitung": "Setze das passende Wort ein.",
     "aufgaben": [
      {
       "frage": "Der oberste Halswirbel heißt ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Atlas"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Zwischen den Wirbeln liegen die ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Bandscheiben"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Von der Seite hat die Wirbelsäule eine ___-Form.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Doppel-S",
          "Doppel S",
          "Doppels"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Im Kanal aus den Wirbellöchern liegt das ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Rückenmark"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Schulter und Hüfte: ___",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Kugelgelenk",
          "Kugelgelenke"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Handgelenk: ___",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Eigelenk"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Daumen: ___",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Sattelgelenk"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Ellbogen: ___",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Scharniergelenk"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Kopfgelenk: ___",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Zapfengelenk"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Gelenkkopf und ___ passen zusammen.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Gelenkpfanne"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Damit nichts aneinander reibt, gibt es die ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Gelenkschmiere"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Das Gelenk wird von der ___ umgeben.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Gelenkkapsel"
         ],
         "einheit": ""
        }
       ]
      }
     ]
    },
    {
     "titel": "Sehnen, Bänder und Muskeln",
     "anleitung": "Setze das passende Wort ein.",
     "aufgaben": [
      {
       "frage": "Eine ___ verbindet Muskel und Knochen.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Sehne"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Ein ___ verbindet Knochen mit Knochen.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Band"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Sehnen heilen langsam, weil sie nur wenig ___ sind.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "durchblutet"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Zieht sich ein Muskel zusammen, wird er ___ und ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "kürzer",
          "dicker"
         ],
         "einheit": ""
        },
        {
         "loesungen": [
          "dicker",
          "kürzer"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Bizeps und Trizeps arbeiten als ___ zusammen.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Gegenspieler",
          "Antagonisten"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Der stärkste Muskel ist der ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Kaumuskel"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Der größte Muskel ist der ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Gluteus maximus",
          "große Gesäßmuskel",
          "großer Gesäßmuskel",
          "Gesäßmuskel"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Der kräftigste Muskel ist der ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Herzmuskel"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Der wichtigste Atemmuskel ist das ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Zwerchfell"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Muskelkater entsteht durch ___ in den Muskelfasern.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Mikroverletzungen"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Falsch ist die Erklärung mit Übersäuerung durch ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Laktat",
          "Milchsäure"
         ],
         "einheit": ""
        }
       ]
      },
      {
       "frage": "Die kleinste funktionelle Einheit des Muskels ist das ___.",
       "hinweis": "",
       "erklaerung": "",
       "luecken": [
        {
         "loesungen": [
          "Sarkomer"
         ],
         "einheit": ""
        }
       ]
      }
     ]
    },
    {
     "titel": "Testfragen",
     "anleitung": "Erst selbst beantworten (aufschreiben oder laut sagen), dann auf „Prüfen“ drücken und mit den Musterlösungen vergleichen.",
     "aufgaben": [
      {
       "frage": "Was bedeutet „Skelett“ und woher kommt das Wort?",
       "antwort": "Griechisch „skeletós“: ausgetrockneter Körper, Gerippe."
      },
      {
       "frage": "Wie unterscheiden sich Zytoskelett und Hydroskelett? Nenne je Beispiele.",
       "antwort": "Zytoskelett: Fasernetz in jeder Zelle (Pflanze, Tier, Mensch). Hydroskelett: Form durch Flüssigkeitsdruck, kein festes Skelett (Würmer, Quallen, Seeanemonen)."
      },
      {
       "frage": "Wie unterscheiden sich Exoskelett und Endoskelett? Warum müssen sich Tiere mit Exoskelett häuten?",
       "antwort": "Exoskelett: außen am Körper, schützt vor Feinden, gibt Stabilität (Insekten, Krebse). Endoskelett: innen, Knochen wachsen mit, schützen Organe, ermöglichen Bewegung (Menschen, Vögel, Fische, Säugetiere). Häuten: Das Exoskelett wächst nicht mit."
      },
      {
       "frage": "Nenne drei Aufgaben des menschlichen Skeletts.",
       "antwort": "Beweglichkeit (Wirbelsäule), Stabilität und Schutz (Beinskelett), Schutz von Herz und Lunge (Brustkorb)."
      },
      {
       "frage": "Wie heißen Schienbein, Wadenbein, Elle und Speiche auf Latein?",
       "antwort": "Tibia, Fibula, Ulna, Radius."
      },
      {
       "frage": "Nenne die Bestandteile eines Knochens und die Aufgabe von Knochenmark und Knochenhaut.",
       "antwort": "Knorpel, Knochenbälkchen, Knochenrinde, Knochenmark, Blutgefäße, Knochenhaut. Knochenmark: Blutbildung. Knochenhaut: Versorgung, Schutz, Ansatz für Sehnen, Bänder und Muskeln."
      },
      {
       "frage": "Warum sind Knochen lebende Organe, und warum ist das wichtig?",
       "antwort": "Sie sind durchblutet und werden ernährt. Nur so können sie nach einem Bruch zusammenwachsen und heilen."
      },
      {
       "frage": "Nenne die sechs Knochentypen mit je einem Beispiel.",
       "antwort": "Lang: Oberschenkelknochen. Flach: Schulterblatt. Unregelmäßig: Wirbel. Kurz: Handwurzelknochen. Sesambein: Kniescheibe. Luftgefüllt: Stirnbein."
      },
      {
       "frage": "Aus wie vielen Knochen besteht ein Fuß, und wie teilen sie sich auf?",
       "antwort": "26: 7 Fußwurzel, 5 Mittelfuß, 14 Zehen."
      },
      {
       "frage": "Nenne die zwei Fußgewölbe und ihre vier Aufgaben.",
       "antwort": "Längs- und Quergewölbe. Gewichtsverteilung, Stoßdämpfung, Anpassungsfähigkeit, Beweglichkeit."
      },
      {
       "frage": "Wie unterscheidet sich der große Zeh von Mensch und Schimpanse, und warum?",
       "antwort": "Schimpanse: abgespreizt, zum Greifen an Ästen. Mensch: in einer Reihe mit den Zehen, zum Tragen und Abdrücken beim aufrechten Gang."
      },
      {
       "frage": "Warum gilt der Fuß auch als Sinnesorgan?",
       "antwort": "Rezeptoren in der Sohle registrieren Druck, Berührung und Vibration und melden sie über Nerven ans Gehirn."
      },
      {
       "frage": "Nenne die fünf Fußformen. Was sagen sie aus?",
       "antwort": "Ägyptisch, griechisch, römisch, germanisch, keltisch. Sie sagen nichts über antike Kulturen aus, es ist ein Schönheitsideal; alle sind normal."
      },
      {
       "frage": "Wie viele Knochen hat eine Hand, und wie teilen sie sich auf?",
       "antwort": "27: 8 Handwurzel, 5 Mittelhand, 14 Finger."
      },
      {
       "frage": "Nenne die beiden Griffarten mit je einem Beispiel.",
       "antwort": "Kraftgriff (Flasche öffnen), Präzisionsgriff (Stift halten)."
      },
      {
       "frage": "Nenne die Abschnitte der Wirbelsäule mit der Zahl der Wirbel.",
       "antwort": "Halswirbel 7, Brustwirbel 12, Lendenwirbel 5, Kreuzbein und Steißbein (verwachsen)."
      },
      {
       "frage": "Wozu dient die Doppel-S-Form?",
       "antwort": "Sie federt Erschütterungen des Kopfes und damit des Gehirns ab."
      },
      {
       "frage": "Wo liegt das Rückenmark, und welche Aufgabe hat es?",
       "antwort": "Im Kanal aus den Wirbellöchern. Es verbindet das Gehirn mit allen anderen Organen."
      },
      {
       "frage": "Nenne die fünf Gelenkarten mit je einem Beispiel.",
       "antwort": "Kugelgelenk (Schulter), Eigelenk (Handgelenk), Sattelgelenk (Daumen), Scharniergelenk (Ellbogen), Zapfengelenk (Kopfgelenk)."
      },
      {
       "frage": "Beschreibe den Aufbau eines Gelenks.",
       "antwort": "Gelenkkopf und Gelenkpfanne, Knorpelüberzug, Gelenkschmiere, Gelenkkapsel."
      },
      {
       "frage": "Was ist der Unterschied zwischen Sehne und Band?",
       "antwort": "Sehne: verbindet Muskel und Knochen, überträgt Kraft. Band: verbindet Knochen und Knochen, stabilisiert."
      },
      {
       "frage": "Warum heilen Sehnen langsam?",
       "antwort": "Sie sind nur wenig durchblutet."
      },
      {
       "frage": "Was passiert, wenn sich ein Muskel zusammenzieht? Was ist das Antagonistenprinzip?",
       "antwort": "Er wird kürzer und dicker. Zwei Muskeln arbeiten als Gegenspieler zusammen (z. B. Bizeps und Trizeps)."
      },
      {
       "frage": "Welcher Muskel ist der stärkste, größte und kräftigste? Welcher ist der wichtigste Atemmuskel?",
       "antwort": "Stärkster: Kaumuskel. Größter: Gluteus maximus. Kräftigster: Herzmuskel. Atemmuskel: Zwerchfell."
      },
      {
       "frage": "Wie entsteht Muskelkater wirklich, und welche Erklärung ist falsch?",
       "antwort": "Mikroverletzungen in den Muskelfasern, an den Z-Scheiben; deren Reparatur spürt man als Muskelkater. Falsch ist die Übersäuerung durch Laktat."
      },
      {
       "frage": "Was ist ein Sarkomer?",
       "antwort": "Die kleinste funktionelle Einheit des Muskels."
      }
     ]
    }
   ]
  }
 }
];
