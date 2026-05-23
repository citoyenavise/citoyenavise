-- V016: Controverses, enquêtes, sanctions, corrections
-- Phase G.2 - Lot 5 : bloc Transparence/Intégrité de la fiche élu
-- Date: 2026-05-22

-- 0. Garantir l'existence de schema_versions
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version_number INT NOT NULL UNIQUE,
  description VARCHAR(255),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Table controverses
CREATE TABLE IF NOT EXISTS controverses (
  id SERIAL PRIMARY KEY,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,

  -- Classification
  type VARCHAR(50) NOT NULL,
  gravite VARCHAR(20),

  -- Contenu factuel (neutre, sourcé)
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  position_officielle TEXT,

  -- Statut traitement
  statut VARCHAR(30) DEFAULT 'en_cours',
  date_debut DATE NOT NULL,
  date_fin DATE,

  -- Traçabilité
  source VARCHAR(255),
  source_url TEXT,
  sources_complementaires JSONB DEFAULT '[]'::jsonb,

  -- Modération
  is_published BOOLEAN DEFAULT FALSE,
  validated_by_admin BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT controverse_titre_not_empty CHECK (LENGTH(TRIM(titre)) > 0),
  CONSTRAINT controverse_type_check CHECK (type IN (
    'scandale', 'enquete', 'sanction', 'correction',
    'allegation', 'condamnation', 'rappel_ethique', 'autre'
  )),
  CONSTRAINT controverse_gravite_check CHECK (
    gravite IS NULL OR gravite IN ('mineure', 'moderee', 'majeure')
  ),
  CONSTRAINT controverse_statut_check CHECK (statut IN (
    'en_cours', 'cloturee', 'rejetee', 'confirmee', 'non_lieu'
  ))
);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_controverses_elu_id ON controverses(elu_id);
CREATE INDEX IF NOT EXISTS idx_controverses_type ON controverses(type);
CREATE INDEX IF NOT EXISTS idx_controverses_statut ON controverses(statut);
CREATE INDEX IF NOT EXISTS idx_controverses_gravite ON controverses(gravite);
CREATE INDEX IF NOT EXISTS idx_controverses_date_debut ON controverses(date_debut DESC);
CREATE INDEX IF NOT EXISTS idx_controverses_published ON controverses(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_controverses_elu_date ON controverses(elu_id, date_debut DESC);

-- 3. Tracking version
INSERT INTO schema_versions (version_number, description)
VALUES (16, 'Table controverses (Phase G.2 Lot 5) - transparence et intégrité')
ON CONFLICT (version_number) DO NOTHING;
