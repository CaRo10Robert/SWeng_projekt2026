---
id: REQ-LEGAL-003
title: Nutzungsbedingungen und Community-Regeln
type: business-rule
class: constraint
status: approved
owner: team-produkt
risk: medium
release: R1
moscow: M
moscow_reason: [2]
kano: basis
epic: EPIC-13
source: DSA Art. 14, BGB §§ 305 ff., Q-23
use_cases: [UC-01, UC-08]
depends_on: [REQ-PRIV-001]
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
verification: [AT-LEGAL-003, AT-LEGAL-003-2, CTRL-DOC-LEGAL-TEXTE]
---

# REQ-LEGAL-003 Nutzungsbedingungen und Community-Regeln
## Anforderung
Das System muss versionierte Nutzungsbedingungen und Community-Regeln in klarer, verständlicher Sprache bereitstellen. Eine neue Version der Nutzungsbedingungen gilt für ein Mitglied erst nach seiner erneuten Zustimmung.

> Übungsaufgabe: Inhalte mit Betreiberbezug stehen als Platzhalter `[Platzhalter: …]` (Q-23). Kein Rechtsrat; im Echtbetrieb prüft die/der Datenschutzbeauftragte bzw. das Justiziariat der Hochschule.

## Begründung
DSA Art. 14 verlangt verständliche Bedingungen, die Beschränkungen, Moderation und Beschwerdewege beschreiben. Die Registrierung speichert schon eine Zustimmung mit Version (REQ-PRIV-001); der zugehörige Text fehlt bisher.

## Akzeptanzkriterien
Pflichtinhalte der Nutzungsbedingungen:
1. Geltungsbereich, Betreiber (Platzhalter), zugelassener Personenkreis (nur Mitglieder mit Whitelist-Domain, BR-01).
2. Nur private Angebote; keine gewerblichen Anbieter, keine Werbung.
3. Verbotene Artikel und Inhalte (Verweis auf die Community-Regeln und die Inhaltsprüfung REQ-LST-010).
4. Moderation: Melden, Prüfung durch Menschen, Maßnahmen (Entfernen, Sperren), Begründung (REQ-LEGAL-006), Widerspruch (REQ-LEGAL-007).
5. Rechte an Inhalten: Mitglieder räumen ein einfaches, auf die Darstellung im Dienst beschränktes Nutzungsrecht an Texten und Bildern ein; sie versichern, die Rechte an hochgeladenen Bildern zu haben.
6. Haftung: Der Betreiber ist nicht Vertragspartei der Geschäfte zwischen Mitgliedern.
7. Kündigung und Löschung des Kontos (REQ-ACC-002).
8. Änderungen: neue Version mit Datum, erneute Zustimmung.

Community-Regeln: respektvoller Umgang, keine Vorkasse-Aufforderungen, Übergabe an öffentlichen Orten, keine Weitergabe fremder Daten, Folgen von Verstößen.

| Zustimmung des Mitglieds | Aktuelle Version | Ergebnis beim Login |
|---|---|---|
| = aktuelle Version | – | normal angemeldet |
| ältere Version | neuer | Dialog „Neue Nutzungsbedingungen“ mit Änderungsübersicht und Link; schreibende Aktionen erst nach Zustimmung, Lesen und Konto löschen bleiben möglich |
| ältere Version, Mitglied lehnt ab | neuer | Hinweis auf Kündigung über „Konto löschen“; keine weiteren schreibenden Aktionen |

```gherkin
Szenario: Erneute Zustimmung nach Versionswechsel
  Angenommen Lea hat Version 2026-10 zugestimmt
  Und die aktuelle Version der Nutzungsbedingungen ist 2027-01
  Wenn Lea sich anmeldet
  Dann sieht sie den Dialog "Neue Nutzungsbedingungen"
  Und nach ihrer Zustimmung ist Version 2027-01 mit Zeitpunkt gespeichert
```

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Client sendet veraltete Version bei der Registrierung | 422 `terms_outdated` (bestehend) |
| Schreibende API-Anfrage ohne Zustimmung zur aktuellen Version | 403 `terms_required`, keine Änderung |
| Text und konfigurierte Version weichen ab | Startprüfung bzw. Unit-Test schlägt fehl (`TERMS_VERSION` = Version im Front Matter) |

## Nachweis
- `AT-LEGAL-003`: E2E-Test – Nutzungsbedingungen und Community-Regeln ohne Anmeldung erreichbar, Version sichtbar, aus dem Registrierungsformular verlinkt.
- `AT-LEGAL-003-2`: Smoke- oder Unit-Test – Mitglied mit älterer Zustimmung muss erneut zustimmen; schreibende Anfrage vorher 403 `terms_required`; danach Version gespeichert.
- `CTRL-DOC-LEGAL-TEXTE`: Kontrolle der Rechtstexte (siehe REQ-LEGAL-001).

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-10-24 | Erstfassung aus dem Abgleich Recht, Auftritt und Betrieb ([06-abgleich-recht-betrieb.md](../06-abgleich-recht-betrieb.md)); als Übung mit Platzhaltern freigegeben (Q-23) |
