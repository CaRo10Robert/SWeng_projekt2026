# ADR-0013: Anmeldung hinter einem IdentityProviderPort (Hochschulkennung, Q-12)

- **Status:** Proposed (vorläufige Entscheidung Q-12, Abstimmung mit Dozent/in ausstehend)
- **Datum:** 2026-10-23
- **Bezug:** Fallstudie FS-C3, Constraint C-03, REQ-AUTH-009, REQ-AUTH-001/002/005, ADR-0003, ADR-0010, Entscheidungslog Q-12

## Kontext
Die Fallstudie verlangt: „Die Anmeldung erfolgt über die Hochschulkennung“ (FS-C3). Der MVP meldet mit der verifizierten Hochschul-E-Mail-Adresse und einem eigenen Passwort an (ADR-0003). Ein echtes Single Sign-on (Shibboleth/DFN-AAI per SAML oder ein OIDC-Dienst des Rechenzentrums) braucht die Kooperation der Hochschule und widerspricht im Docker-Beispiel der Offline-Vorgabe (ADR-0010).

## Optionen
| Option | Pro | Contra |
|---|---|---|
| A: Nur Hochschul-E-Mail + Passwort (Stand MVP) | Offline, bereits umgesetzt | FS-C3 nicht wörtlich erfüllt; Umbau, falls SSO kommt |
| B: SSO mit simuliertem IdP als vierter Compose-Dienst (z. B. Keycloak) | FS-C3 im Beispiel vorführbar | Zusätzlicher Dienst, hoher Konfigurationsaufwand, Konflikt mit REQ-ARCH-005 (drei Dienste); ein simulierter IdP beweist nicht die echte Anbindung |
| **C: Anmeldeverfahren hinter einem `IdentityProviderPort`**, Adapter „Hochschul-E-Mail + Passwort“ im Beispiel, SSO-Adapter später | Keine Umbaukosten, offline, Abweichung klar begrenzt | FS-C3 im Beispiel nur vorbereitet, nicht erfüllt (dokumentierte Abweichung) |

## Entscheidung
**Option C.**
1. Das Modul `identity` definiert den Port `IdentityProviderPort` mit genau einer Aufgabe: aus Anmeldedaten eine **geprüfte Identität** ermitteln (`authenticate(credentials) → { email, userType? } | Fehler`). Sitzungen, Rollen, Sperren, Whitelist (BR-01) und Rate-Limits bleiben im Modul und gelten für jedes Verfahren gleich.
2. Adapter im Beispiel: `PasswordIdentityProvider` (Hochschuladresse + Passwort, Argon2id).
3. Späterer Adapter: `OidcIdentityProvider` bzw. SAML über DFN-AAI. Kontoverknüpfung über die **kanonische Hochschuladresse** (gleiche Adresse = gleiches Konto); Nutzertyp aus der Domain, ersatzweise aus einem IdP-Attribut (`eduPersonAffiliation`). Liefert der IdP keine Adresse einer Whitelist-Domain, wird die Anmeldung abgelehnt.
4. Nur `identity` kennt Adapter dieses Ports (Fitness Function `pnpm lint:deps`).

## Konsequenzen
- (+) SSO ist ein neuer Adapter und eine Konfiguration, keine Änderung an anderen Modulen.
- (+) Prüfbar im Beispiel: Unit-Test des Anmeldeablaufs gegen ein simuliertes zweites Verfahren; Smoke-Test unverändert grün.
- (−) Bis zur Abstimmung mit der Hochschule ist FS-C3 eine **dokumentierte Abweichung** (Constraint C-03, Entscheidungslog Q-12).
- Spike S-01 klärt mit dem Rechenzentrum, welches Verfahren (SAML/OIDC) und welche Attribute verfügbar sind.
