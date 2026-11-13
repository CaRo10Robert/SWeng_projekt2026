-- Benachrichtigungen in der App mit gelesen/ungelesen (REQ-NOTI-008, B-74, Q-31)
-- Eigenes Schema des Moduls notifications: Module greifen nie auf Tabellen anderer Module zu (Architektur 5.2.3).
CREATE SCHEMA IF NOT EXISTS notifications;

CREATE TABLE notifications.notification (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  kind       text NOT NULL CHECK (kind IN (
               'listing_expiry', 'reservation_expired', 'moderation_notice', 'appeal_result',
               'offer_received', 'offer_countered', 'offer_accepted', 'offer_declined', 'offer_unavailable',
               'rating_possible',
               -- Grundregel Q-32: fremd ausgelöste Zustandsänderungen an Anzeige und Deal
               'listing_renewal_due', 'listing_auto_paused', 'listing_deleted',
               'deal_reserved', 'deal_cancelled', 'deal_completed')),
  -- Nur Verweise und Anzeigetexte (Titel, Betrag), nie Chatinhalte (REQ-NOTI-008, wie REQ-NOTI-002)
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at    timestamptz
);
-- Liste je Mitglied, neueste zuerst (Keyset, ADR-0009)
CREATE INDEX notification_user_idx ON notifications.notification (user_id, created_at DESC, id DESC);
-- Zähler ungelesener Einträge
CREATE INDEX notification_unread_idx ON notifications.notification (user_id) WHERE read_at IS NULL;
-- Löschlauf nach 90 Tagen (REQ-PRIV-003)
CREATE INDEX notification_created_idx ON notifications.notification (created_at);
