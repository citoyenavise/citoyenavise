-- V007: Civic Interactive Tutorials (TCI)
-- Module éducatif pour l'engagement civique pratique et guidé
-- Date: 2026-05-10

-- Tutorial status enum
CREATE TYPE tutorial_status AS ENUM (
  'locked',
  'available',
  'in_progress',
  'completed',
  'mastered'
);

-- Step status enum
CREATE TYPE step_status AS ENUM (
  'locked',
  'available',
  'in_progress',
  'completed'
);

-- CIVIC TUTORIALS (Parcours pédagogiques)
CREATE TABLE IF NOT EXISTS civic_tutorials (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title_fr VARCHAR(255) NOT NULL,
  description_fr TEXT,
  category VARCHAR(50) NOT NULL,
  difficulty_level VARCHAR(20) DEFAULT 'beginner',
  estimated_duration_minutes INTEGER,
  icon_url VARCHAR(255),
  order_index INTEGER,
  prerequisites JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_civic_tutorials_slug ON civic_tutorials(slug);
CREATE INDEX idx_civic_tutorials_category ON civic_tutorials(category);
CREATE INDEX idx_civic_tutorials_active ON civic_tutorials(is_active);

-- TUTORIAL STEPS (Étapes dans chaque parcours)
CREATE TABLE IF NOT EXISTS tutorial_steps (
  id SERIAL PRIMARY KEY,
  tutorial_id INTEGER NOT NULL REFERENCES civic_tutorials(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title_fr VARCHAR(255) NOT NULL,
  description_fr TEXT,
  content_type VARCHAR(50) NOT NULL,
  content_data JSONB,
  action_type VARCHAR(50),
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tutorial_id, step_number)
);

CREATE INDEX idx_tutorial_steps_tutorial ON tutorial_steps(tutorial_id);
CREATE INDEX idx_tutorial_steps_number ON tutorial_steps(step_number);

-- USER TUTORIAL PROGRESS (Suivi de progression)
CREATE TABLE IF NOT EXISTS user_tutorial_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutorial_id INTEGER NOT NULL REFERENCES civic_tutorials(id) ON DELETE CASCADE,
  status tutorial_status DEFAULT 'available',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  current_step_number INTEGER DEFAULT 0,
  attempts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tutorial_id)
);

CREATE INDEX idx_user_tutorial_user ON user_tutorial_progress(user_id);
CREATE INDEX idx_user_tutorial_status ON user_tutorial_progress(status);
CREATE INDEX idx_user_tutorial_user_status ON user_tutorial_progress(user_id, status);

-- USER STEP PROGRESS (Suivi des étapes)
CREATE TABLE IF NOT EXISTS user_step_progress (
  id SERIAL PRIMARY KEY,
  user_tutorial_progress_id INTEGER NOT NULL REFERENCES user_tutorial_progress(id) ON DELETE CASCADE,
  step_id INTEGER NOT NULL REFERENCES tutorial_steps(id) ON DELETE CASCADE,
  status step_status DEFAULT 'locked',
  user_response JSONB,
  is_correct BOOLEAN,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_tutorial_progress_id, step_id)
);

CREATE INDEX idx_user_step_progress_tutorial ON user_step_progress(user_tutorial_progress_id);
CREATE INDEX idx_user_step_progress_step ON user_step_progress(step_id);

-- CIVIC ACTIONS LOG (Actions civiques réelles effectuées)
CREATE TABLE IF NOT EXISTS civic_actions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutorial_id INTEGER REFERENCES civic_tutorials(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  action_data JSONB,
  target_official_id INTEGER REFERENCES elus(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  confirmation_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_civic_actions_user ON civic_actions(user_id);
CREATE INDEX idx_civic_actions_tutorial ON civic_actions(tutorial_id);
CREATE INDEX idx_civic_actions_type ON civic_actions(action_type);
CREATE INDEX idx_civic_actions_user_date ON civic_actions(user_id, created_at DESC);

-- TUTORIAL RESOURCES (Ressources officielles liées)
CREATE TABLE IF NOT EXISTS tutorial_resources (
  id SERIAL PRIMARY KEY,
  tutorial_id INTEGER NOT NULL REFERENCES civic_tutorials(id) ON DELETE CASCADE,
  title_fr VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  source VARCHAR(100),
  is_official BOOLEAN DEFAULT true,
  verification_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tutorial_resources_tutorial ON tutorial_resources(tutorial_id);

-- TUTORIAL CONTENT EXAMPLES (Exemples pour les étapes)
CREATE TABLE IF NOT EXISTS tutorial_examples (
  id SERIAL PRIMARY KEY,
  step_id INTEGER NOT NULL REFERENCES tutorial_steps(id) ON DELETE CASCADE,
  title_fr VARCHAR(255),
  example_content TEXT,
  example_type VARCHAR(50),
  is_positive_example BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tutorial_examples_step ON tutorial_examples(step_id);

-- TUTORIAL STATS (Statistiques d'engagement)
CREATE TABLE IF NOT EXISTS tutorial_stats (
  id SERIAL PRIMARY KEY,
  tutorial_id INTEGER NOT NULL REFERENCES civic_tutorials(id) ON DELETE CASCADE,
  total_started INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_civic_actions INTEGER DEFAULT 0,
  avg_completion_time_minutes INTEGER,
  completion_rate_percent DECIMAL(5, 2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tutorial_id)
);

CREATE INDEX idx_tutorial_stats_completion_rate ON tutorial_stats(completion_rate_percent DESC);
