-- Migration 002: Create elus (elected officials) table
-- Date: 2026-05-09
-- Description: Create table for political representatives at all levels

CREATE TABLE elus (
  id SERIAL PRIMARY KEY,
  nom_complet VARCHAR(255) NOT NULL,
  titre VARCHAR(100) NOT NULL, -- 'Député', 'Sénateur', 'Maire', 'Conseiller', etc.
  région VARCHAR(255) NOT NULL, -- e.g., 'Montréal', 'Québec', 'Ottawa-Centre'
  niveau VARCHAR(50) NOT NULL, -- 'fédéral', 'provincial', 'municipal'
  email VARCHAR(255),
  photo_url TEXT,
  site_web VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Additional useful fields
  date_debut_mandat DATE,
  date_fin_mandat DATE,
  party VARCHAR(100), -- Parti politique (optionnel)
  phone VARCHAR(20),
  biography TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX idx_elus_email ON elus(email);
CREATE INDEX idx_elus_région ON elus(région);
CREATE INDEX idx_elus_niveau ON elus(niveau);
CREATE INDEX idx_elus_titre ON elus(titre);
CREATE INDEX idx_elus_nom_complet ON elus USING GIN(to_tsvector('french', nom_complet));
CREATE INDEX idx_elus_is_active ON elus(is_active);
CREATE INDEX idx_elus_created_at ON elus(created_at);

-- Constraint: niveau doit être valide
ALTER TABLE elus
ADD CONSTRAINT chk_niveau_valid
CHECK (niveau IN ('fédéral', 'provincial', 'municipal'));

-- Constraint: titre doit être valide
ALTER TABLE elus
ADD CONSTRAINT chk_titre_valid
CHECK (titre IN ('Député', 'Sénateur', 'Maire', 'Conseiller', 'Ministre', 'Premier ministre', 'Gouverneur', 'Président'));

-- Table: elus_contacts (pour plusieurs contacts par élu)
CREATE TABLE elus_contacts (
  id SERIAL PRIMARY KEY,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,
  type VARCHAR(50), -- 'email', 'phone', 'website', 'social_media'
  label VARCHAR(100), -- e.g., 'email_bureau', 'phone_constituency'
  value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_elus_contacts_elu_id ON elus_contacts(elu_id);

-- Table: elus_social_media (pour réseaux sociaux)
CREATE TABLE elus_social_media (
  id SERIAL PRIMARY KEY,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'twitter', 'facebook', 'instagram', 'linkedin'
  username VARCHAR(255) NOT NULL,
  url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_elus_social_media_elu_id ON elus_social_media(elu_id);
CREATE INDEX idx_elus_social_media_platform ON elus_social_media(platform);
