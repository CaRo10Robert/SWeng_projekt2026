-- Erneuerung aktiver Anzeigen alle 14 Tage (REQ-LST-013, B-76, Q-32)
-- expires_at = Erneuerungsfrist der aktiven Phase, reminder_sent_at = Zeitpunkt des Hinweises „Erneuerung fällig“.
-- Ausgelaufen = pausiert: paused_reason unterscheidet die eigene Pause (bis 90 Tage) von der automatischen (Löschung nach 2 Tagen).
ALTER TABLE listings.listing ADD COLUMN paused_reason text CHECK (paused_reason IN ('owner', 'auto'));
UPDATE listings.listing SET paused_reason = 'owner' WHERE status = 'paused';

-- Bestandsanzeigen: aktive Anzeigen älter als 14 Tage erhalten sofort den Hinweis (volle 24 h Frist ab Hinweis);
-- abgelaufene werden beim nächsten Lebenszyklus-Lauf automatisch pausiert (mit Benachrichtigung).
UPDATE listings.listing
SET expires_at = LEAST(COALESCE(expires_at, now()), GREATEST(status_changed_at, created_at) + interval '14 days'),
    reminder_sent_at = NULL
WHERE status = 'active';

CREATE INDEX listing_lifecycle_idx ON listings.listing (status, expires_at) WHERE status IN ('active', 'paused', 'expired');
