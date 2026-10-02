-- Partitur i Biblioteket. Dokumentet är Partiturfilen (.itab, ADR 0002) i aktuell schemaVersion.
-- Titel och artist är avnormaliserade ur dokumentet för listan.
CREATE TABLE scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  document jsonb NOT NULL,
  schema_version integer NOT NULL,
  -- Ökar med ett för varje sparning. Sparningen kräver den revision klienten senast kände till.
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scores_updated_at ON scores (updated_at DESC);
