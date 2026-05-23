-- V021: Journal de modifications (audit trail) des données élus
-- Phase G.2 - Lot 10 : traçabilité création / modification / suppression
-- Date: 2026-05-22

-- 0. Garantir l'existence de schema_versions
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version_number INT NOT NULL UNIQUE,
  description VARCHAR(255),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Table elu_changelog
CREATE TABLE IF NOT EXISTS elu_changelog (
  id SERIAL PRIMARY KEY,

  -- Référence élu (nullable car entité peut être supprimée définitivement)
  elu_id INTEGER REFERENCES elus(id) ON DELETE SET NULL,

  -- Identification de l'entité modifiée
  entite_type VARCHAR(50) NOT NULL,
  entite_id INTEGER,

  -- Type d'action
  action VARCHAR(20) NOT NULL,

  -- Détail du changement (null pour create/delete)
  champ VARCHAR(100),
  ancienne_valeur TEXT,
  nouvelle_valeur TEXT,

  -- Source du changement
  source VARCHAR(50) NOT NULL DEFAULT 'manuel',
  source_details JSONB,

  -- Auteur (null si système / sync automatique)
  modifie_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT changelog_entite_type_check CHECK (entite_type IN (
    'elu', 'promise', 'action', 'vote', 'controverse',
    'donateur', 'lien_interet', 'mandat', 'elu_comment'
  )),
  CONSTRAINT changelog_action_check CHECK (action IN (
    'create', 'update', 'delete'
  )),
  CONSTRAINT changelog_source_check CHECK (source IN (
    'manuel', 'sync_ourcommons', 'sync_openparl',
    'sync_sencanada', 'sync_pm_gc', 'sync_gg_ca', 'sync_scc',
    'csv_import', 'api_admin', 'systeme', 'autre'
  ))
);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_changelog_elu_id ON elu_changelog(elu_id);
CREATE INDEX IF NOT EXISTS idx_changelog_entite ON elu_changelog(entite_type, entite_id);
CREATE INDEX IF NOT EXISTS idx_changelog_action ON elu_changelog(action);
CREATE INDEX IF NOT EXISTS idx_changelog_source ON elu_changelog(source);
CREATE INDEX IF NOT EXISTS idx_changelog_modifie_par ON elu_changelog(modifie_par);
CREATE INDEX IF NOT EXISTS idx_changelog_modifie_le ON elu_changelog(modifie_le DESC);
CREATE INDEX IF NOT EXISTS idx_changelog_elu_date ON elu_changelog(elu_id, modifie_le DESC);

-- 3. Tracking version
INSERT INTO schema_versions (version_number, description)
VALUES (21, 'Table elu_changelog (Phase G.2 Lot 10) - audit trail modifications')
ON CONFLICT (version_number) DO NOTHING;
