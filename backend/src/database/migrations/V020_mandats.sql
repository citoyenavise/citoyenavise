-- V020: Historique des mandats des élus
-- Phase G.2 - Lot 9 : préservation des mandats successifs (cycle de vie)
-- Date: 2026-05-22

-- 0. Garantir l'existence de schema_versions
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version_number INT NOT NULL UNIQUE,
  description VARCHAR(255),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Table mandats
CREATE TABLE IF NOT EXISTS mandats (
  id SERIAL PRIMARY KEY,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,

  -- Snapshot du rôle à l'époque du mandat
  titre VARCHAR(100) NOT NULL,
  poste VARCHAR(150),
  roles_secondaires TEXT,
  parti_politique VARCHAR(100),
  parti_couleur VARCHAR(20),

  -- Géographie / circonscription au moment du mandat
  circonscription_id INTEGER REFERENCES circonscriptions(id) ON DELETE SET NULL,
  niveau VARCHAR(50) NOT NULL,
  region VARCHAR(50),
  legislature VARCHAR(10),

  -- Temporalité
  date_debut DATE NOT NULL,
  date_fin DATE,
  cause_fin VARCHAR(50),

  -- Statut mandat
  est_actuel BOOLEAN DEFAULT FALSE,

  -- Traçabilité
  source VARCHAR(255),
  source_url TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT mandat_titre_not_empty CHECK (LENGTH(TRIM(titre)) > 0),
  CONSTRAINT mandat_niveau_check CHECK (niveau IN (
    'fédéral', 'provincial', 'municipal'
  )),
  CONSTRAINT mandat_cause_fin_check CHECK (
    cause_fin IS NULL OR cause_fin IN (
      'fin_mandat', 'demission', 'defaite_electorale',
      'deces', 'revocation', 'autre'
    )
  ),
  CONSTRAINT mandat_dates_coherentes CHECK (
    date_fin IS NULL OR date_fin >= date_debut
  )
);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_mandats_elu_id ON mandats(elu_id);
CREATE INDEX IF NOT EXISTS idx_mandats_niveau ON mandats(niveau);
CREATE INDEX IF NOT EXISTS idx_mandats_legislature ON mandats(legislature);
CREATE INDEX IF NOT EXISTS idx_mandats_parti ON mandats(parti_politique);
CREATE INDEX IF NOT EXISTS idx_mandats_actuel ON mandats(est_actuel) WHERE est_actuel = TRUE;
CREATE INDEX IF NOT EXISTS idx_mandats_date_debut ON mandats(date_debut DESC);
CREATE INDEX IF NOT EXISTS idx_mandats_elu_dates ON mandats(elu_id, date_debut DESC);
CREATE INDEX IF NOT EXISTS idx_mandats_circo ON mandats(circonscription_id);

-- 3. Index unique : 1 seul mandat actuel par élu
CREATE UNIQUE INDEX IF NOT EXISTS idx_mandats_elu_actuel_unique
  ON mandats(elu_id)
  WHERE est_actuel = TRUE;

-- 4. Tracking version
INSERT INTO schema_versions (version_number, description)
VALUES (20, 'Table mandats (Phase G.2 Lot 9) - historique cycle de vie élus')
ON CONFLICT (version_number) DO NOTHING;
