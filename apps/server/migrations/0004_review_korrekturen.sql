-- Korrekturen aus dem Review „Recht, Auftritt und Betrieb“ (docs/04-review, RV-R-*, RV-C-*)

-- ---------------------------------------------------------------- platform
-- IP- und E-Mail-Pseudonyme in Rate-Limit-Schlüsseln: zufälliger, täglich rotierter Schlüssel (ADR-0014, RV-R-02).
-- Der Vorgänger wird eine Stunde nach der Rotation gelöscht; es gibt keinen Standardschlüssel.
CREATE TABLE platform.ip_pepper (
  id         bigserial PRIMARY KEY,
  key        bytea NOT NULL,
  valid_from timestamptz NOT NULL DEFAULT now()
);
-- Alte Zähler unter dem früheren, öffentlich bekannten Salt sind wertlos
DELETE FROM platform.rate_limit;

-- ---------------------------------------------------------------- identity
-- Kenntnisnahme einer neuen Datenschutzerklärung (keine Einwilligung, REQ-LEGAL-002, RV-R-08)
ALTER TABLE identity."user" ADD COLUMN privacy_ack_version text;
-- Bestandskonten gelten für die aktuelle Fassung als informiert (sie haben ihr bei der Registrierung zugestimmt)
UPDATE identity."user" SET privacy_ack_version = '2026-10';

-- ---------------------------------------------------------------- listings
-- Status vor der Entfernung durch die Moderation, damit eine Stattgabe ihn wiederherstellt (RV-C-09)
ALTER TABLE listings.listing ADD COLUMN status_before_removal text;

-- ---------------------------------------------------------------- trust
-- Rechtsgrundlage bei „rechtswidriger Inhalt“ (DSA Art. 17 Abs. 3 lit. d, RV-R-03)
ALTER TABLE trust.decision ADD COLUMN legal_ground text;

-- Mitteilung „vorläufig ausgeblendet“ nach drei Meldungen (REQ-MOD-004, RV-R-04); ohne Entscheidung
ALTER TABLE trust.notice ALTER COLUMN decision_id DROP NOT NULL;
ALTER TABLE trust.notice ADD COLUMN case_id uuid REFERENCES trust.moderation_case(id) ON DELETE CASCADE;
ALTER TABLE trust.notice DROP CONSTRAINT IF EXISTS notice_kind_check;
ALTER TABLE trust.notice ADD CONSTRAINT notice_kind_check CHECK (kind IN ('decision', 'appeal_result', 'provisional_hide'));
ALTER TABLE trust.notice ADD CONSTRAINT notice_reference_check
  CHECK ((kind = 'provisional_hide' AND case_id IS NOT NULL) OR (kind <> 'provisional_hide' AND decision_id IS NOT NULL));

-- Beweissicherung nur für die gekennzeichneten Inhalte und ihren Kontext (RV-R-15, RV-C-05): pseudonymisierte Kopie,
-- unabhängig von Konto- oder Konversationslöschung; gelöscht mit Freigabe oder Fristablauf der Sicherung.
CREATE TABLE trust.evidence_copy (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hold_id    uuid NOT NULL REFERENCES trust.evidence_hold(id) ON DELETE CASCADE,
  content    jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX evidence_copy_hold_idx ON trust.evidence_copy (hold_id);
