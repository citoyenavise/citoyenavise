-- V017: Financement & liens d'intérêts
-- Phase G.2 - Lot 6 : donateurs, liens d'intérêts, conflits déclarés
-- Date: 2026-05-22

-- 0. Garantir l'existence de schema_versions
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version_number INT NOT NULL UNIQUE,
  description VARCHAR(255),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Table donateurs
CREATE TABLE IF NOT EXISTS donateurs (
  id SERIAL PRIMARY KEY,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,

  -- Identification du donateur
  nom VARCHAR(255) NOT NULL,
  type_donateur VARCHAR(50) NOT NULL,

  -- Montant et temporalité
  montant NUMERIC(12, 2),
  devise VARCHAR(3) DEFAULT 'CAD',
  date DATE NOT NULL,
  annee_fiscale INTEGER,

  -- Contexte
  type_don VARCHAR(50),
  campagne VARCHAR(150),

  -- Traçabilité
  source VARCHAR(255),
  source_url TEXT,

  is_published BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT donateur_nom_not_empty CHECK (LENGTH(TRIM(nom)) > 0),
  CONSTRAINT donateur_type_check CHECK (type_donateur IN (
    'particulier', 'entreprise', 'syndicat', 'organisme',
    'parti', 'comite', 'anonyme', 'autre'
  )),
  CONSTRAINT donateur_type_don_check CHECK (
    type_don IS NULL OR type_don IN (
      'monetaire', 'service', 'bien', 'pret', 'evenement', 'autre'
    )
  ),
  CONSTRAINT donateur_montant_positif CHECK (montant IS NULL OR montant >= 0)
);

-- 2. Table liens_interets
CREATE TABLE IF NOT EXISTS liens_interets (
  id SERIAL PRIMARY KEY,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,

  -- Classification
  type VARCHAR(50) NOT NULL,

  -- Entité liée
  entite VARCHAR(255) NOT NULL,
  role VARCHAR(150),
  secteur VARCHAR(100),

  -- Description
  description TEXT,

  -- Période
  date_debut DATE,
  date_fin DATE,
  actuel BOOLEAN DEFAULT TRUE,

  -- Déclaration officielle
  declare_officiellement BOOLEAN DEFAULT FALSE,
  date_declaration DATE,

  -- Traçabilité
  source VARCHAR(255),
  source_url TEXT,

  is_published BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT lien_interet_entite_not_empty CHECK (LENGTH(TRIM(entite)) > 0),
  CONSTRAINT lien_interet_type_check CHECK (type IN (
    'directorat', 'actionnariat', 'emploi', 'consultation',
    'lobby', 'beneficiaire', 'famille', 'association', 'autre'
  ))
);

-- 3. Indices donateurs
CREATE INDEX IF NOT EXISTS idx_donateurs_elu_id ON donateurs(elu_id);
CREATE INDEX IF NOT EXISTS idx_donateurs_type ON donateurs(type_donateur);
CREATE INDEX IF NOT EXISTS idx_donateurs_date ON donateurs(date DESC);
CREATE INDEX IF NOT EXISTS idx_donateurs_montant ON donateurs(montant DESC);
CREATE INDEX IF NOT EXISTS idx_donateurs_annee ON donateurs(annee_fiscale);
CREATE INDEX IF NOT EXISTS idx_donateurs_published ON donateurs(is_published) WHERE is_published = TRUE;

-- 4. Indices liens_interets
CREATE INDEX IF NOT EXISTS idx_liens_interets_elu_id ON liens_interets(elu_id);
CREATE INDEX IF NOT EXISTS idx_liens_interets_type ON liens_interets(type);
CREATE INDEX IF NOT EXISTS idx_liens_interets_actuel ON liens_interets(actuel);
CREATE INDEX IF NOT EXISTS idx_liens_interets_secteur ON liens_interets(secteur);
CREATE INDEX IF NOT EXISTS idx_liens_interets_declare ON liens_interets(declare_officiellement);

-- 5. Tracking version
INSERT INTO schema_versions (version_number, description)
VALUES (17, 'Tables donateurs + liens_interets (Phase G.2 Lot 6) - financement & influence')
ON CONFLICT (version_number) DO NOTHING;
