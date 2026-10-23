-- CampusMarkt MVP: Ausgangsschema.
-- Ein Postgres-Schema pro Modul (ADR-0001). Fremdschlüssel nur innerhalb eines Moduls;
-- Referenzen über Modulgrenzen hinweg (z. B. listing.owner_id) sind reine IDs und werden
-- über Domain Events bzw. das öffentliche Modul-API konsistent gehalten.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS listings;
CREATE SCHEMA IF NOT EXISTS search;
CREATE SCHEMA IF NOT EXISTS messaging;
CREATE SCHEMA IF NOT EXISTS trust;

-- ---------------------------------------------------------------- platform
CREATE TABLE platform.audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid,
  action      text NOT NULL,
  target_type text NOT NULL,
  target_id   text,
  details     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON platform.audit_log (created_at DESC);

-- Unveränderlichkeit (REQ-MOD-003): Einträge dürfen nicht geändert werden.
CREATE FUNCTION platform.forbid_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Tabelle %.% ist append-only', TG_TABLE_SCHEMA, TG_TABLE_NAME;
END $$;
CREATE TRIGGER audit_log_append_only BEFORE UPDATE ON platform.audit_log
  FOR EACH ROW EXECUTE FUNCTION platform.forbid_update();

CREATE TABLE platform.rate_limit (
  key          text NOT NULL,
  window_start timestamptz NOT NULL,
  count        integer NOT NULL,
  PRIMARY KEY (key, window_start)
);

-- ---------------------------------------------------------------- identity
CREATE TABLE identity.institution (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity.allowed_domain (
  domain         citext PRIMARY KEY,
  institution_id uuid NOT NULL REFERENCES identity.institution(id),
  user_type      text NOT NULL CHECK (user_type IN ('student', 'staff')),
  active         boolean NOT NULL DEFAULT true
);

CREATE TABLE identity."user" (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id         uuid NOT NULL REFERENCES identity.institution(id),
  email                  citext NOT NULL,
  -- Ohne +Suffix, für die Eindeutigkeit (BR-01 #6)
  email_canonical        citext NOT NULL UNIQUE,
  password_hash          text NOT NULL,
  display_name           text NOT NULL,
  user_type              text NOT NULL CHECK (user_type IN ('student', 'staff')),
  role                   text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  status                 text NOT NULL DEFAULT 'unverified'
                         CHECK (status IN ('unverified', 'active', 'suspended', 'pending_deletion')),
  study_program          text,
  preferred_location_ids uuid[] NOT NULL DEFAULT '{}',
  notification_prefs     jsonb NOT NULL DEFAULT '{"newMessage": true, "listingExpiry": true}'::jsonb,
  verified_at            timestamptz,
  deletion_requested_at  timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity.session (
  token_hash   text PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES identity."user"(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX session_user_idx ON identity.session (user_id);

CREATE TABLE identity.token (
  token_hash text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES identity."user"(id) ON DELETE CASCADE,
  purpose    text NOT NULL CHECK (purpose IN ('verify', 'reset')),
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX token_user_idx ON identity.token (user_id, purpose);

CREATE TABLE identity.banned_email (
  email_canonical citext PRIMARY KEY,
  reason          text NOT NULL,
  banned_at       timestamptz NOT NULL DEFAULT now()
);

-- Versionierte Einwilligungen (REQ-PRIV-001)
CREATE TABLE identity.consent (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid NOT NULL REFERENCES identity."user"(id) ON DELETE CASCADE,
  kind     text NOT NULL,
  version  text NOT NULL,
  given_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- listings
CREATE TABLE listings.category (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 text NOT NULL UNIQUE,
  name                 text NOT NULL,
  sort                 integer NOT NULL DEFAULT 0,
  has_study_attributes boolean NOT NULL DEFAULT false
);

CREATE TABLE listings.campus_location (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL,
  name           text NOT NULL,
  sort           integer NOT NULL DEFAULT 0,
  UNIQUE (institution_id, name)
);

CREATE TABLE listings.listing (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          uuid NOT NULL,
  institution_id    uuid NOT NULL,
  kind              text NOT NULL CHECK (kind IN ('offer', 'wanted')),
  title             text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  description       text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 4000),
  category_id       uuid NOT NULL REFERENCES listings.category(id),
  price_type        text NOT NULL CHECK (price_type IN ('fixed', 'negotiable', 'free', 'swap')),
  price_cents       integer,
  currency          char(3) NOT NULL DEFAULT 'EUR',
  condition         text CHECK (condition IN ('new', 'like_new', 'good', 'acceptable', 'defective')),
  attributes        jsonb NOT NULL DEFAULT '{}'::jsonb,
  location_ids      uuid[] NOT NULL CHECK (cardinality(location_ids) >= 1),
  status            text NOT NULL CHECK (status IN
                    ('draft', 'in_review', 'active', 'paused', 'reserved', 'completed', 'expired', 'removed', 'deleted')),
  -- Vorläufig ausgeblendet (≥ 3 Meldungen, REQ-MOD-004) oder Anbieter gesperrt
  hidden            boolean NOT NULL DEFAULT false,
  owner_suspended   boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  status_changed_at timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz,
  reminder_sent_at  timestamptz,
  search_doc        tsvector GENERATED ALWAYS AS (
                      setweight(to_tsvector('german'::regconfig, coalesce(title, '')), 'A') ||
                      setweight(to_tsvector('german'::regconfig, coalesce(description, '')), 'B')
                    ) STORED,
  -- REQ-LST-002: 0 < Preis ≤ 10.000 € bei Festpreis/VB, sonst kein Preis
  CONSTRAINT listing_price_check CHECK (
    (price_type IN ('fixed', 'negotiable') AND price_cents BETWEEN 1 AND 1000000)
    OR (price_type IN ('free', 'swap') AND price_cents IS NULL)
  )
);
CREATE INDEX listing_search_idx ON listings.listing USING gin (search_doc);
CREATE INDEX listing_title_trgm_idx ON listings.listing USING gin (title gin_trgm_ops);
CREATE INDEX listing_status_created_idx ON listings.listing (status, created_at DESC);
CREATE INDEX listing_owner_idx ON listings.listing (owner_id);

CREATE TABLE listings.image (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL,
  listing_id   uuid REFERENCES listings.listing(id) ON DELETE CASCADE,
  position     integer NOT NULL DEFAULT 0,
  status       text NOT NULL CHECK (status IN ('uploaded', 'processing', 'ready', 'failed')),
  original_key text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX image_listing_idx ON listings.image (listing_id, position);

-- ---------------------------------------------------------------- search
CREATE TABLE search.favorite (
  user_id    uuid NOT NULL,
  listing_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);
CREATE INDEX favorite_listing_idx ON search.favorite (listing_id);

-- ---------------------------------------------------------------- messaging
CREATE TABLE messaging.conversation (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL,
  buyer_id        uuid NOT NULL,
  seller_id       uuid NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  -- REQ-CHAT-002: genau eine Konversation pro (Anzeige, Interessent)
  UNIQUE (listing_id, buyer_id),
  CHECK (buyer_id <> seller_id)
);
CREATE INDEX conversation_buyer_idx ON messaging.conversation (buyer_id, last_message_at DESC);
CREATE INDEX conversation_seller_idx ON messaging.conversation (seller_id, last_message_at DESC);

CREATE TABLE messaging.message (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES messaging.conversation(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL,
  client_msg_id   uuid NOT NULL,
  kind            text NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'system')),
  body            text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
  read_at         timestamptz,
  -- REQ-CHAT-004: Idempotenz
  UNIQUE (conversation_id, client_msg_id)
);
CREATE INDEX message_conversation_idx ON messaging.message (conversation_id, created_at, id);

-- Deal: Vorleistung für die spätere Bezahlung (ADR-0006). Beträge immer in Cent + Währung.
CREATE TABLE messaging.deal (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id    uuid NOT NULL REFERENCES messaging.conversation(id) ON DELETE CASCADE,
  listing_id         uuid NOT NULL,
  seller_id          uuid NOT NULL,
  buyer_id           uuid NOT NULL,
  agreed_price_cents integer CHECK (agreed_price_cents >= 0),
  currency           char(3) NOT NULL DEFAULT 'EUR',
  status             text NOT NULL CHECK (status IN ('agreed', 'completed', 'cancelled')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX deal_one_open_per_listing ON messaging.deal (listing_id) WHERE status = 'agreed';

CREATE TABLE messaging.notification_state (
  conversation_id  uuid NOT NULL REFERENCES messaging.conversation(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL,
  last_notified_at timestamptz NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

-- ---------------------------------------------------------------- trust
CREATE TABLE trust.moderation_case (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type     text NOT NULL CHECK (target_type IN ('listing', 'message', 'user')),
  target_id       uuid NOT NULL,
  subject_user_id uuid,
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'decided')),
  hidden          boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  decided_at      timestamptz
);
CREATE UNIQUE INDEX moderation_case_one_open ON trust.moderation_case (target_type, target_id) WHERE status = 'open';

CREATE TABLE trust.report (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     uuid NOT NULL REFERENCES trust.moderation_case(id) ON DELETE CASCADE,
  reporter_id uuid,
  reason      text NOT NULL,
  details     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX report_once_per_reporter ON trust.report (case_id, reporter_id) WHERE reporter_id IS NOT NULL;

-- REQ-MOD-003: unveränderlich protokolliert
CREATE TABLE trust.decision (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      uuid NOT NULL REFERENCES trust.moderation_case(id) ON DELETE CASCADE,
  moderator_id uuid NOT NULL,
  decision     text NOT NULL CHECK (decision IN ('no_action', 'remove', 'warn', 'ban')),
  reason       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER decision_append_only BEFORE UPDATE ON trust.decision
  FOR EACH ROW EXECUTE FUNCTION platform.forbid_update();

CREATE TABLE trust.block (
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE INDEX block_blocked_idx ON trust.block (blocked_id);
