-- V012: Extension Elu - Fiche descriptive complète
-- Phase G.2 - Lot 1 : ajout colonnes identité, mandat, contact, réseaux, statut cycle de vie
-- Date: 2026-05-22

-- 0. Garantir l'existence de schema_versions (cas BD construites par Sequelize sync)
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version_number INT NOT NULL UNIQUE,
  description VARCHAR(255),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Colonnes identité étendue
ALTER TABLE elus
  ADD COLUMN IF NOT EXISTS parti_politique VARCHAR(100),
  ADD COLUMN IF NOT EXISTS parti_couleur VARCHAR(20),
  ADD COLUMN IF NOT EXISTS poste VARCHAR(150),
  ADD COLUMN IF NOT EXISTS roles_secondaires TEXT,
  ADD COLUMN IF NOT EXISTS circonscription_id INTEGER REFERENCES circonscriptions(id) ON DELETE SET NULL;

-- 2. Colonnes mandat
ALTER TABLE elus
  ADD COLUMN IF NOT EXISTS mandat_debut DATE,
  ADD COLUMN IF NOT EXISTS mandat_fin DATE,
  ADD COLUMN IF NOT EXISTS legislature VARCHAR(10);

-- 3. Colonnes contact étendu
ALTER TABLE elus
  ADD COLUMN IF NOT EXISTS telephone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS adresse_bureau TEXT,
  ADD COLUMN IF NOT EXISTS reseaux_sociaux JSONB DEFAULT '{}'::jsonb;

-- 4. Colonnes cycle de vie
ALTER TABLE elus
  ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'actif',
  ADD COLUMN IF NOT EXISTS cause_fin VARCHAR(50),
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_derniere_maj TIMESTAMP;

-- 5. Contrainte CHECK sur statut
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'elus_statut_check'
  ) THEN
    ALTER TABLE elus
      ADD CONSTRAINT elus_statut_check
      CHECK (statut IN ('actif', 'sortant', 'ancien', 'candidat', 'decede'));
  END IF;
END$$;

-- 6. Contrainte CHECK sur cause_fin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'elus_cause_fin_check'
  ) THEN
    ALTER TABLE elus
      ADD CONSTRAINT elus_cause_fin_check
      CHECK (cause_fin IS NULL OR cause_fin IN (
        'fin_mandat', 'demission', 'defaite_electorale',
        'deces', 'revocation', 'autre'
      ));
  END IF;
END$$;

-- 7. Extension validation titre (application-level via Sequelize)
-- Titres autorisés étendus :
--   Député, Sénateur, Premier ministre, Ministre, Vice-PM,
--   Président Chambre, Président Sénat, Gouverneur général, Juge, Autre
-- NB : pas de contrainte CHECK SQL pour permettre évolution sans migration

-- 8. Indices performance
CREATE INDEX IF NOT EXISTS idx_elus_statut ON elus(statut);
CREATE INDEX IF NOT EXISTS idx_elus_niveau_statut ON elus(niveau, statut);
CREATE INDEX IF NOT EXISTS idx_elus_parti ON elus(parti_politique);
CREATE INDEX IF NOT EXISTS idx_elus_circonscription ON elus(circonscription_id);
CREATE INDEX IF NOT EXISTS idx_elus_legislature ON elus(legislature);
CREATE INDEX IF NOT EXISTS idx_elus_mandat_debut ON elus(mandat_debut);

-- 9. Tracking version
INSERT INTO schema_versions (version_number, description)
VALUES (12, 'Extension Elu - Fiche descriptive complète (Phase G.2 Lot 1)')
ON CONFLICT (version_number) DO NOTHING;
