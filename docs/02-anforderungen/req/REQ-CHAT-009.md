---
id: REQ-CHAT-009
title: Kaufangebot und Gegenangebot („Nehm ich“, Preisangebot bei VB)
type: user-story
class: functional
status: approved
owner: team-kommunikation
risk: medium
release: R2
moscow: S
kano: leistung
epic: EPIC-04
source: BG-3, Auftraggeber (2026-11-13, Q-31)
use_cases: [UC-21, UC-12]
depends_on: [REQ-CHAT-011, REQ-CHAT-001, REQ-NOTI-008]
version: 4.0
created: 2026-10-20
last_updated: 2026-11-13
verification: [AT-CHAT-009, AT-CHAT-009-2, AT-CHAT-009-3]
---

# REQ-CHAT-009 Kaufangebot und Gegenangebot („Nehm ich“, Preisangebot bei VB)

## Anforderung
Als Interessent möchte ich ein Angebot mit einem Klick verbindlich annehmen („**Nehm ich**“) bzw. bei Verhandlungsbasis einen **Preis anbieten**, und als Anbieter möchte ich das **Kaufangebot** in meinen Nachrichten sehen und **akzeptieren** oder mit einer Nachricht oder einem **Gegenangebot** antworten, damit wir uns ohne Missverständnisse auf Preis und Übergabe einigen.

Ein akzeptiertes Kaufangebot reserviert die Anzeige für den Käufer zum vereinbarten Betrag (Deal *vereinbart*, REQ-CHAT-011). Die Abgabe markiert der Anbieter wie bisher nach der Übergabe. **Bezahlt wird nicht über die Plattform** (MVP, ADR-0006); „Kauf“ bedeutet eine verbindliche Absprache zwischen zwei Mitgliedern.

## Begründung
Wunsch des Auftraggebers (Q-31): Der Weg „Anzeige → Chat → Reservierung“ verlangt heute Freitext, und der Anbieter muss Preis und Person selbst zuordnen. Ein strukturiertes Kaufangebot macht Preis und Zusage eindeutig und spart Nachfragen; der vereinbarte Betrag ist Grundlage einer späteren optionalen Bezahlung (ADR-0006) und der Bewertungen nach abgeschlossenem Deal (REQ-MOD-006).

## Akzeptanzkriterien
```gherkin
Szenario: "Nehm ich" bei Festpreis
  Angenommen Bens Anzeige "Lehrbuch Statistik" ist aktiv mit Festpreis 15,00 €
  Wenn Lea in der Anzeige "Nehm ich" wählt und bestätigt
  Dann erhält Ben in der Konversation zur Anzeige ein Kaufangebot von Lea über 15,00 €
  Und Ben erhält eine Benachrichtigung "Neues Kaufangebot" (REQ-NOTI-008)
  Und Lea sieht ihr Angebot im Verlauf mit dem Status "offen"

Szenario: Preisangebot bei Verhandlungsbasis
  Angenommen Bens Anzeige hat den Preistyp "VB" und 15,00 €
  Wenn Lea im Feld "Dein Angebot" 12,00 € einträgt und "Angebot senden" wählt
  Dann erhält Ben ein Kaufangebot über 12,00 €

Szenario: Kaufangebot akzeptieren
  Angenommen Lea hat ein offenes Kaufangebot über 12,00 € gesendet
  Wenn Ben "Akzeptieren" wählt
  Dann ist die Anzeige für Lea reserviert mit dem vereinbarten Betrag 12,00 €
  Und Lea erhält eine Benachrichtigung "Angebot angenommen"
  Und offene Kaufangebote anderer Interessenten zu dieser Anzeige werden als "nicht mehr verfügbar" beendet und diese erhalten eine Benachrichtigung

Szenario: Gegenangebot
  Angenommen Lea hat 10,00 € angeboten
  Wenn Ben mit einem Gegenangebot über 13,00 € antwortet
  Dann ist Leas Angebot "beantwortet" und Lea erhält ein Gegenangebot über 13,00 €
  Und Lea kann es akzeptieren, ablehnen oder selbst ein neues Angebot senden
  Und akzeptiert Lea, ist die Anzeige für Lea zu 13,00 € reserviert

Szenario: Mit einer Nachricht antworten oder ablehnen
  Wenn Ben auf ein Kaufangebot mit einer normalen Nachricht antwortet
  Dann bleibt das Angebot offen
  Wenn Ben "Ablehnen" wählt
  Dann ist das Angebot abgelehnt und Lea kann ein neues senden
```

**Was der Interessent in der Anzeige sieht** (nicht in eigenen Anzeigen, nicht bei Gesuchen):

| Preistyp | Bedienelement | Betrag des Kaufangebots |
|---|---|---|
| Festpreis | Schaltfläche „Nehm ich“ mit Bestätigung | Anzeigenpreis |
| VB | Feld „Dein Angebot“ (Euro) und Schaltfläche „Angebot senden“ | eingegebener Betrag, 0,01 € bis 10.000 € (wie REQ-LST-002) |
| Zu verschenken | Schaltfläche „Nehm ich“ mit Bestätigung | 0,00 € |
| Tausch | kein Kaufangebot; Kontakt über den Chat | – |

**Zustände eines Kaufangebots**

| Zustand | Bedeutung | Übergang durch |
|---|---|---|
| offen | wartet auf Antwort der Gegenseite | Senden |
| akzeptiert | Deal vereinbart, Anzeige für den Käufer reserviert | Akzeptieren durch die Gegenseite |
| abgelehnt | Gegenseite lehnt ab | Ablehnen |
| beantwortet | Gegenseite hat ein Gegenangebot gesendet (dieses ist dann offen) | Gegenangebot |
| zurückgezogen | Absender nimmt sein offenes Angebot zurück oder ersetzt es durch ein neues | Zurückziehen, neues Angebot |
| nicht mehr verfügbar | Anzeige ist nicht mehr aktiv (reserviert für jemand anderen, abgegeben, pausiert, gelöscht, abgelaufen) | System |

**Regeln**

| Regel | Festlegung |
|---|---|
| Offene Angebote | höchstens eines je Konversation; ein neues ersetzt das eigene offene (vorheriges: zurückgezogen) |
| Akzeptieren, Ablehnen, Gegenangebot | nur die Gegenseite des offenen Angebots; Anbieter bei Kaufangeboten, Interessent bei Gegenangeboten |
| Akzeptieren | nur, solange die Anzeige aktiv ist; gleichzeitige Annahmen: höchstens ein Deal je Anzeige (REQ-CHAT-011) |
| Gegenangebot bei Festpreis | erlaubt; der Anbieter kann vom eigenen Preis abweichen |
| Darstellung | strukturierte Nachricht im Verlauf mit Betrag, Zustand und den passenden Schaltflächen; Beträge als Integer in Cent mit Währung |
| Ereignisse | Akzeptieren löst `DealAgreed` mit dem vereinbarten Betrag aus (REQ-CHAT-011) |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Kaufangebot auf eigene Anzeige, auf ein Gesuch oder auf Tausch | abgelehnt (422) |
| Anzeige nicht aktiv (reserviert, abgegeben, pausiert, abgelaufen, gelöscht, ausgeblendet) | kein Angebot möglich (409); offene Angebote werden „nicht mehr verfügbar“ |
| Betrag außerhalb 0,01 € bis 10.000 € oder bei Festpreis abweichend vom Anzeigenpreis | abgelehnt (422) |
| Blockierung in eine der beiden Richtungen | kein Angebot und keine Antwort möglich (wie Nachrichten, REQ-MOD-005) |
| Fremde oder die falsche Seite lösen Akzeptieren, Ablehnen oder Gegenangebot aus | abgelehnt (Fremde: nicht gefunden, REQ-SEC-006; falsche Seite: 403) |
| Doppelter Klick, Wiederholung nach Netzfehler | idempotent über eine Client-ID wie bei Nachrichten (REQ-CHAT-002) |
| Massenhafte Angebote („Nehm ich“ auf viele Anzeigen) | gleiche Rate-Limits wie neue Konversationen und Nachrichten (REQ-CHAT-007) |
| Käufer erscheint nicht zur Übergabe | Anbieter hebt die Reservierung auf (REQ-CHAT-011); Bewertung nach REQ-MOD-006 |
| Angebot verlangt Bezahlung oder Daten außerhalb der Plattform | Sicherheitshinweis im Chat (REQ-UX-005), meldbar (REQ-MOD-001) |

## INVEST
I: nutzt Konversation, Deal-Kern und Benachrichtigungen, ändert sie nicht · N: Texte und Zustandsnamen verhandelbar · V: eindeutige Absprache mit einem Klick · E: mittel · S: ein Sprint · T: automatisierbar.

## Nachweis
- `AT-CHAT-009`: Integrationstest – Zustandsmodell und Regeln: Nehm ich (Festpreis, verschenken), Preisangebot (VB), Akzeptieren reserviert mit Betrag und beendet andere offene Angebote, Gegenangebot in beide Richtungen, Ablehnen, Ersetzen, Rechte der Seiten, Anzeige nicht aktiv, Idempotenz.
- `AT-CHAT-009-2`: API-Test der Fehlerfälle: eigene Anzeige, Gesuch, Tausch, Betragsgrenzen, Festpreis abweichend, Blockierung, Fremde 404, falsche Seite 403, gleichzeitiges Akzeptieren zweier Angebote ergibt genau einen Deal.
- `AT-CHAT-009-3`: E2E-Test – „Nehm ich“ und „Angebot senden“ in der Anzeige, Kaufangebot erscheint beim Anbieter in der Konversation, Akzeptieren und Gegenangebot per Tastatur; axe-core ohne `serious`/`critical`.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog (nur Preisvorschlag) |
| 2.0 | 2026-10-23 | Reservierung für eine Person und Deal-Zustände aufgenommen (wie umgesetzt), Akzeptanzkriterien |
| 3.0 | 2026-10-23 | Review v0.2: R-15/R-21 Deal-Kern nach REQ-CHAT-011 abgespalten (Q-17); wieder reiner Preisvorschlag mit Nutzen („damit …“, R-17) |
| 4.0 | 2026-11-13 | Change Request des Auftraggebers (Q-31): „Nehm ich“ bei Festpreis und Verschenken, Preisangebot bei VB, Kaufangebot in der Konversation des Anbieters, Akzeptieren reserviert für den Käufer (Deal vereinbart), Gegenangebot in beide Richtungen, Zustandsmodell und Regeln, Benachrichtigung über REQ-NOTI-008. Titel angepasst, MoSCoW C → S, Release R1 → R2, Kano begeisterung → leistung, Risiko low → medium (Fehler- und Missbrauchsfälle ergänzt). Nachweise AT-CHAT-009 und -3 neu, AT-CHAT-009-2 präzisiert. Freigabe Product Owner |
