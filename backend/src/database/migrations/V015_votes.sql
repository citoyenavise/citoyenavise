-- V015: Historique des votes des élus
-- Phase G.2 - Lot 4 : votes parlementaires (pour/contre/absent/abstention)
-- Date: 2026-05-22

-- 0. Garantir l'existence de schema_versions
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version_number INT NOT NULL UNIQUE,
  description VARCHAR(255),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Table votes
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,

  -- Identification du vote
  loi_titre VARCHAR(500) NOT NULL,
  loi_reference VARCHAR(100),
  loi_description TEXT,
  enjeu VARCHAR(50),

  -- Position de l'élu
  position VARCHAR(20) NOT NULL,

  -- Métadonnées analytiques
  alignement_parti BOOLEAN,
  est_vote_cle BOOLEAN DEFAULT FALSE,
  legislature VARCHAR(10),
  session VARCHAR(20),

  -- Temporalité
  date DATE NOT NULL,

  -- Traçabilité
  source VARCHAR(255),
  source_url TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT vote_loi_titre_not_empty CHECK (LENGTH(TRIM(loi_titre)) > 0),
  CONSTRAINT vote_position_check CHECK (position IN (
    'pour', 'contre', 'abstention', 'absent', 'paire'
  ))
);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_votes_elu_id ON votes(elu_id);
CREATE INDEX IF NOT EXISTS idx_votes_position ON votes(position);
CREATE INDEX IF NOT EXISTS idx_votes_date ON votes(date DESC);
CREATE INDEX IF NOT EXISTS idx_votes_enjeu ON votes(enjeu);
CREATE INDEX IF NOT EXISTS idx_votes_alignement ON votes(alignement_parti);
CREATE INDEX IF NOT EXISTS idx_votes_vote_cle ON votes(est_vote_cle) WHERE est_vote_cle = TRUE;
CREATE INDEX IF NOT EXISTS idx_votes_elu_date ON votes(elu_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_votes_legislature ON votes(legislature);

-- 3. Tracking version
INSERT INTO schema_versions (version_number, description)
VALUES (15, 'Table votes (Phase G.2 Lot 4) - historique des votes parlementaires')
ON CONFLICT (version_number) DO NOTHING;
