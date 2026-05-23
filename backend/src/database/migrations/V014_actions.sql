-- V014: Actions concrètes des élus
-- Phase G.2 - Lot 3 : projets déposés, lois votées, interventions, décisions
-- Date: 2026-05-22

-- 0. Garantir l'existence de schema_versions
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version_number INT NOT NULL UNIQUE,
  description VARCHAR(255),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Table actions
CREATE TABLE IF NOT EXISTS actions (
  id SERIAL PRIMARY KEY,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,
  promise_id INTEGER REFERENCES promises(id) ON DELETE SET NULL,

  -- Contenu
  type VARCHAR(50) NOT NULL,
  titre VARCHAR(255) NOT NULL,
  description TEXT,

  -- Temporalité
  date DATE NOT NULL,

  -- Traçabilité
  source VARCHAR(255),
  source_url TEXT,

  -- Statut interne (publication)
  is_published BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT action_titre_not_empty CHECK (LENGTH(TRIM(titre)) > 0),
  CONSTRAINT action_type_check CHECK (type IN (
    'loi', 'projet_loi', 'motion', 'vote',
    'decision', 'declaration', 'intervention',
    'communique', 'autre'
  ))
);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_actions_elu_id ON actions(elu_id);
CREATE INDEX IF NOT EXISTS idx_actions_promise_id ON actions(promise_id);
CREATE INDEX IF NOT EXISTS idx_actions_date ON actions(date DESC);
CREATE INDEX IF NOT EXISTS idx_actions_type ON actions(type);
CREATE INDEX IF NOT EXISTS idx_actions_elu_date ON actions(elu_id, date DESC);

-- 3. Tracking version
INSERT INTO schema_versions (version_number, description)
VALUES (14, 'Table actions (Phase G.2 Lot 3) - actions concrètes des élus')
ON CONFLICT (version_number) DO NOTHING;
