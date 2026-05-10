-- Migration 005: Create elu_commitments table
-- Date: 2026-05-09
-- Description: Track commitments made by elected officials

CREATE TABLE elu_commitments (
  id SERIAL PRIMARY KEY,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,
  titre VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'engagée', -- 'engagée', 'en cours', 'complétée', 'abandonnée'
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX idx_elu_commitments_elu_id ON elu_commitments(elu_id);
CREATE INDEX idx_elu_commitments_status ON elu_commitments(status);
CREATE INDEX idx_elu_commitments_created_at ON elu_commitments(created_at);
CREATE INDEX idx_elu_commitments_deadline ON elu_commitments(deadline);
CREATE INDEX idx_elu_commitments_titre ON elu_commitments USING GIN(to_tsvector('french', titre));

-- Constraint: status must be valid
ALTER TABLE elu_commitments
ADD CONSTRAINT chk_commitment_status_valid
CHECK (status IN ('engagée', 'en cours', 'complétée', 'abandonnée'));

-- Constraint: completed_at must be after created_at
ALTER TABLE elu_commitments
ADD CONSTRAINT chk_commitment_completed_after_created
CHECK (completed_at IS NULL OR completed_at >= created_at);

-- Table: commitment_updates (progress tracking)
CREATE TABLE commitment_updates (
  id BIGSERIAL PRIMARY KEY,
  commitment_id INTEGER NOT NULL REFERENCES elu_commitments(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- who added the update (elu or admin)
  contenu TEXT NOT NULL,
  status_change VARCHAR(50), -- Optional: if this update changed the status
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commitment_updates_commitment_id ON commitment_updates(commitment_id);
CREATE INDEX idx_commitment_updates_author_id ON commitment_updates(author_id);
CREATE INDEX idx_commitment_updates_created_at ON commitment_updates(created_at);

-- Table: commitment_tracking (citizen subscriptions to track commitments)
CREATE TABLE commitment_tracking (
  id BIGSERIAL PRIMARY KEY,
  commitment_id INTEGER NOT NULL REFERENCES elu_commitments(id) ON DELETE CASCADE,
  citoyen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique: each citizen can track each commitment only once
CREATE UNIQUE INDEX idx_commitment_tracking_unique
ON commitment_tracking(commitment_id, citoyen_id);

CREATE INDEX idx_commitment_tracking_commitment_id ON commitment_tracking(commitment_id);
CREATE INDEX idx_commitment_tracking_citoyen_id ON commitment_tracking(citoyen_id);
