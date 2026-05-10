-- V005: Gamification System Schema
-- User Actions, Missions, Badges, and Progression Tracking

-- ACTION TYPES ENUM
CREATE TYPE action_category AS ENUM (
  'discovery',
  'social',
  'creative',
  'public_data',
  'civic',
  'system'
);

-- MISSION TYPES ENUM
CREATE TYPE mission_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'special'
);

-- MISSION STATUS ENUM
CREATE TYPE mission_status AS ENUM (
  'active',
  'completed',
  'expired',
  'failed'
);

-- USER ACTIONS LOG
-- Tracks every action a user takes on the platform
CREATE TABLE IF NOT EXISTS user_actions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_key VARCHAR(100) NOT NULL,
  category action_category NOT NULL,
  xp_value INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX idx_user_actions_category ON user_actions(category);
CREATE INDEX idx_user_actions_action_key ON user_actions(action_key);
CREATE INDEX idx_user_actions_created_at ON user_actions(created_at);
CREATE INDEX idx_user_actions_user_created ON user_actions(user_id, created_at DESC);

-- MISSIONS
-- Daily, weekly, monthly, and special missions for engagement
CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  mission_key VARCHAR(100) NOT NULL UNIQUE,
  title_fr VARCHAR(255) NOT NULL,
  description_fr TEXT,
  category action_category NOT NULL,
  frequency mission_frequency NOT NULL,
  xp_reward INTEGER NOT NULL,
  completion_criteria JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_missions_frequency ON missions(frequency);
CREATE INDEX idx_missions_category ON missions(category);
CREATE INDEX idx_missions_active ON missions(is_active);

-- USER MISSION PROGRESS
-- Tracks which missions a user has accepted and their progress
CREATE TABLE IF NOT EXISTS user_mission_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id INTEGER NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  status mission_status DEFAULT 'active',
  progress_value INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  expired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, mission_id)
);

CREATE INDEX idx_user_mission_progress_user_id ON user_mission_progress(user_id);
CREATE INDEX idx_user_mission_progress_mission_id ON user_mission_progress(mission_id);
CREATE INDEX idx_user_mission_progress_status ON user_mission_progress(status);
CREATE INDEX idx_user_mission_progress_user_status ON user_mission_progress(user_id, status);

-- BADGES AND ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  badge_key VARCHAR(100) NOT NULL UNIQUE,
  name_fr VARCHAR(100) NOT NULL,
  description_fr TEXT,
  category VARCHAR(50) NOT NULL,
  icon_url VARCHAR(255),
  rarity VARCHAR(20) DEFAULT 'common',
  unlock_criteria JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_rarity ON badges(rarity);

-- USER BADGES
-- Tracks which badges a user has unlocked
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_unlocked_at ON user_badges(unlocked_at);

-- USER PROGRESSION STATS
-- Aggregated user statistics for gamification
CREATE TABLE IF NOT EXISTS user_progression (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_level_xp INTEGER DEFAULT 0,
  next_level_xp INTEGER DEFAULT 500,
  total_actions INTEGER DEFAULT 0,
  total_missions_completed INTEGER DEFAULT 0,
  total_badges_earned INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_action_at TIMESTAMP,
  last_mission_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_progression_level ON user_progression(level);
CREATE INDEX idx_user_progression_total_xp ON user_progression(total_xp);
CREATE INDEX idx_user_progression_current_streak ON user_progression(current_streak);

-- DOMAIN-SPECIFIC PROGRESSION
-- Track user progress in specific areas (discovery, civic engagement, etc.)
CREATE TABLE IF NOT EXISTS domain_progression (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(50) NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, domain)
);

CREATE INDEX idx_domain_progression_user_domain ON domain_progression(user_id, domain);
CREATE INDEX idx_domain_progression_domain_level ON domain_progression(domain, level);

-- ACTIVITY TRACKING FOR ANALYTICS
CREATE TABLE IF NOT EXISTS activity_metrics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  actions_count INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  scroll_depth_percent DECIMAL(5, 2),
  pages_visited INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, metric_date)
);

CREATE INDEX idx_activity_metrics_user_date ON activity_metrics(user_id, metric_date);
CREATE INDEX idx_activity_metrics_date ON activity_metrics(metric_date);
