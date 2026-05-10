-- Migration 003: Create circonscriptions (electoral districts) table
-- Date: 2026-05-09
-- Description: Electoral districts/ridings with elected representatives

CREATE TABLE circonscriptions (
  id SERIAL PRIMARY KEY,
  code_postal VARCHAR(10),
  région VARCHAR(255),
  nom VARCHAR(255) NOT NULL,
  niveau VARCHAR(50) NOT NULL, -- 'fédéral', 'provincial', 'municipal'
  elus_ids BIGINT[] DEFAULT '{}', -- Array of ELU IDs
  population INTEGER,
  geom GEOMETRY(POINT, 4326), -- Geographic center point
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX idx_circonscriptions_code_postal ON circonscriptions(code_postal);
CREATE INDEX idx_circonscriptions_région ON circonscriptions(région);
CREATE INDEX idx_circonscriptions_nom ON circonscriptions USING GIN(to_tsvector('french', nom));
CREATE INDEX idx_circonscriptions_niveau ON circonscriptions(niveau);
CREATE INDEX idx_circonscriptions_elus_ids ON circonscriptions USING GIN(elus_ids);
CREATE INDEX idx_circonscriptions_created_at ON circonscriptions(created_at);
CREATE INDEX idx_circonscriptions_geom ON circonscriptions USING GIST(geom);

-- Constraint: niveau must be valid
ALTER TABLE circonscriptions
ADD CONSTRAINT chk_niveau_valid
CHECK (niveau IN ('fédéral', 'provincial', 'municipal'));

-- Constraint: code_postal OR région must be present
ALTER TABLE circonscriptions
ADD CONSTRAINT chk_postal_or_region
CHECK (code_postal IS NOT NULL OR région IS NOT NULL);

-- Table: circonscriptions_history (for audit trail)
CREATE TABLE circonscriptions_history (
  id BIGSERIAL PRIMARY KEY,
  circonscription_id INTEGER REFERENCES circonscriptions(id) ON DELETE CASCADE,
  old_elus_ids BIGINT[],
  new_elus_ids BIGINT[],
  changed_by VARCHAR(100),
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_circonscriptions_history_circonscription_id ON circonscriptions_history(circonscription_id);
CREATE INDEX idx_circonscriptions_history_created_at ON circonscriptions_history(created_at);

-- Table: code_postal_to_circonscription (for postal code lookup)
CREATE TABLE code_postal_to_circonscription (
  id SERIAL PRIMARY KEY,
  code_postal VARCHAR(10) NOT NULL UNIQUE,
  circonscription_id INTEGER NOT NULL REFERENCES circonscriptions(id) ON DELETE CASCADE,
  niveau VARCHAR(50) NOT NULL, -- 'fédéral', 'provincial', 'municipal'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_code_postal ON code_postal_to_circonscription(code_postal);
CREATE INDEX idx_code_postal_circonscription ON code_postal_to_circonscription(circonscription_id);
