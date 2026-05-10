-- Migration 004: Create petitions table
-- Date: 2026-05-09
-- Description: Citizens' petitions addressed to elected officials

CREATE TABLE petitions (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  citoyen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  elu_id INTEGER REFERENCES elus(id) ON DELETE SET NULL,
  signatures_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'closed', 'won'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deadline TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX idx_petitions_citoyen_id ON petitions(citoyen_id);
CREATE INDEX idx_petitions_elu_id ON petitions(elu_id);
CREATE INDEX idx_petitions_status ON petitions(status);
CREATE INDEX idx_petitions_created_at ON petitions(created_at);
CREATE INDEX idx_petitions_deadline ON petitions(deadline);
CREATE INDEX idx_petitions_titre ON petitions USING GIN(to_tsvector('french', titre));
CREATE INDEX idx_petitions_signatures_count ON petitions(signatures_count DESC);

-- Constraint: status must be valid
ALTER TABLE petitions
ADD CONSTRAINT chk_status_valid
CHECK (status IN ('draft', 'published', 'closed', 'won'));

-- Constraint: deadline must be in future if provided
ALTER TABLE petitions
ADD CONSTRAINT chk_deadline_future
CHECK (deadline IS NULL OR deadline > created_at);

-- Table: petition_signatures (who signed, when)
CREATE TABLE petition_signatures (
  id BIGSERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  citoyen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: each citizen can sign each petition only once
CREATE UNIQUE INDEX idx_petition_signatures_unique
ON petition_signatures(petition_id, citoyen_id);

CREATE INDEX idx_petition_signatures_petition_id ON petition_signatures(petition_id);
CREATE INDEX idx_petition_signatures_citoyen_id ON petition_signatures(citoyen_id);
CREATE INDEX idx_petition_signatures_signed_at ON petition_signatures(signed_at);

-- Table: petition_updates (creator posts updates)
CREATE TABLE petition_updates (
  id BIGSERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_petition_updates_petition_id ON petition_updates(petition_id);
CREATE INDEX idx_petition_updates_author_id ON petition_updates(author_id);
CREATE INDEX idx_petition_updates_created_at ON petition_updates(created_at);

-- Table: petition_comments (public discussion)
CREATE TABLE petition_comments (
  id BIGSERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id BIGINT REFERENCES petition_comments(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_petition_comments_petition_id ON petition_comments(petition_id);
CREATE INDEX idx_petition_comments_author_id ON petition_comments(author_id);
CREATE INDEX idx_petition_comments_parent_comment_id ON petition_comments(parent_comment_id);
CREATE INDEX idx_petition_comments_created_at ON petition_comments(created_at);

-- Function to update petition signatures count
CREATE OR REPLACE FUNCTION update_petition_signatures_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE petitions
  SET signatures_count = (SELECT COUNT(*) FROM petition_signatures WHERE petition_id = NEW.petition_id)
  WHERE id = NEW.petition_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update signatures count
CREATE TRIGGER trg_update_petition_signatures_count
AFTER INSERT OR DELETE ON petition_signatures
FOR EACH ROW
EXECUTE FUNCTION update_petition_signatures_count();
