-- V018: Commentaires, questions, signalements sur élus
-- Phase G.2 - Lot 7 : interaction citoyenne directe avec la fiche élu
-- Date: 2026-05-22

-- 0. Garantir l'existence de schema_versions
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version_number INT NOT NULL UNIQUE,
  description VARCHAR(255),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Table elu_comments (polymorphe : commentaire | question | signalement)
CREATE TABLE IF NOT EXISTS elu_comments (
  id SERIAL PRIMARY KEY,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,
  citoyen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Type d'interaction
  type VARCHAR(20) NOT NULL DEFAULT 'commentaire',

  -- Contenu
  contenu TEXT NOT NULL,

  -- Modération / publication
  statut VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  motif_rejet TEXT,
  moderated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP,

  -- Réponse éventuelle d'un admin/équipe
  reponse TEXT,
  reponse_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reponse_at TIMESTAMP,

  -- Engagement
  likes_count INTEGER DEFAULT 0,
  signaled_count INTEGER DEFAULT 0,

  -- Thread léger (réponse à un commentaire)
  parent_id INTEGER REFERENCES elu_comments(id) ON DELETE CASCADE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT elu_comment_contenu_not_empty CHECK (LENGTH(TRIM(contenu)) > 0),
  CONSTRAINT elu_comment_contenu_max CHECK (LENGTH(contenu) <= 5000),
  CONSTRAINT elu_comment_type_check CHECK (type IN (
    'commentaire', 'question', 'signalement'
  )),
  CONSTRAINT elu_comment_statut_check CHECK (statut IN (
    'en_attente', 'publie', 'rejete', 'masque', 'supprime'
  ))
);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_elu_comments_elu_id ON elu_comments(elu_id);
CREATE INDEX IF NOT EXISTS idx_elu_comments_citoyen ON elu_comments(citoyen_id);
CREATE INDEX IF NOT EXISTS idx_elu_comments_type ON elu_comments(type);
CREATE INDEX IF NOT EXISTS idx_elu_comments_statut ON elu_comments(statut);
CREATE INDEX IF NOT EXISTS idx_elu_comments_parent ON elu_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_elu_comments_created ON elu_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_elu_comments_elu_statut
  ON elu_comments(elu_id, statut)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_elu_comments_published
  ON elu_comments(elu_id, statut, created_at DESC)
  WHERE statut = 'publie' AND deleted_at IS NULL;

-- 3. Tracking version
INSERT INTO schema_versions (version_number, description)
VALUES (18, 'Table elu_comments (Phase G.2 Lot 7) - commentaires/questions/signalements')
ON CONFLICT (version_number) DO NOTHING;
