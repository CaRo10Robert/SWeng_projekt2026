---
id: REQ-ACC-005
title: Profil anderer Mitglieder ansehen
type: user-story
class: functional
status: verified
owner: team-produkt
risk: medium
release: R2
moscow: S
kano: leistung
epic: EPIC-07
source: Auftraggeber (2026-11-13, Q-30), Reverse Engineering Kleinanzeigen
use_cases: [UC-18]
depends_on: [REQ-ACC-001, REQ-PRIV-002, REQ-MOD-005]
version: 1.2
created: 2026-11-13
last_updated: 2026-11-13
verification: [AT-ACC-005, AT-ACC-005-2, AT-ACC-005-3]
---

# REQ-ACC-005 Profil anderer Mitglieder ansehen

## Anforderung
Als Mitglied möchte ich über den Namen des Anbieters bzw. meines Gegenübers dessen **Profil öffnen** und dort seine öffentlichen Profilangaben, seine aktiven Anzeigen und seine Bewertungen sehen, damit ich vor einer Anfrage oder Übergabe einschätzen kann, mit wem ich es zu tun habe.

## Begründung
Bisher zeigt die Anzeige nur eine Kurzinfo (UC-14), die nicht weiterführt. Ein Profil ist der Ort, an dem Bewertungen sichtbar werden (REQ-MOD-006), und stärkt das Vertrauen (BG-1). Es zeigt nur, was das Mitglied ohnehin für andere pflegt (REQ-ACC-001), und nie Kontaktdaten (REQ-PRIV-002, Fallstudie FS-C1).

## Akzeptanzkriterien
```gherkin
Szenario: Profil des Anbieters aus der Anzeige öffnen
  Angenommen ich bin als Lea angemeldet und sehe Bens Anzeige "Lehrbuch Statistik"
  Wenn ich auf Bens Anzeigenamen klicke oder ihn per Tastatur auswähle
  Dann öffnet sich Bens Profil
  Und ich sehe seinen Anzeigenamen, "Studierende", "Mitglied seit", seinen Studiengang und seine bevorzugten Übergabeorte
  Und ich sehe seine aktiven Anzeigen
  Und ich sehe seine Bewertungen getrennt nach "als Verkäufer" und "als Käufer"

Szenario: Profil aus einer Konversation öffnen
  Angenommen Lea und Ben haben eine Konversation
  Wenn Lea im Kopf der Konversation auf Bens Anzeigenamen klickt
  Dann öffnet sich Bens Profil

Szenario: Keine Kontaktdaten im Profil
  Wenn ein Mitglied ein fremdes Profil öffnet
  Dann enthält weder die Seite noch die Antwort der Schnittstelle eine E-Mail-Adresse

Szenario: Blockierung
  Angenommen Ben hat Lea blockiert
  Wenn Lea Bens Profil aufruft
  Dann sieht sie "Profil nicht verfügbar" mit Status 404
```

**Angezeigte Angaben**

| Angabe | Sichtbar | Quelle |
|---|---|---|
| Anzeigename | immer | REQ-ACC-001 |
| Profilbild | wenn hinterlegt (ab REQ-ACC-004), sonst Platzhalter | REQ-ACC-004 |
| Nutzertyp (Studierende / Beschäftigte), Mitglied seit (Monat und Jahr) | immer | Whitelist-Domain (BR-01) |
| Studiengang, bevorzugte Übergabeorte | wenn gepflegt | REQ-ACC-001 |
| Aktive Anzeigen (Status aktiv und reserviert), neueste zuerst, paginiert | immer | REQ-LST-001, ADR-0009 |
| Bewertungsübersicht und Bewertungsliste | sobald REQ-MOD-006 umgesetzt ist | REQ-MOD-006 |
| Aktionen Melden und Blockieren | immer, nicht im eigenen Profil | REQ-MOD-001, REQ-MOD-005 |
| E-Mail-Adresse, Rolle, letzte Aktivität, abgegebene oder pausierte Anzeigen | **nie** | REQ-PRIV-002 (Datenminimierung) |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Aufruf ohne Anmeldung | Weiterleitung zur Anmeldung, keine Profildaten (Q-1, REQ-SEC-007) |
| Unbekannte, gesperrte, gelöschte oder zur Löschung vorgemerkte Konten | 404 „Profil nicht verfügbar“, nicht unterscheidbar (keine Rückschlüsse auf Sperren) |
| Blockierung in eine der beiden Richtungen | 404 wie oben, gleiche Regel wie in der Suche (REQ-SRCH-006); Aufheben über die eigene Blockierungsliste |
| Profil durch Meldungen vorläufig ausgeblendet | 404, bis die Moderation entschieden hat (REQ-MOD-004, B-15) |
| Durchprobieren von Profil-IDs | nicht fortlaufende IDs; allgemeines Rate-Limit (REQ-SEC-005) |
| Anstößige Profilangaben | meldbar als Profil (REQ-MOD-001) |
| Eigenes Profil aufgerufen | Ansicht wie für andere, mit Link „Profil bearbeiten“ |

## INVEST
I: nutzt vorhandene Profil- und Anzeigendaten; Bewertungen erscheinen, sobald REQ-MOD-006 geliefert ist · N: Umfang der Angaben verhandelbar · V: Vertrauen vor der Anfrage · E: mittel · S: ein Sprint · T: automatisierbar.

## Nachweis
- `AT-ACC-005`: E2E-Test (`member-profile.spec.ts`) – Profil aus Anzeige und Konversation öffnen (Maus und Tastatur), Angaben und aktive Anzeigen sichtbar, keine E-Mail-Adresse in der Seite; axe-core ohne `serious`/`critical`.
- `AT-ACC-005-2`: Integrationstest (`identity.integration.test.ts`) – Antwort enthält genau die freigegebenen Felder, keine E-Mail-Adresse; Profil-Anzeigen nur aktiv und reserviert, Keyset-paginiert.
- `AT-ACC-005-3`: Integrationstest (`identity.integration.test.ts`) – Gäste 401 ohne Profildaten (Web-App leitet zur Anmeldung, wie im Fehlerfall oben); unbekannte, gesperrte, gelöschte, blockierte und ausgeblendete Profile mit derselben 404 `profile_not_found`.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-11-13 | Erstfassung auf Wunsch des Auftraggebers (Q-30) |
| 1.1 | 2026-11-13 | Requirements-Review und Freigabe durch den Product Owner (Definition of Ready: Nachweise und Akzeptanzkriterien vorhanden); Status → approved, Umsetzung als B-69 |
| 1.2 | 2026-11-13 | Umgesetzt (B-69): `GET /users/:id/profile`, `GET /users/:id/listings` (Keyset-paginiert), Profilseite `/users/:id` mit Links aus Anzeige und Chat, Melden und Blockieren. Nachweis AT-ACC-005-3 an den Fehlerfall „Aufruf ohne Anmeldung“ angeglichen (API 401, Web leitet zur Anmeldung, statt 404). Bewertungen im Profil folgen mit REQ-MOD-006 (B-70). Status → verified |
