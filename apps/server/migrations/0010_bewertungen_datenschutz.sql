-- Bewertungen in Moderation und Datenschutz (B-71, REQ-MOD-001, REQ-PRIV-003, REQ-ACC-003)
-- Bewertungen sind meldbar (Zieltyp 'rating'); Entscheidungen und Beweissicherung gelten wie für Nachrichten.
ALTER TABLE trust.moderation_case DROP CONSTRAINT IF EXISTS moderation_case_target_type_check;
ALTER TABLE trust.moderation_case ADD CONSTRAINT moderation_case_target_type_check
  CHECK (target_type IN ('listing', 'message', 'user', 'rating'));
ALTER TABLE trust.evidence_hold DROP CONSTRAINT IF EXISTS evidence_hold_target_type_check;
ALTER TABLE trust.evidence_hold ADD CONSTRAINT evidence_hold_target_type_check
  CHECK (target_type IN ('listing', 'message', 'user', 'rating'));
-- Ausdrücklich veröffentlicht, z. B. wenn die bewertende Person ihr Konto gelöscht hat: Der Schutz vor Racheabwertung
-- („verdeckt, bis beide bewertet haben“) entfällt, weil es keine Gegenseite mehr gibt (B-71)
ALTER TABLE trust.rating ADD COLUMN published_at timestamptz;
-- Löschlauf: Bewertungen nach 24 Monaten (REQ-PRIV-003)
CREATE INDEX rating_created_idx ON trust.rating (created_at);
