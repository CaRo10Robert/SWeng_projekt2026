-- Korrekturen aus den Nachweisen (docs/05-umsetzung/nachweise: MAN-ARCH-004 S-1…S-8, MAN-OPS-011, MAN-UX-002)

-- ---------------------------------------------------------------- Indizes (MAN-ARCH-004 S-1, S-2, S-3, S-5, S-6)
-- Konversationsliste lädt Deals je Konversation (dealsFor)
CREATE INDEX deal_conversation_idx ON messaging.deal (conversation_id, created_at DESC);
-- DAC7-Auswertung: abgeschlossene Deals je Kalenderjahr
CREATE INDEX deal_completed_idx ON messaging.deal (updated_at) WHERE status = 'completed';
-- LATEST_TERMS läuft bei jeder Sitzungsprüfung
CREATE INDEX consent_user_idx ON identity.consent (user_id, kind, given_at DESC);
CREATE INDEX decision_case_idx ON trust.decision (case_id);
CREATE INDEX moderation_case_status_idx ON trust.moderation_case (status, created_at);
-- Löschlauf der Zähler (purge nach window_start)
CREATE INDEX rate_limit_window_idx ON platform.rate_limit (window_start);
-- Löschlauf für Konversationen nach 12 Monaten
CREATE INDEX conversation_last_message_idx ON messaging.conversation (last_message_at);

-- ---------------------------------------------------------------- Zustimmungsnachweise ohne Profilbezug (S-4)
-- REQ-PRIV-003: Zustimmungen bleiben nach der Kontolöschung 3 Jahre als Nachweis erhalten, aber ohne Profilbezug.
-- Statt CASCADE wird die Verbindung zum Konto gelöst; subject_ref ist ein HMAC der kanonischen Adresse mit einem
-- festen Geheimnis, damit sich ein Nachweis im Streitfall einer Person zuordnen lässt, die ihre Adresse nennt.
ALTER TABLE identity.consent DROP CONSTRAINT consent_user_id_fkey;
ALTER TABLE identity.consent ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE identity.consent
  ADD CONSTRAINT consent_user_id_fkey FOREIGN KEY (user_id) REFERENCES identity."user"(id) ON DELETE SET NULL;
ALTER TABLE identity.consent ADD COLUMN subject_ref text;
ALTER TABLE identity.consent ADD COLUMN anonymized_at timestamptz;
ALTER TABLE identity.consent ADD CONSTRAINT consent_subject_check
  CHECK (user_id IS NOT NULL OR (subject_ref IS NOT NULL AND anonymized_at IS NOT NULL));

-- ---------------------------------------------------------------- Notfall: Passwortwechsel erzwingen (T-5)
ALTER TABLE identity."user" ADD COLUMN password_change_required boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------- Systemnachrichten als Code (MAN-UX-002 T-2)
-- Der Client übersetzt per Code; body bleibt als deutscher Klartext für Altdaten, Export und Moderation erhalten.
ALTER TABLE messaging.message ADD COLUMN system_code text;
ALTER TABLE messaging.message ADD COLUMN system_params jsonb;
