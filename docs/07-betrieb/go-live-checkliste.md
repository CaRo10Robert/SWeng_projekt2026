---
id: OPS-GOLIVE
type: checklist
status: in-review
owner: product-owner
version: 1.0
created: 2026-10-24
last_updated: 2026-10-24
---

# Go-live-Checkliste

> **Muster im Rahmen einer Übungsaufgabe.** Diese Liste fasst zusammen, was vor einem echten Betrieb (EPIC-12) erledigt sein muss. Im Docker-Beispiel bleibt sie bewusst offen.

## Recht und Datenschutz

- [ ] Betreiber festgelegt (Hochschule, Organisationseinheit) und alle `[Platzhalter: …]` in `apps/web/src/content/legal/`, `docs/06-recht/` und `docs/07-betrieb/` ersetzt (Suche nach `Platzhalter`)
- [ ] Hinweis „Muster im Rahmen einer Übungsaufgabe“ aus allen Rechtstexten entfernt
- [ ] Impressum, Datenschutzerklärung, Nutzungsbedingungen, Community-Regeln vom Justiziariat und DSB freigegeben
- [ ] Erklärung zur Barrierefreiheit nach manueller Prüfung (MAN-A11Y-001) aktualisiert, Durchsetzungsstelle eingetragen
- [ ] VVT und TOMs freigegeben, DSFA-Schwellwertanalyse unterschrieben
- [ ] Auftragsverarbeitungsverträge abgeschlossen
- [ ] Rechtsgrundlagen im LDSG/Hochschulgesetz geprüft
- [ ] DAC7: Einstufung als meldender Plattformbetreiber geklärt; Zugang zum BZSt-Portal
- [ ] DSA: Kontaktstelle besetzt, Moderationsteam geschult, Bereitschaft für Art. 18 geregelt
- [ ] `TERMS_VERSION` auf die freigegebene Version gesetzt

## Sicherheit

- [ ] Penetrationstest durchgeführt, keine offenen kritischen/hohen Befunde ([Plan](pentest-plan.md))
- [ ] Sicherheitsscans in CI aktiv (B-06), keine offenen kritischen Funde
- [ ] `security.txt` mit echter Kontaktadresse und gültigem `Expires`
- [ ] Geheimnisse (DB-Passwort, SMTP, `IP_HASH_SALT`) im Secret-Store, nicht im Repo
- [ ] `DEMO_MODE=false`, `SEED_DEMO=false`; Demo-Konten nicht vorhanden
- [ ] Admin- und Moderationskonten personalisiert, Rollenliste geprüft

## Betrieb

- [ ] Domain und DNS eingerichtet; TLS-Zertifikat, HSTS ([TLS](tls-reverse-proxy.md))
- [ ] SPF, DKIM, DMARC eingerichtet; Testmails an Hochschul-Postfächer kommen an ([Zustellbarkeit](mail-zustellbarkeit.md))
- [ ] Backups täglich, verschlüsselt, an zweitem Standort; Restore-Übung erfolgreich protokolliert ([Backup](backup-restore.md))
- [ ] Monitoring und Alarmierung aktiv, Rufbereitschaft benannt ([Monitoring](monitoring-alarmierung.md))
- [ ] Statusseite erreichbar, externe Spiegelung eingerichtet
- [ ] Betriebshandbuch und Incident-Prozess dem Betriebsteam bekannt
- [ ] Renovate aktiv, Verantwortliche für Updates benannt
- [ ] `api` und `worker` ggf. getrennt, `TRUST_PROXY` gesetzt (B-41)
- [ ] Lasttest gegen die Produktivumgebung (QS-7, QS-12)

## Produkt

- [ ] Englische Oberfläche geprüft (Muttersprachler/in)
- [ ] Hilfe/FAQ mit echten Kontaktwegen
- [ ] Kommunikationsplan für den Start (Hochschul-Newsletter, AStA) [Platzhalter]

Freigabe: [Platzhalter: Datum, Name, Rolle]
