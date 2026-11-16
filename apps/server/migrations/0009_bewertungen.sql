-- Bewertungen als Käufer und Verkäufer nach abgeschlossenem Deal (REQ-MOD-006 v2, B-70, Q-30)
CREATE TABLE trust.rating (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           uuid NOT NULL,
  rater_id          uuid,              -- NULL nach Löschung des Kontos der bewertenden Person (B-71)
  ratee_id          uuid NOT NULL,
  -- Rolle, in der die bewertete Person bewertet wird
  role              text NOT NULL CHECK (role IN ('seller', 'buyer')),
  score             text NOT NULL CHECK (score IN ('positive', 'neutral', 'negative')),
  body              text CHECK (body IS NULL OR char_length(body) BETWEEN 1 AND 280),
  -- Kopie, weil abgegebene Anzeigen nach 30 Tagen gelöscht werden (REQ-MOD-006, Regel „Anzeigentitel“)
  listing_title     text NOT NULL,
  deal_completed_at timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  -- Nach der Veröffentlichung gelöscht: zählt nicht mehr, Neuabgabe ausgeschlossen
  deleted_at        timestamptz,
  -- Von der Moderation entfernt (B-71, REQ-MOD-001)
  removed_at        timestamptz,
  -- Je Deal und bewertender Person höchstens eine Bewertung
  UNIQUE (deal_id, rater_id)
);
CREATE INDEX rating_ratee_idx ON trust.rating (ratee_id, created_at DESC, id DESC);
CREATE INDEX rating_deal_idx ON trust.rating (deal_id);
