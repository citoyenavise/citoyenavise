-- V013: Extension Promise - Sources et date d'origine
-- Phase G.2 - Lot 2 : ajout colonnes source, source_url, date_promesse
-- Date: 2026-05-22

-- 0. Garantir l'existence de schema_versions
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version_number INT NOT NULL UNIQUE,
  description VARCHAR(255),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Colonnes traçabilité source
ALTER TABLE promises
  ADD COLUMN IF NOT EXISTS source VARCHAR(255),
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS date_promesse DATE,
  ADD COLUMN IF NOT EXISTS contexte VARCHAR(100);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_promises_date_promesse ON promises(date_promesse);
CREATE INDEX IF NOT EXISTS idx_promises_contexte ON promises(contexte);

-- 3. Tracking version
INSERT INTO schema_versions (version_number, description)
VALUES (13, 'Extension Promise - source, source_url, date_promesse, contexte (Phase G.2 Lot 2)')
ON CONFLICT (version_number) DO NOTHING;
