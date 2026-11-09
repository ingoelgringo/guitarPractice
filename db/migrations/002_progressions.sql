-- Ackordföljder i Biblioteket. Dokumentet är Ackordföljden som versionerad JSON
-- (lib/progressionDraft.ts), ingen Partiturfil, och omfattas inte av ADR 0002.
-- Namnet hör till Biblioteket, inte till dokumentet: att byta namn ändrar inte revisionen.
CREATE TABLE progressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document jsonb NOT NULL,
  schema_version integer NOT NULL,
  -- Ökar med ett för varje sparning. Sparningen kräver den revision klienten senast kände till.
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX progressions_updated_at ON progressions (updated_at DESC);
