# Protokolle manueller Nachweise

Protokolle der manuellen Nachweise (`MAN-…`) aus dem [Nachweiskatalog](../../02-anforderungen/nachweise.md). Es sind Übungen im Rahmen der Fallstudie: Personen, Szenarien und einzelne Messwerte sind fiktiv, wo das Protokoll es so kennzeichnet (Q-28).

| Nachweis | Anforderung | Ergebnis | Protokoll |
|---|---|---|---|
| MAN-OPS-008 | REQ-OPS-008 Überwachung und Alarmierung | bestanden: Alarm-Mail nach 196 s (Ziel ≤ 5 min), Entwarnung nach 295 s | [MAN-OPS-008.md](MAN-OPS-008.md) |
| MAN-OPS-011 | REQ-OPS-011 Betriebshandbuch, Störungsprozess | durchgeführt: Störung nach 3 min 32 s behoben; Handbuch-Lücken H-1 bis H-4, Code-Befund B-1 (Absturz bei DB-Ausfall) | [MAN-OPS-011.md](MAN-OPS-011.md) |
| MAN-AVAIL-002 | REQ-AVAIL-002 Wiederherstellungsziele | RTO 26 s (bestanden); RPO ≤ 1 h im Echtbetrieb mit täglicher Sicherung nicht erreichbar | [MAN-AVAIL-002.md](MAN-AVAIL-002.md) |
| MAN-LEGAL-013 | REQ-LEGAL-013 Datenpannen-Prozess | bestanden: Tabletop mit fiktivem Szenario, Meldung nach 28 h 50 min (Frist 72 h) | [MAN-LEGAL-013.md](MAN-LEGAL-013.md) |
| MAN-NOTI-004 | REQ-NOTI-004 Zustellbarkeit | als Übung bestanden; mail-tester-Werte fiktiv, Header echt geprüft; Befunde N-1 (Absenderdomain), N-2 (`Reply-To`) | [MAN-NOTI-004.md](MAN-NOTI-004.md) |
| MAN-OPS-003 | REQ-OPS-003 Schnellstart | bestanden (simuliert): 1 min 16 s bis Anmeldung | [MAN-OPS-003.md](MAN-OPS-003.md) |
| MAN-PORT-001 | REQ-PORT-001 Entwicklungsumgebung | bestanden (simuliert): 3 min 25 s; README-Lücken P-1 bis P-4 | [MAN-PORT-001.md](MAN-PORT-001.md) |
