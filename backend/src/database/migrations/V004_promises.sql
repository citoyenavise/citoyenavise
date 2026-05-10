-- V004: Promises/Engagements des Élus
-- Suivi des promesses électorales et engagements publics
-- Date: 2026-05-10

-- Create ENUM type for promise status
CREATE TYPE promise_status AS ENUM (
  'engagee',      -- Promesse engagée
  'en_cours',     -- En cours de réalisation
  'completee',    -- Complétée avec succès
  'abandonnee'    -- Abandonnée/Annulée
);

-- Create promises table
CREATE TABLE IF NOT EXISTS promises (
  id SERIAL PRIMARY KEY,

  -- Relationship
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,

  -- Content
  titre VARCHAR(255) NOT NULL,
  description TEXT,

  -- Status tracking
  status promise_status DEFAULT 'engagee',

  -- Timeline
  deadline DATE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT promise_title_not_empty CHECK (LENGTH(TRIM(titre)) > 0)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_promises_elu_id ON promises(elu_id);
CREATE INDEX IF NOT EXISTS idx_promises_status ON promises(status);
CREATE INDEX IF NOT EXISTS idx_promises_deadline ON promises(deadline);
CREATE INDEX IF NOT EXISTS idx_promises_created ON promises(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promises_elu_status ON promises(elu_id, status);

-- Track schema version
INSERT INTO schema_versions (version_number, description)
VALUES (4, 'Add promises (electoral commitments) table')
ON CONFLICT (version_number) DO NOTHING;
