-- Kaufangebot und Gegenangebot (REQ-CHAT-009 v4.0, B-73, Q-31)
-- Ein Angebot ist eine strukturierte Nachricht (kind = 'offer') mit eigenem Zustand.

-- Nachrichtenart 'offer' zulassen (Namen der CHECK-Bedingungen nach PostgreSQL-Konvention)
ALTER TABLE messaging.message DROP CONSTRAINT IF EXISTS message_kind_check;
ALTER TABLE messaging.message ADD CONSTRAINT message_kind_check CHECK (kind IN ('text', 'system', 'offer'));
ALTER TABLE messaging.message DROP CONSTRAINT IF EXISTS message_original_kind_check;
ALTER TABLE messaging.message ADD CONSTRAINT message_original_kind_check CHECK (original_kind IN ('text', 'system', 'offer'));

CREATE TABLE messaging.offer (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES messaging.conversation(id) ON DELETE CASCADE,
  listing_id      uuid NOT NULL,
  message_id      uuid NOT NULL REFERENCES messaging.message(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL,
  recipient_id    uuid NOT NULL,
  -- Beträge immer als Integer in Cent mit Währung (ADR-0006); 0 bei „zu verschenken“
  amount_cents    integer NOT NULL CHECK (amount_cents BETWEEN 0 AND 1000000),
  currency        char(3) NOT NULL DEFAULT 'EUR',
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'accepted', 'declined', 'countered', 'withdrawn', 'unavailable')),
  -- Gegenangebot verweist auf das beantwortete Angebot
  parent_id       uuid REFERENCES messaging.offer(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
  decided_at      timestamptz
);
-- Höchstens ein offenes Angebot je Konversation (REQ-CHAT-009, Regel „Offene Angebote“)
CREATE UNIQUE INDEX offer_one_open ON messaging.offer (conversation_id) WHERE status = 'open';
CREATE INDEX offer_listing_open_idx ON messaging.offer (listing_id) WHERE status = 'open';
CREATE UNIQUE INDEX offer_message_idx ON messaging.offer (message_id);
