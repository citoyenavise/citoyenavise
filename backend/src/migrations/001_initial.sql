-- Migration 001: Initial Schema
-- Date: 2026-05-09
-- Description: Complete initial schema for Citoyen Avisé platform
-- Tables: users, elus, petitions, signatures, actualites

-- ═══════════════════════════════════════════════════════════════════
-- 1. USERS TABLE — Authentification & Citoyens
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nom_complet VARCHAR(255),
  province VARCHAR(50),
  code_postal VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verified_at ON users(verified_at);

-- ═══════════════════════════════════════════════════════════════════
-- 2. ELUS TABLE — Élus Politiques
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE elus (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  titre VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL,
  niveau VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  photo_url VARCHAR(500),
  site_web VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_elus_region ON elus(region);
CREATE INDEX idx_elus_niveau ON elus(niveau);
CREATE INDEX idx_elus_titre ON elus(titre);

-- ═══════════════════════════════════════════════════════════════════
-- 3. PETITIONS TABLE — Pétitions Citoyennes
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE petitions (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  citoyen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  elu_id INTEGER REFERENCES elus(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft',
  signatures_count INTEGER DEFAULT 0,
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_petitions_citoyen_id ON petitions(citoyen_id);
CREATE INDEX idx_petitions_elu_id ON petitions(elu_id);
CREATE INDEX idx_petitions_status ON petitions(status);
CREATE INDEX idx_petitions_created_at ON petitions(created_at);

-- Constraint: status must be valid
ALTER TABLE petitions
ADD CONSTRAINT chk_petition_status_valid
CHECK (status IN ('draft', 'published', 'closed', 'won'));

-- ═══════════════════════════════════════════════════════════════════
-- 4. SIGNATURES TABLE — Petition Signatures (Idempotency)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE signatures (
  id BIGSERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  citoyen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(petition_id, citoyen_id)
);

CREATE INDEX idx_signatures_petition_id ON signatures(petition_id);
CREATE INDEX idx_signatures_citoyen_id ON signatures(citoyen_id);
CREATE UNIQUE INDEX idx_signatures_unique ON signatures(petition_id, citoyen_id);

-- ═══════════════════════════════════════════════════════════════════
-- 5. ACTUALITES TABLE — Posts/Actualités des Citoyens
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE actualites (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'draft',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_actualites_author_id ON actualites(author_id);
CREATE INDEX idx_actualites_status ON actualites(status);
CREATE INDEX idx_actualites_created_at ON actualites(created_at);

-- Constraint: status must be valid
ALTER TABLE actualites
ADD CONSTRAINT chk_actualite_status_valid
CHECK (status IN ('draft', 'published'));

-- ═══════════════════════════════════════════════════════════════════
-- 6. SUPPORTING TABLES
-- ═══════════════════════════════════════════════════════════════════

-- Email Verification Tokens
CREATE TABLE email_verifications (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  used_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);

-- Petition Comments
CREATE TABLE petition_comments (
  id BIGSERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_petition_comments_petition_id ON petition_comments(petition_id);
CREATE INDEX idx_petition_comments_author_id ON petition_comments(author_id);

-- Petition Updates/Progress
CREATE TABLE petition_updates (
  id BIGSERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_petition_updates_petition_id ON petition_updates(petition_id);
CREATE INDEX idx_petition_updates_author_id ON petition_updates(author_id);

-- Actualite Comments
CREATE TABLE actualite_comments (
  id BIGSERIAL PRIMARY KEY,
  actualite_id INTEGER NOT NULL REFERENCES actualites(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_actualite_comments_actualite_id ON actualite_comments(actualite_id);
CREATE INDEX idx_actualite_comments_author_id ON actualite_comments(author_id);

-- Actualite Likes
CREATE TABLE actualite_likes (
  id BIGSERIAL PRIMARY KEY,
  actualite_id INTEGER NOT NULL REFERENCES actualites(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(actualite_id, user_id)
);

CREATE INDEX idx_actualite_likes_actualite_id ON actualite_likes(actualite_id);
CREATE INDEX idx_actualite_likes_user_id ON actualite_likes(user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 7. TRIGGERS — Denormalized Counts
-- ═══════════════════════════════════════════════════════════════════

-- Update petition signatures_count when signature is added/removed
CREATE OR REPLACE FUNCTION update_petition_signature_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE petitions
  SET signatures_count = (SELECT COUNT(*) FROM signatures WHERE petition_id = COALESCE(NEW.petition_id, OLD.petition_id))
  WHERE id = COALESCE(NEW.petition_id, OLD.petition_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER petition_signature_count_trigger
AFTER INSERT OR DELETE ON signatures
FOR EACH ROW
EXECUTE FUNCTION update_petition_signature_count();

-- Update actualite likes_count when like is added/removed
CREATE OR REPLACE FUNCTION update_actualite_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE actualites
  SET likes_count = (SELECT COUNT(*) FROM actualite_likes WHERE actualite_id = COALESCE(NEW.actualite_id, OLD.actualite_id))
  WHERE id = COALESCE(NEW.actualite_id, OLD.actualite_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actualite_likes_count_trigger
AFTER INSERT OR DELETE ON actualite_likes
FOR EACH ROW
EXECUTE FUNCTION update_actualite_likes_count();

-- Update actualite comments_count when comment is added/removed
CREATE OR REPLACE FUNCTION update_actualite_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE actualites
  SET comments_count = (SELECT COUNT(*) FROM actualite_comments WHERE actualite_id = COALESCE(NEW.actualite_id, OLD.actualite_id))
  WHERE id = COALESCE(NEW.actualite_id, OLD.actualite_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actualite_comments_count_trigger
AFTER INSERT OR DELETE ON actualite_comments
FOR EACH ROW
EXECUTE FUNCTION update_actualite_comments_count();

-- ═══════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════
