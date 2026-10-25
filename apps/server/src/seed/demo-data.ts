import type { Condition, ListingKind, PriceType, Role } from '@campusmarkt/contracts';

export const HWG_INSTITUTION_ID = '00000000-0000-4000-8000-000000000001';

export const CAMPUS_LOCATIONS = ['Ludwigshafen Hauptcampus', 'Ludwigshafen Ostasieninstitut', 'Weincampus Neustadt'];

export const CATEGORIES: { slug: string; name: string; study?: boolean; color: string; glyph: string }[] = [
  { slug: 'buecher-skripte', name: 'Bücher & Skripte', study: true, color: '#1d4ed8', glyph: 'books' },
  { slug: 'elektronik', name: 'Elektronik & Technik', color: '#0f766e', glyph: 'screen' },
  { slug: 'moebel-wohnen', name: 'Möbel & Wohnen', color: '#b45309', glyph: 'chair' },
  { slug: 'kleidung', name: 'Kleidung & Accessoires', color: '#be185d', glyph: 'shirt' },
  { slug: 'fahrrad-mobilitaet', name: 'Fahrräder & Mobilität', color: '#15803d', glyph: 'bike' },
  { slug: 'sport-freizeit', name: 'Sport & Freizeit', color: '#c2410c', glyph: 'ball' },
  { slug: 'haushalt-kueche', name: 'Haushalt & Küche', color: '#6d28d9', glyph: 'pot' },
  { slug: 'tickets', name: 'Tickets & Veranstaltungen', color: '#0e7490', glyph: 'ticket' },
  { slug: 'nachhilfe', name: 'Nachhilfe & Lerngruppen', color: '#4338ca', glyph: 'bulb' },
  { slug: 'sonstiges', name: 'Sonstiges', color: '#475569', glyph: 'star' },
];

/** Nur für das Docker-Beispiel. Passwörter stehen bewusst im README (ADR-0010, §8.1 Demo-spezifisch). */
export const DEMO_PASSWORD = 'CampusMarkt-Demo-2026';

export const DEMO_USERS: {
  key: string;
  email: string;
  displayName: string;
  role: Role;
  studyProgram?: string;
  /** Ältere Fassung der Nutzungsbedingungen: zeigt die erneute Zustimmung (REQ-LEGAL-003). */
  termsVersion?: string;
  /** Ältere Fassung der Datenschutzerklärung: zeigt den Hinweis zur Kenntnisnahme (RV-R-08). */
  privacyAckVersion?: string;
}[] = [
  { key: 'lea', email: 'lea@studmail.hwg-lu.de', displayName: 'Lea', role: 'member', studyProgram: 'BWL (B.Sc.)' },
  { key: 'ben', email: 'ben@studmail.hwg-lu.de', displayName: 'Ben', role: 'member', studyProgram: 'Wirtschaftsinformatik (B.Sc.)' },
  { key: 'mia', email: 'mia@studmail.hwg-lu.de', displayName: 'Mia', role: 'member', studyProgram: 'Soziale Arbeit (B.A.)' },
  { key: 'jonas', email: 'jonas.weber@hwg-lu.de', displayName: 'Jonas (Bibliothek)', role: 'member' },
  { key: 'sara', email: 'sara@studmail.hwg-lu.de', displayName: 'Sara', role: 'member', studyProgram: 'Weinbau und Oenologie (B.Sc.)' },
  { key: 'tim', email: 'tim@studmail.hwg-lu.de', displayName: 'Tim', role: 'member', studyProgram: 'BWL (B.Sc.)', termsVersion: '2026-01', privacyAckVersion: '2026-01' },
  { key: 'mod', email: 'mod@hwg-lu.de', displayName: 'Moderation (Demo)', role: 'moderator' },
  { key: 'admin', email: 'admin@hwg-lu.de', displayName: 'Admin (Demo)', role: 'admin' },
];

export interface DemoListing {
  owner: string;
  kind: ListingKind;
  title: string;
  description: string;
  category: string;
  priceType: PriceType;
  price?: number;
  condition?: Condition;
  locations: number[];
  attributes?: { studyProgram?: string; module?: string; isbn?: string };
  daysAgo: number;
  images?: number;
}

export const DEMO_LISTINGS: DemoListing[] = [
  { owner: 'ben', kind: 'offer', title: 'Statistik-Buch Bamberg/Baur/Krapp', description: 'Statistik von Bamberg, Baur und Krapp, 19. Auflage. Ein paar Markierungen mit Bleistift, sonst wie neu. Perfekt für Statistik I und II.', category: 'buecher-skripte', priceType: 'fixed', price: 15, condition: 'good', locations: [0], attributes: { studyProgram: 'BWL', module: 'Statistik I', isbn: '978-3-486-71638-7' }, daysAgo: 1, images: 2 },
  { owner: 'lea', kind: 'offer', title: 'Schreibtischstuhl, höhenverstellbar', description: 'Ergonomischer Bürostuhl mit Armlehnen, Rollen und Wippmechanik. Ziehe um und brauche ihn nicht mehr. Abholung am Campus nach Absprache, ich bringe ihn mit dem Auto.', category: 'moebel-wohnen', priceType: 'negotiable', price: 35, condition: 'good', locations: [0], daysAgo: 2, images: 1 },
  { owner: 'mia', kind: 'offer', title: 'Taschenrechner Casio FX-991DE X', description: 'Der zugelassene Taschenrechner für die meisten Klausuren. Funktioniert einwandfrei, inklusive Schutzhülle.', category: 'elektronik', priceType: 'fixed', price: 12, condition: 'like_new', locations: [0, 1], daysAgo: 3, images: 1 },
  { owner: 'sara', kind: 'offer', title: 'Fahrrad 28 Zoll, 7-Gang', description: 'Stadtrad mit Nabenschaltung, Licht funktioniert, neue Bremsbeläge. Kleine Kratzer am Rahmen. Ideal für den Weg zum Campus.', category: 'fahrrad-mobilitaet', priceType: 'negotiable', price: 120, condition: 'good', locations: [2], daysAgo: 4, images: 2 },
  { owner: 'jonas', kind: 'offer', title: 'Ausgemusterte Lehrbücher Rechnungswesen', description: 'Die Bibliothek gibt ältere Auflagen von Lehrbüchern zum Rechnungswesen ab. Für Selbstabholer kostenlos, solange der Vorrat reicht.', category: 'buecher-skripte', priceType: 'free', locations: [0], attributes: { module: 'Rechnungswesen' }, daysAgo: 5, images: 1 },
  { owner: 'ben', kind: 'wanted', title: 'Suche Mitbewohner-Kühlschrank (klein)', description: 'Suche einen kleinen Kühlschrank für mein WG-Zimmer, gerne mit Gefrierfach. Kann in Ludwigshafen abholen.', category: 'haushalt-kueche', priceType: 'negotiable', price: 40, locations: [0], daysAgo: 1 },
  { owner: 'lea', kind: 'offer', title: 'Laptop-Ständer aus Aluminium', description: 'Faltbarer Laptop-Ständer, sechsfach höhenverstellbar. Gut für Online-Vorlesungen und Hausarbeiten.', category: 'elektronik', priceType: 'fixed', price: 18, condition: 'like_new', locations: [0], daysAgo: 6, images: 1 },
  { owner: 'mia', kind: 'offer', title: 'Winterjacke Größe M', description: 'Warme Winterjacke in Dunkelblau, Größe M, nur eine Saison getragen. Tausche auch gerne gegen Bücher für Soziale Arbeit.', category: 'kleidung', priceType: 'swap', condition: 'like_new', locations: [0, 1], daysAgo: 7, images: 1 },
  { owner: 'sara', kind: 'offer', title: 'Weingläser-Set (6 Stück)', description: 'Sechs Weißweingläser, spülmaschinenfest. Übrig von einer Verkostung am Weincampus.', category: 'haushalt-kueche', priceType: 'fixed', price: 10, condition: 'new', locations: [2], daysAgo: 8, images: 1 },
  { owner: 'ben', kind: 'offer', title: 'Monitor 24 Zoll Full HD', description: 'Monitor mit HDMI- und DisplayPort-Anschluss, keine Pixelfehler. Kabel sind dabei.', category: 'elektronik', priceType: 'negotiable', price: 60, condition: 'good', locations: [0], daysAgo: 9, images: 2 },
  { owner: 'jonas', kind: 'offer', title: 'Konzertkarten Kulturzentrum dasHaus', description: 'Zwei Karten für das Konzert am Freitag, ich kann leider nicht. Abgabe zum Originalpreis.', category: 'tickets', priceType: 'fixed', price: 24, locations: [0], daysAgo: 2, images: 1 },
  { owner: 'lea', kind: 'offer', title: 'Nachhilfe Mathe für Wirtschaftswissenschaften', description: 'Ich biete Nachhilfe in Mathe für Wirtschaftswissenschaftler (Analysis, lineare Algebra). Ich habe die Klausur mit 1,3 bestanden. Preis pro Stunde.', category: 'nachhilfe', priceType: 'fixed', price: 15, locations: [0], daysAgo: 10 },
  { owner: 'mia', kind: 'wanted', title: 'Suche Lerngruppe Sozialrecht', description: 'Wer hat Lust, sich wöchentlich zur Vorbereitung auf die Sozialrecht-Klausur zu treffen? Gerne in der Bibliothek.', category: 'nachhilfe', priceType: 'free', locations: [0], daysAgo: 3 },
  { owner: 'sara', kind: 'offer', title: 'Yogamatte mit Tragegurt', description: 'Rutschfeste Yogamatte, 6 mm dick, kaum benutzt.', category: 'sport-freizeit', priceType: 'fixed', price: 8, condition: 'like_new', locations: [2], daysAgo: 11, images: 1 },
  { owner: 'ben', kind: 'offer', title: 'Skript Wirtschaftsinformatik I', description: 'Ausgedrucktes und gebundenes Skript mit eigenen Notizen und Zusammenfassungen. Hat mir sehr geholfen.', category: 'buecher-skripte', priceType: 'fixed', price: 5, condition: 'acceptable', locations: [0], attributes: { studyProgram: 'Wirtschaftsinformatik', module: 'WI I' }, daysAgo: 12, images: 1 },
  { owner: 'lea', kind: 'offer', title: 'Pflanzen-Ableger (Efeutute)', description: 'Ableger meiner Efeutute im Glas, bewurzelt. Zu verschenken an Pflanzenfreunde.', category: 'sonstiges', priceType: 'free', locations: [0, 1], daysAgo: 4, images: 1 },
  { owner: 'mia', kind: 'offer', title: 'Kaffeemaschine mit Thermoskanne', description: 'Filterkaffeemaschine für 8 Tassen, funktioniert tadellos. Entkalkt.', category: 'haushalt-kueche', priceType: 'fixed', price: 15, condition: 'good', locations: [1], daysAgo: 13, images: 1 },
  { owner: 'jonas', kind: 'offer', title: 'Regal aus Kiefernholz', description: 'Standregal, 180 x 80 cm, fünf Böden. Muss abgebaut werden, Werkzeug bringe ich mit.', category: 'moebel-wohnen', priceType: 'free', condition: 'acceptable', locations: [0], daysAgo: 14, images: 1 },
  { owner: 'sara', kind: 'wanted', title: 'Suche Fahrradhelm Größe M', description: 'Suche einen gut erhaltenen Fahrradhelm in Größe M (54–58 cm).', category: 'fahrrad-mobilitaet', priceType: 'negotiable', price: 15, locations: [2], daysAgo: 5 },
  { owner: 'ben', kind: 'offer', title: 'Badmintonschläger (2 Stück) + Bälle', description: 'Zwei Schläger mit Hülle und eine Dose Federbälle. Für den Hochschulsport ideal.', category: 'sport-freizeit', priceType: 'swap', condition: 'good', locations: [0], daysAgo: 15, images: 1 },
  { owner: 'lea', kind: 'offer', title: 'Englisch-Wörterbuch Business', description: 'Wirtschaftsenglisch-Wörterbuch, aktuelle Auflage. Sehr nützlich für International Business.', category: 'buecher-skripte', priceType: 'fixed', price: 9, condition: 'good', locations: [1], attributes: { module: 'Business English' }, daysAgo: 16, images: 1 },
  { owner: 'mia', kind: 'offer', title: 'Schreibtischlampe LED', description: 'Dimmbare LED-Lampe mit USB-Ladeanschluss, drei Farbtemperaturen.', category: 'elektronik', priceType: 'fixed', price: 14, condition: 'like_new', locations: [0], daysAgo: 17, images: 1 },
  { owner: 'jonas', kind: 'offer', title: 'Japanisch-Lehrbuch Minna no Nihongo', description: 'Lehrbuch und Übungsbuch, ideal für den Einstieg am Ostasieninstitut. Wenige Notizen.', category: 'buecher-skripte', priceType: 'fixed', price: 20, condition: 'good', locations: [1], attributes: { studyProgram: 'International Business Ostasien', module: 'Japanisch I' }, daysAgo: 18, images: 1 },
  { owner: 'sara', kind: 'offer', title: 'Gummistiefel Größe 39', description: 'Robuste Gummistiefel, perfekt für die Arbeit im Weinberg. Einmal getragen.', category: 'kleidung', priceType: 'fixed', price: 10, condition: 'like_new', locations: [2], daysAgo: 19, images: 1 },
  { owner: 'ben', kind: 'offer', title: 'Mehrfachsteckdose mit Schalter', description: 'Sechsfach-Steckdose mit Überspannungsschutz. Zu verschenken.', category: 'elektronik', priceType: 'free', condition: 'good', locations: [0], daysAgo: 20 },
  { owner: 'lea', kind: 'offer', title: 'Kleiner Couchtisch', description: 'Weißer Couchtisch, 60 x 60 cm, leichte Gebrauchsspuren.', category: 'moebel-wohnen', priceType: 'negotiable', price: 15, condition: 'acceptable', locations: [0], daysAgo: 53, images: 1 },
  { owner: 'mia', kind: 'offer', title: 'Brettspiel Siedler von Catan', description: 'Vollständig, alle Teile vorhanden. Für gemütliche Spieleabende im Wohnheim.', category: 'sport-freizeit', priceType: 'fixed', price: 18, condition: 'good', locations: [0, 1], daysAgo: 21, images: 1 },
  { owner: 'jonas', kind: 'wanted', title: 'Suche gebrauchte Laborkittel', description: 'Für einen Workshop suchen wir gebrauchte Laborkittel in verschiedenen Größen. Gerne als Spende.', category: 'sonstiges', priceType: 'free', locations: [2], daysAgo: 6 },
  { owner: 'sara', kind: 'offer', title: 'Kochbuch vegetarisch für Studis', description: 'Schnelle und günstige vegetarische Rezepte. Tausche gegen ein anderes Kochbuch.', category: 'buecher-skripte', priceType: 'swap', condition: 'good', locations: [2], daysAgo: 22, images: 1 },
  { owner: 'ben', kind: 'offer', title: 'Altklausuren Mikroökonomie mit Klausurlösungen', description: 'Sammlung von Altklausuren Mikroökonomie, dazu angeblich die Klausurlösungen der nächsten Prüfung.', category: 'buecher-skripte', priceType: 'fixed', price: 30, condition: 'good', locations: [0], daysAgo: 0 },
];
