-- Kontaktfreigabe nach beidseitiger Zustimmung (REQ-CHAT-010, Fallstudie FS-C1).
-- Eine Zeile je Teilnehmer und Konversation; der Zustand gilt aus Sicht dieses Teilnehmers.
-- Die Adresse selbst wird hier nie gespeichert, sie bleibt im Modul identity.

CREATE TABLE messaging.contact_consent (
  conversation_id uuid NOT NULL REFERENCES messaging.conversation(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL,
  state           text NOT NULL CHECK (state IN ('granted', 'withdrawn', 'declined')),
  -- Anfragen, die gestellt wurden, solange das Gegenüber noch nicht zugestimmt hatte (höchstens 3)
  request_count   integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  granted_at      timestamptz,
  withdrawn_at    timestamptz,
  declined_at     timestamptz,
  changed_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
