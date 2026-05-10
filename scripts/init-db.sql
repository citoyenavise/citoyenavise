-- Database Initialization Script for Citoyen Avisé
-- This script runs once when PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  auth_token VARCHAR(500),
  auth_token_expires_at TIMESTAMP,
  refresh_token VARCHAR(500),
  refresh_token_expires_at TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create elus table
CREATE TABLE IF NOT EXISTS elus (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  titre VARCHAR(255),
  niveau VARCHAR(50) NOT NULL, -- federal, provincial, municipal
  region VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  website TEXT,
  avatar_url TEXT,
  bio TEXT,
  date_debut DATE,
  date_fin DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create circonscriptions table
CREATE TABLE IF NOT EXISTS circonscriptions (
  id SERIAL PRIMARY KEY,
  code_postal VARCHAR(10),
  nom VARCHAR(255) NOT NULL,
  region VARCHAR(255),
  province VARCHAR(255),
  population INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create petitions table
CREATE TABLE IF NOT EXISTS petitions (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  elu_id INTEGER REFERENCES elus(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, closed, won
  signature_goal INTEGER DEFAULT 200,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  closed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create signatures table
CREATE TABLE IF NOT EXISTS signatures (
  id SERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(petition_id, user_id)
);

-- Create petition_updates table
CREATE TABLE IF NOT EXISTS petition_updates (
  id SERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create elu_commitments table
CREATE TABLE IF NOT EXISTS elu_commitments (
  id SERIAL PRIMARY KEY,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,
  petition_id INTEGER REFERENCES petitions(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, abandoned
  target_date DATE,
  completion_date DATE,
  tracker_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create elu_commitment_trackers table
CREATE TABLE IF NOT EXISTS elu_commitment_trackers (
  id SERIAL PRIMARY KEY,
  commitment_id INTEGER NOT NULL REFERENCES elu_commitments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(commitment_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_elus_niveau ON elus(niveau);
CREATE INDEX IF NOT EXISTS idx_elus_region ON elus(region);
CREATE INDEX IF NOT EXISTS idx_petitions_creator_id ON petitions(creator_id);
CREATE INDEX IF NOT EXISTS idx_petitions_elu_id ON petitions(elu_id);
CREATE INDEX IF NOT EXISTS idx_petitions_status ON petitions(status);
CREATE INDEX IF NOT EXISTS idx_signatures_petition_id ON signatures(petition_id);
CREATE INDEX IF NOT EXISTS idx_signatures_user_id ON signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_petition_id ON comments(petition_id);
CREATE INDEX IF NOT EXISTS idx_elu_commitments_elu_id ON elu_commitments(elu_id);
CREATE INDEX IF NOT EXISTS idx_elu_commitment_trackers_commitment_id ON elu_commitment_trackers(commitment_id);

-- Grant permissions
GRANT CONNECT ON DATABASE citoyenavise_staging TO staging_user;
GRANT USAGE ON SCHEMA public TO staging_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO staging_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO staging_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO staging_user;

-- Set updated_at trigger (optional enhancement)
-- This would require additional trigger functions to be created
-- For now, application code handles updated_at updates

COMMIT;
