---
id: REQ-LST-013
title: Anzeigen alle 14 Tage erneuern, sonst pausieren und löschen
type: business-rule
class: domain
status: verified
owner: team-anzeigen
risk: medium
release: R2
moscow: S
kano: leistung
epic: EPIC-02
source: Auftraggeber (2026-11-13, Q-32)
use_cases: [UC-11, UC-17]
depends_on: [REQ-LST-008, REQ-NOTI-008, REQ-PRIV-003]
version: 1.2
created: 2026-11-13
last_updated: 2026-11-15
verification: [AT-LST-013, AT-LST-013-2, AT-LST-013-3]
---

# REQ-LST-013 Anzeigen alle 14 Tage erneuern, sonst pausieren und löschen

## Anforderung
Eine Anzeige, die **14 Tage** aktiv ist, muss der Anbieter **innerhalb eines Tages erneuern**. Erneuert er nicht, wird sie automatisch **pausiert** und ist nur noch für ihn sichtbar. Reaktiviert er sie nicht innerhalb von **2 weiteren Tagen**, wird sie **gelöscht**. Der Anbieter wird bei jedem dieser Schritte benachrichtigt (REQ-NOTI-008).

Ab R2 ersetzt diese Regel für **aktive** Anzeigen die Laufzeit von 60 Tagen mit Erinnerung 7 Tage vorher (REQ-LST-008). Einen eigenen Zustand „abgelaufen“ erreichen aktive Anzeigen dann nicht mehr: Ausgelaufen heißt **pausiert** (Entscheidung Q-32).

## Begründung
Wunsch des Auftraggebers (Q-32): Auf einem Campus-Marktplatz veralten Angebote schnell; Anzeigen sollen nur so lange sichtbar sein, wie der Anbieter sie aktiv pflegt. Das hält die Suche aktuell (BG-2) und verkürzt die Speicherdauer (REQ-PRIV-003, Datenminimierung).

## Akzeptanzkriterien
```gherkin
Szenario: Erneuerung fällig
  Angenommen Bens Anzeige ist seit 14 Tagen aktiv
  Wenn der Lebenszyklus-Lauf ausgeführt wird
  Dann bleibt die Anzeige aktiv und in der Suche
  Und Ben erhält die Benachrichtigung "Bitte erneuere deine Anzeige bis <Datum, Uhrzeit>"

Szenario: Erneuern
  Wenn Ben in der Anzeige oder aus der Benachrichtigung "Erneuern" wählt
  Dann ist die Anzeige wieder 14 Tage aktiv
  Und es entsteht keine Benachrichtigung, weil Ben selbst gehandelt hat

Szenario: Automatisch pausiert
  Angenommen Ben hat 1 Tag nach dem Hinweis nicht erneuert
  Dann ist die Anzeige pausiert, nicht in der Suche und für andere nicht abrufbar (404)
  Und Ben sieht sie unter "Meine Anzeigen" als "pausiert – wird am <Datum> gelöscht" mit "Reaktivieren"
  Und Ben erhält die Benachrichtigung "Deine Anzeige wurde pausiert"

Szenario: Reaktivieren nach automatischer Pause
  Wenn Ben die automatisch pausierte Anzeige vor der Löschung reaktiviert
  Dann ist sie wieder 14 Tage aktiv

Szenario: Löschung
  Angenommen die Anzeige ist seit 2 Tagen automatisch pausiert
  Wenn der Lebenszyklus-Lauf ausgeführt wird
  Dann ist die Anzeige mit Bildern gelöscht
  Und Ben erhält die Benachrichtigung "Deine Anzeige wurde gelöscht"
```

**Zeitachse** (Tag 0 = Beginn der aktiven Phase)

| Tag | Bedingung | Ergebnis | Benachrichtigung an den Anbieter |
|---|---|---|---|
| 0 | Veröffentlichung, Erneuern, Reaktivieren, Rückkehr nach „reserviert“ | aktiv, neue 14-Tage-Frist | nur, wenn nicht selbst ausgelöst (z. B. Rückfall der Reservierung, REQ-LST-008) |
| 14 | weiterhin aktiv, nicht erneuert | aktiv, Erneuerung fällig (Frist 24 h) | „Erneuerung fällig“ |
| 15 | Frist verstrichen | pausiert (Grund: automatisch), nur für den Anbieter sichtbar | „pausiert, wird am … gelöscht“ |
| 17 | 2 Tage automatisch pausiert, nicht reaktiviert | gelöscht inkl. Bilder | „gelöscht“ |

**Abgrenzung**

| Fall | Regel |
|---|---|
| Vom Anbieter selbst pausiert | keine 14-Tage-Frist; nach **90 Tagen** eigener Pause wird die Anzeige wie eine automatisch pausierte behandelt: Benachrichtigung, Löschung nach 2 weiteren Tagen |
| Reserviert | keine 14-Tage-Frist; Rückfall nach 30 Tagen wie bisher (REQ-LST-008), danach neue 14-Tage-Frist |
| Abgegeben | unverändert: Löschung 30 Tage nach Abgabe (REQ-LST-008, REQ-PRIV-003) |
| In Prüfung, durch Moderation ausgeblendet oder entfernt | Frist ruht; Moderation nach REQ-MOD-002/004 |
| Bestandsanzeigen bei Einführung | aktive Anzeigen älter als 14 Tage erhalten sofort „Erneuerung fällig“ mit voller Frist von 24 h; abgelaufene Anzeigen werden automatisch pausiert und nach 2 Tagen gelöscht, jeweils mit Benachrichtigung |
| Erneuern, Reaktivieren | eine Aktion des Anbieters in der Anzeige, unter „Meine Anzeigen“ oder aus der Benachrichtigung; nur der Anbieter |
| Prüfung | Lebenszyklus-Lauf mindestens stündlich; Fristen gelten ab dem gespeicherten Zeitpunkt, nicht ab dem Lauf (eine Verzögerung des Laufs verlängert keine Frist für andere Mitglieder sichtbar um mehr als 1 h) |
| E-Mail | zusätzlich zur Benachrichtigung in der App; abbestellbar über die Kategorie „Erinnerungen an ablaufende Anzeigen“ (REQ-NOTI-003). Die Benachrichtigung in der App kommt immer |

## Fehler- und Missbrauchsfälle
| Fall | Verhalten |
|---|---|
| Fremde versuchen zu erneuern oder zu reaktivieren | nicht gefunden (404, REQ-SEC-006) |
| Lebenszyklus-Lauf doppelt oder verspätet | idempotent: je Frist genau eine Benachrichtigung, kein doppelter Übergang |
| Erneuern genau während des Übergangs | genau ein Ergebnis: entweder erneuert (aktiv) oder pausiert; danach ist Reaktivieren möglich |
| Offene Kaufangebote beim automatischen Pausieren | werden „nicht mehr verfügbar“ (REQ-CHAT-009) mit Benachrichtigung an die Interessenten |
| Konversationen zur gelöschten Anzeige | bleiben erhalten, Anzeige erscheint als „gelöscht“ (wie bei Löschung durch den Anbieter) |
| Gesicherte Anzeige (Straftatverdacht, REQ-LEGAL-008) | wird nicht gelöscht, solange die Sicherung besteht |
| Anbieter hat E-Mails abbestellt | Benachrichtigung in der App bleibt; Löschung erfolgt trotzdem |

## Nachweis
- `AT-LST-013`: Integrationstest mit vorgestellter Zeit – Zeitachse Tag 0/14/15/17, Erneuern und Reaktivieren setzen die Frist neu, Abgrenzung selbst pausiert (90 Tage) und reserviert, Bestandsanzeigen, gesicherte Anzeigen, Idempotenz bei doppeltem Lauf, nur der Anbieter.
- `AT-LST-013-2`: Integrationstest – je Übergang genau eine Benachrichtigung an den Anbieter (App immer, E-Mail nur ohne Abbestellung), keine bei eigener Aktion; offene Kaufangebote werden beim Pausieren beendet.
- `AT-LST-013-3`: E2E-Test – „Erneuern“ in der Anzeige und „Reaktivieren“ unter „Meine Anzeigen“ mit Löschdatum, per Tastatur; pausierte Anzeige für andere 404.

## Änderungshistorie
| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-11-13 | Erstfassung auf Wunsch des Auftraggebers (Q-32): Erneuerung alle 14 Tage, Ausgelaufen = pausiert, Löschung nach 2 Tagen, Benachrichtigung bei jedem Schritt; Freigabe Product Owner |
| 1.1 | 2026-11-13 | Umgesetzt (B-76): Migration `0007_erneuerung.sql` (`paused_reason`, Übernahme der Bestandsanzeigen), Lebenszyklus-Lauf mit Hinweis, automatischer Pause und Löschung, neue Frist bei jeder Rückkehr nach „aktiv“, Mails „Erneuerung fällig“, „pausiert“, „gelöscht“, Hinweise in Anzeige und „Meine Anzeigen“. Demo-Daten im 14-Tage-Takt, eine Anzeige sofort fällig. AT-LST-013 bis -3 grün. Status implemented; verified mit B-73 (Beenden offener Kaufangebote beim Pausieren) |
| 1.2 | 2026-11-15 | Beenden offener Kaufangebote beim automatischen Pausieren mit B-73 umgesetzt und in AT-CHAT-009 geprüft; Status → verified |
