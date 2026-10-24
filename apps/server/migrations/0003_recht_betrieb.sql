-- Recht, Auftritt und Betrieb (EPIC-13, ADR-0015..0018, architektur.md §5.4)

-- ---------------------------------------------------------------- platform
-- Einstellungen für Wartungsmodus, Ankündigung und Zeitpunkt der letzten Sicherung (REQ-OPS-006, REQ-AVAIL-003)
CREATE TABLE platform.setting (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- ---------------------------------------------------------------- identity
-- Sprachwahl (ADR-0016); Mails gehen in dieser Sprache
ALTER TABLE identity."user" ADD COLUMN locale text NOT NULL DEFAULT 'de' CHECK (locale IN ('de', 'en'));

-- ---------------------------------------------------------------- messaging
-- Entfernte Nachrichten bleiben für Widerspruch (REQ-LEGAL-007) und Beweissicherung (REQ-LEGAL-008) erhalten,
-- sind aber nur für die Wiederherstellung lesbar; der Text wird nach Ablauf der Frist geleert.
ALTER TABLE messaging.message
  ADD COLUMN removed_at    timestamptz,
  ADD COLUMN original_body text,
  ADD COLUMN original_kind text CHECK (original_kind IN ('text', 'system'));

-- ---------------------------------------------------------------- trust
-- Begründung nach DSA Art. 17 und Kennzeichnung nach Art. 18. decision bleibt append-only:
-- notified_at wird beim Einfügen gesetzt, weil die Mitteilung in derselben Transaktion eingereiht wird.
ALTER TABLE trust.decision
  ADD COLUMN rule_ref                  text,
  ADD COLUMN criminal_suspicion        text NOT NULL DEFAULT 'none'
                                       CHECK (criminal_suspicion IN ('none', 'suspected', 'imminent_danger')),
  ADD COLUMN criminal_suspicion_reason text,
  ADD COLUMN automated_detection       boolean NOT NULL DEFAULT false,
  ADD COLUMN notified_at               timestamptz;

-- Widerspruch (DSA Art. 20, REQ-LEGAL-007): höchstens einer je Entscheidung und Person
CREATE TABLE trust.appeal (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id    uuid NOT NULL REFERENCES trust.decision(id) ON DELETE CASCADE,
  appellant_id   uuid,
  appellant_role text NOT NULL CHECK (appellant_role IN ('subject', 'reporter')),
  reason         text NOT NULL,
  status         text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'upheld', 'reversed')),
  reviewer_id    uuid,
  outcome_reason text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  decided_at     timestamptz
);
CREATE UNIQUE INDEX appeal_once_per_person ON trust.appeal (decision_id, appellant_id) WHERE appellant_id IS NOT NULL;
CREATE INDEX appeal_status_idx ON trust.appeal (status, created_at);

-- Einmal-Link für den Widerspruch gesperrter Konten (gehashtes Token, 6 Monate)
CREATE TABLE trust.appeal_token (
  token_hash  text PRIMARY KEY,
  decision_id uuid NOT NULL REFERENCES trust.decision(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz
);

-- Mitteilungen im Konto („Meine Mitteilungen“, REQ-LEGAL-006)
CREATE TABLE trust.notice (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL,
  kind           text NOT NULL CHECK (kind IN ('decision', 'appeal_result')),
  recipient_role text NOT NULL CHECK (recipient_role IN ('subject', 'reporter')),
  decision_id    uuid NOT NULL REFERENCES trust.decision(id) ON DELETE CASCADE,
  appeal_id      uuid REFERENCES trust.appeal(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  read_at        timestamptz
);
CREATE INDEX notice_user_idx ON trust.notice (user_id, created_at DESC);

-- Beweissicherung bei Straftatverdacht (REQ-LEGAL-008): höchstens 6 Monate, Freigabe durch Admin
CREATE TABLE trust.evidence_hold (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id     uuid NOT NULL REFERENCES trust.decision(id) ON DELETE CASCADE,
  target_type     text NOT NULL CHECK (target_type IN ('listing', 'message', 'user')),
  target_id       uuid NOT NULL,
  subject_user_id uuid,
  urgent          boolean NOT NULL DEFAULT false,
  held_until      timestamptz NOT NULL,
  released_at     timestamptz,
  released_by     uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX evidence_hold_active_idx ON trust.evidence_hold (target_type, target_id) WHERE released_at IS NULL;
