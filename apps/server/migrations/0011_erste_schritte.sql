-- Erste Schritte für neue Mitglieder (REQ-UX-011, B-75, Q-31)
-- Zustand im Konto statt im Browser-Speicher (REQ-LEGAL-010); einmal erreichte Schritte bleiben erledigt.
ALTER TABLE identity."user"
  ADD COLUMN onboarding_dismissed_at timestamptz,
  ADD COLUMN onboarding_profile_at   timestamptz,
  ADD COLUMN onboarding_listing_at   timestamptz,
  ADD COLUMN onboarding_tips_at      timestamptz;
