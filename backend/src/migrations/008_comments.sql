-- Migration 008: Comments Table
-- Date: 2026-05-10
-- Description: Table pour les commentaires sur les pétitions
-- Tables: petition_comments

-- ═══════════════════════════════════════════════════════════════════
-- PETITION COMMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE petition_comments (
  id BIGSERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  citoyen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index sur petition_id pour requêtes rapides
CREATE INDEX idx_petition_comments_petition_id ON petition_comments(petition_id);
CREATE INDEX idx_petition_comments_citoyen_id ON petition_comments(citoyen_id);
CREATE INDEX idx_petition_comments_created_at ON petition_comments(created_at);

-- ═══════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════
