---
id: OPS-INCIDENT
type: process
status: in-review
owner: architecture-lead
version: 1.1
created: 2026-10-24
last_updated: 2026-10-26
---

# Incident-Prozess

> **Muster im Rahmen einer Übungsaufgabe.** Anforderung: REQ-OPS-011. Sind personenbezogene Daten betroffen, gilt **zusätzlich** der [Datenpannen-Prozess](../06-recht/datenpannen-prozess.md) mit der 72-Stunden-Frist.

## Schweregrade

Die Grade SEV-1 bis SEV-4 entsprechen den Stufen S1 bis S4 aus REQ-OPS-011; die Alarmregeln setzen das Label `severity` entsprechend (SEV-1 bis SEV-3). Reaktionszeiten sind Übungswerte (Q-28).

| Grad | Beschreibung | Beispiele | Reaktion (erste Maßnahme) | Ziel Wiederherstellung |
|---|---|---|---|---|
| SEV-1 | Plattform nicht nutzbar oder Sicherheitsvorfall mit Datenbezug | App oder Datenbank nicht erreichbar; fremde Konversationen lesbar | 30 min, auch außerhalb der Dienstzeit (Rufbereitschaft) | 4 h |
| SEV-2 | wichtige Funktion gestört, Umgehung schwierig | keine E-Mails; Chat ohne Echtzeit; Upload schlägt fehl | 4 h in der Dienstzeit | 1 Werktag |
| SEV-3 | Beeinträchtigung mit Umgehung | Suche langsam; einzelne Jobs scheitern | nächster Werktag | 1 Woche |
| SEV-4 | kosmetischer Fehler, kein Einfluss auf die Nutzung | Tippfehler, Layoutfehler auf einer Seite | wöchentliches Review | nächstes Release |

## Rollen

| Rolle | Aufgabe |
|---|---|
| Incident-Leitung | koordiniert, entscheidet, hält den Zeitstrahl fest |
| Technik | analysiert und behebt |
| Kommunikation | Statusseite, Ankündigungsbanner, ggf. E-Mail an Mitglieder |
| `security-lead` / DSB | bei Sicherheits- oder Datenschutzbezug |

Bei kleinen Teams kann eine Person mehrere Rollen übernehmen, nie aber Technik und Kommunikation bei SEV-1.

## Ablauf

```mermaid
flowchart LR
  A["Erkennen<br/>(Alarm, Meldung)"] --> B["Einstufen<br/>SEV-1 bis SEV-4"]
  B --> C["Kommunizieren<br/>Statusseite, Banner"]
  C --> D["Eindämmen<br/>(Wartungsmodus, Rollback)"]
  D --> E["Beheben"]
  E --> F["Bestätigen<br/>Monitoring grün"]
  F --> G["Entwarnung<br/>Statusseite"]
  G --> H["Postmortem<br/>binnen 5 Werktagen"]
```

## Kommunikation

- **Statusseite** (`/status`) zeigt den technischen Zustand automatisch.
- **Ankündigungsbanner** (Admin-Oberfläche) informiert Mitglieder über Störung und erwartete Dauer (REQ-OPS-006).
- Bei SEV-1 mit Datenbezug: Abstimmung mit DSB vor jeder Mitteilung an Mitglieder.
- **Ausweichkanal** (Befund H-3 aus [MAN-OPS-011](../05-umsetzung/nachweise/MAN-OPS-011.md)): Statusseite und Banner sind Teil der App und fallen mit ihr aus. Bei SEV-1 informiert die Kommunikation deshalb zusätzlich über die Startseite des Hochschulportals und den Kanal der Stabsstelle Digitale Dienste (fiktiv: `https://www.hwg-lu.example/status`, Ticketsystem `support@hwg-lu.example`). Eine Rundmail an alle Mitglieder gibt es bewusst nicht.
- Notfallfunktion bei kompromittierten Sitzungen: „alle Sitzungen beenden“ (Betriebshandbuch, Abschnitt 6.2).

Textbaustein: „Derzeit ist [Funktion] gestört. Wir arbeiten an einer Lösung und melden uns bis [Uhrzeit] mit einem neuen Stand.“

## Postmortem-Vorlage

Ohne Schuldzuweisung (blameless):

| Abschnitt | Inhalt |
|---|---|
| Zusammenfassung | was, wann, wie lange, wer war betroffen |
| Zeitstrahl | Erkennen, Einstufen, Maßnahmen, Ende (mit Uhrzeiten) |
| Ursache | technische und organisatorische Ursache (5-Why) |
| Was gut lief / was nicht | |
| Maßnahmen | mit Backlog-ID, Verantwortlichem und Termin |
| Datenschutzbezug | ja/nein; wenn ja: Verweis auf Vorfallprotokoll |
