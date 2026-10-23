# Project intelligence: CampusMarkt HWG LU

- Follow the DEV Guideline: https://github.com/CaRo10Robert/dev_guideline. Re-read the relevant chapter before writing requirements, architecture, or code.
- Docs are in German, in Markdown under `docs/`, and use Mermaid for diagrams (PlantUML only for UML use case diagrams).
- Requirement IDs follow `REQ-<AREA>-NNN`, use cases follow `UC-NN`, ADRs live in `docs/03-architektur/decisions/NNNN-title.md`. Never renumber or delete an ID. Supersede it instead.
- Registration is restricted to whitelisted university domains (`hwg-lu.de`, `studmail.hwg-lu.de`).
- Payment is out of scope for the MVP, but the architecture must keep the payment port (ADR-0006) intact.
- There is no public hosting. The deliverable is a local Docker Compose example (`app` + `db` + `mailpit`, ADR-0010) that runs offline with no external accounts. Every simplified infrastructure piece sits behind a port.
