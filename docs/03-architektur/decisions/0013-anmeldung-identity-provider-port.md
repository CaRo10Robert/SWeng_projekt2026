# ADR-0013: Anmeldung hinter einem IdentityProviderPort (Hochschulkennung, Q-12)

- **Status:** Proposed (vorläufige Entscheidung Q-12, Abstimmung mit Dozent/in ausstehend)
- **Datum:** 2026-10-23 (überarbeitet nach Architektur-Review A-10)
- **Bezug:** Fallstudie FS-C3, Constraint C-03, REQ-AUTH-009, REQ-AUTH-001/002/005, ADR-0003, ADR-0010, Entscheidungslog Q-12 und Q-20

## Kontext
Die Fallstudie verlangt: „Die Anmeldung erfolgt über die Hochschulkennung“ (FS-C3). Der MVP meldet mit der verifizierten Hochschul-E-Mail-Adresse und einem eigenen Passwort an (ADR-0003). Ein echtes Single Sign-on (Shibboleth/DFN-AAI per SAML oder ein OIDC-Dienst des Rechenzentrums) braucht die Kooperation der Hochschule und widerspricht im Docker-Beispiel der Offline-Vorgabe (ADR-0010). SSO-Verfahren laufen über eine **Umleitung in zwei Schritten** (Start, Rückkehr mit signierter Antwort), ein Passwortverfahren über ein Formular.

## Optionen
| Option | Pro | Contra |
|---|---|---|
| A: Nur Hochschul-E-Mail + Passwort (Stand Prototyp) | Offline, bereits umgesetzt | FS-C3 nicht wörtlich erfüllt; Umbau, falls SSO kommt |
| B: SSO mit simuliertem IdP als vierter Compose-Dienst (z. B. Keycloak) | FS-C3 im Beispiel vorführbar | Zusätzlicher Dienst, hoher Konfigurationsaufwand, Konflikt mit REQ-ARCH-005; beweist nicht die echte Anbindung |
| **C: Anmeldeverfahren hinter einem zweistufigen `IdentityProviderPort`**, Passwortverfahren im Beispiel, SSO-Adapter später | Keine Umbaukosten in anderen Modulen, offline, Abweichung klar begrenzt | FS-C3 im Beispiel nur vorbereitet (dokumentierte Abweichung) |

## Entscheidung
**Option C.**
1. **Port** im Modul `identity`, zweistufig, damit Formular- und Umleitungsverfahren dieselbe Schnittstelle haben:
   - `begin(request) → { kind: 'form' } | { kind: 'redirect', url, state }`
   - `complete(input) → VerifiedIdentity { email, attributes }` oder Fehler
   Sitzungen, Rollen, Sperren, Whitelist (BR-01), Einwilligungen und Rate-Limits bleiben im Modul und gelten für jedes Verfahren gleich.
2. **Passwortverfahren** (`PasswordIdentityProvider`): interner Adapter im Modul `identity`, weil er den Passwort-Hash aus dem eigenen Schema braucht. `begin` liefert `form`, `complete` prüft Adresse und Passwort (Argon2id, gleiche Antwortzeit bei unbekannter Adresse).
3. **SSO-Adapter** (später, `platform/adapters`): müssen Signatur, Aussteller und Audience der Antwort, eine Zeittoleranz (≤ 5 min) und Replay-Schutz (`state`/`nonce`, einmalig) prüfen. Nur serverseitig geprüfte Antworten gelten (REQ-AUTH-009).
4. **Kontoverknüpfung** über die kanonische Hochschuladresse: gleiche Adresse = gleiches Konto. Liefert das Verfahren keine Adresse einer Whitelist-Domain, wird die Anmeldung abgelehnt.
5. **Nutzertyp** folgt immer aus der Whitelist-Domain (BR-01); Attribute des Verfahrens werden nur protokolliert (Entscheidung Q-20).
6. **Erstanmeldung per SSO** legt das Konto erst nach Zustimmung zu den Nutzungsbedingungen an (REQ-PRIV-001).
7. **Verdrahtung** in `main.ts`; nur `identity` kennt den Port, eine dependency-cruiser-Regel verhindert Importe aus anderen Modulen.

## Konsequenzen
- (+) SSO ist ein neuer Adapter plus Konfiguration; andere Module ändern sich nicht.
- (+) Prüfbar im Beispiel: Test des Anmeldeablaufs gegen ein simuliertes zweites Verfahren (Nachweis AT-AUTH-009, Backlog B-05) und unveränderter Smoke-Test.
- (−) Bis zur Abstimmung mit der Hochschule ist FS-C3 eine **dokumentierte Abweichung** (Constraint C-03, Q-12).
- Spike S-01 klärt mit dem Rechenzentrum, welches Verfahren (SAML/OIDC) und welche Attribute verfügbar sind.
