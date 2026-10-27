# ADR-0003: Eigene Authentifizierung mit Hochschul-E-Mail-Verifikation

- **Status:** Accepted (nach Architektur-Review v1.0, 2026-10-23)
- **Erweitert durch:** [ADR-0013](0013-anmeldung-identity-provider-port.md) (Anmeldung hinter IdentityProviderPort, Hochschul-SSO als späterer Adapter); [ADR-0014](0014-ip-pseudonymisierung.md) (Pseudonymisierung der IP-Adressen für Rate-Limits)
- **Datum:** 2026-10-20
- **Bezug:** REQ-AUTH-*, REQ-SEC-002…005; Guideline Kap. 07 / 14 (Default: managed IdP)

## Kontext
Kernanforderung: Nur Adressen mit `@hwg-lu.de` oder `@studmail.hwg-lu.de`, verifiziert per E-Mail. Die Guideline empfiehlt **managed Identity**, außer bei der „simplest first-party login“. Wir brauchen weder SSO noch Social Login. MFA ist optional.

## Optionen
| Option | Pro | Contra |
|---|---|---|
| **A: Bewährte Auth-Bibliothek im eigenen Backend** (z. B. Better Auth, oder Fastify-Session + Argon2 + eigene Token-Logik) | Volle Kontrolle über Whitelist, neutrale Antworten, Re-Verifikation. Keine Drittanbieter-Daten. Kostenlos | Eigene Verantwortung für sicherheitskritischen Code |
| B: Keycloak (self-hosted) | Ausgereift, MFA, später SAML/Shibboleth-Föderation möglich | Hoher Betriebsaufwand (eigener Container, Updates, Theme), Domain-Whitelist nur über SPI oder Policy |
| C: SaaS-IdP (Auth0, Clerk) | Wenig Code | US-Anbieter (DSGVO-Abwägung), Kosten bei Wachstum, Whitelist über Actions |
| D: **Hochschul-SSO (Shibboleth / DFN-AAI, SAML)** | Beste Verifikation, kein Passwort bei uns, Exmatrikulierte verlieren automatisch den Zugang | Braucht die Kooperation des RZ, SAML-Integration ist aufwendig, die Anforderung „Registrierung per E-Mail“ würde ersetzt |

## Entscheidung
**Option A** für das MVP. Serverseitige Sessions (Opaque-Token, gehasht in der Postgres-Tabelle `identity.session`, Cookie `HttpOnly; Secure; SameSite=Lax`; auf `http://localhost` akzeptieren die Browser `Secure`-Cookies), Prüfung neuer Passwörter gegen eine **lokal mitgelieferte** Leak-Liste (offline-fähig, ADR-0010), Argon2id, Verifikations- und Reset-Tokens nur gehasht gespeichert, einmalig und mit kurzer Gültigkeit.
**Option D** kommt als Backlog-Item INST-04 und wird mit dem RZ geklärt (Review A-3).

## Konsequenzen
- **Guideline-Abweichung (SHOULD)** von „managed IdP“, dokumentiert hier. Kompensation: ASVS-L2-Checkliste, Security-Tests, keine selbst erfundene Kryptografie.
- Die Whitelist-Logik bleibt reine Fachlogik im Modul `identity` und ist vollständig testbar (Entscheidungstabelle BR-01).
