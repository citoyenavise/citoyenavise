-- V019: Abonnements citoyens aux élus (bouton "Suivre")
-- Phase G.2 - Lot 8 : Header fiche élu, action "Suivre"
-- Date: 2026-05-22

-- 0. Garantir l'existence de schema_versions
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version_number INT NOT NULL UNIQUE,
  description VARCHAR(255),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Table elu_follows
CREATE TABLE IF NOT EXISTS elu_follows (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,

  -- Préférences notifications (par type d'événement)
  notif_promesse BOOLEAN DEFAULT TRUE,
  notif_action BOOLEAN DEFAULT TRUE,
  notif_vote BOOLEAN DEFAULT FALSE,
  notif_controverse BOOLEAN DEFAULT TRUE,
  notif_fin_mandat BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, elu_id)
);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_elu_follows_user ON elu_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_elu_follows_elu ON elu_follows(elu_id);
CREATE INDEX IF NOT EXISTS idx_elu_follows_created ON elu_follows(created_at DESC);

-- 3. Tracking version
INSERT INTO schema_versions (version_number, description)
VALUES (19, 'Table elu_follows (Phase G.2 Lot 8) - abonnements citoyens aux élus')
ON CONFLICT (version_number) DO NOTHING;
