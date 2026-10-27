---
id: REQ-CHAT-001
title: Anbieter über anzeigenbezogenen Chat kontaktieren
type: user-story
class: functional
status: verified
owner: team-kommunikation
risk: high
reviewers: [product-owner, security-lead]
release: R1
moscow: M
moscow_reason: [1, 2]
kano: basis
epic: EPIC-04
source: BG-3, FS-C1
use_cases: [UC-20]
depends_on: [REQ-PRIV-002]
version: 2.2
created: 2026-10-20
last_updated: 2026-10-24
verification: [AT-CHAT-001, AT-CHAT-001-2, AT-CHAT-001-3, AT-CHAT-001-4]
---

# REQ-CHAT-001 Anbieter über anzeigenbezogenen Chat kontaktieren

## Anforderung
Als Interessent möchte ich den Anbieter über einen Chat zu seiner Anzeige kontaktieren, ohne dass E-Mail-Adressen oder andere Kontaktdaten offengelegt werden (einzige Ausnahme: beidseitige Freigabe nach REQ-CHAT-010), damit ich die Übergabe vereinbaren kann, ohne meine Daten preiszugeben.

Kontaktdaten werden ausschließlich nach **beidseitiger Freigabe** gemäß REQ-CHAT-010 sichtbar.

## Begründung
Der Chat ermöglicht Abschlüsse (BG-3); der Schutz der Kontaktdaten ist Constraint FS-C1 der Fallstudie.

**Must-Begründung:** Kriterium 1 (Release-Ziel nicht ohne sie erreichbar); Kriterium 2 (Sicherheits-, Datenschutz- oder Rechtsrisiko bei Fehlen).

## Akzeptanzkriterien
```gherkin
Szenario: Erste Kontaktaufnahme
  Angenommen Anzeige "Statistik-Buch" von Ben ist aktiv
  Und ich bin als Lea angemeldet
  Wenn ich "Ist das noch da?" an Ben sende
  Dann existiert eine Konversation zwischen Lea und Ben zur Anzeige "Statistik-Buch"
  Und Ben sieht die Nachricht ohne Neuladen, falls er online ist
  Und weder Lea noch Ben sehen die E-Mail-Adresse des anderen

Szenario: Eigene Anzeige
  Angenommen ich bin Ben
  Wenn ich meine eigene Anzeige öffne
  Dann wird mir "Nachricht schreiben" nicht angeboten
  Und eine direkte Anfrage wird abgelehnt

Szenario: Blockiert
  Angenommen Ben hat Lea blockiert
  Wenn Lea eine Nachricht an Ben senden will
  Dann wird die Nachricht abgelehnt mit "Kontakt nicht möglich"
  Und Ben wird nicht benachrichtigt

Szenario: Anzeige nicht verfügbar
  Angenommen die Anzeige ist pausiert, abgegeben, in Prüfung oder gelöscht
  Wenn ich eine neue Konversation starten will
  Dann wird das abgelehnt
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Kontaktdaten in Antworten der Schnittstelle | keine E-Mail-Adresse in Konversations-, Nachrichten- und Profildaten (ohne Freigabe) |
| Gegenüber gesperrt oder gelöscht | „Kontakt nicht möglich“ |
| Massenhafte Erstkontakte | Rate-Limit (REQ-CHAT-007) |

## INVEST
I: Echtzeit separat (REQ-CHAT-003) · N: Darstellung verhandelbar · V: Kernnutzen · E: mittel · S: ein Sprint · T: Szenarien automatisierbar.

## Nachweis
- `AT-CHAT-001`: Smoke-Test – Konversation starten, Anbieter erhält die Nachricht.
- `AT-CHAT-001-2`: API-Test – Antworten zu Konversation und Nachrichten enthalten keine E-Mail-Adressen (neu).
- `AT-CHAT-001-3`: API-Test – Kontakt zur eigenen Anzeige wird abgelehnt (neu).
- `AT-CHAT-001-4`: API-Test – Kontakt bei Blockierung wird mit „Kontakt nicht möglich“ abgelehnt (neu).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-20 | Erstfassung im Katalog mit GWT |
| 2.0 | 2026-10-23 | Ausnahme für beidseitige Kontaktfreigabe (REQ-CHAT-010, Fallstudie FS-C1); Szenario „Anzeige nicht verfügbar“ |
| 2.1 | 2026-10-23 | Review v0.2: Must-Begründung (moscow_reason) |
| 2.2 | 2026-10-24 | Verifiziert im finalen Lauf gegen das Docker-Beispiel (AT-CHAT-001, AT-CHAT-001-2, AT-CHAT-001-3, AT-CHAT-001-4 bestanden bzw. ausgeführt); Status → verified |
