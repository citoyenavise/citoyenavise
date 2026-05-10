-- Migration 010_i18n.sql
-- Create translation tables for multilingual support
-- Date: 2026-05-10

CREATE TABLE translations (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  fr TEXT NOT NULL,
  en TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE petition_translations (
  id SERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  language VARCHAR(2) NOT NULL,
  titre VARCHAR(255),
  description TEXT,
  UNIQUE(petition_id, language)
);

CREATE TABLE actualite_translations (
  id SERIAL PRIMARY KEY,
  actualite_id INTEGER NOT NULL REFERENCES actualites(id) ON DELETE CASCADE,
  language VARCHAR(2) NOT NULL,
  titre VARCHAR(255),
  contenu TEXT,
  UNIQUE(actualite_id, language)
);

CREATE TABLE promise_translations (
  id SERIAL PRIMARY KEY,
  promise_id INTEGER NOT NULL REFERENCES promises(id) ON DELETE CASCADE,
  language VARCHAR(2) NOT NULL,
  titre VARCHAR(255),
  description TEXT,
  UNIQUE(promise_id, language)
);

CREATE TABLE comment_translations (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  language VARCHAR(2) NOT NULL,
  contenu TEXT,
  UNIQUE(comment_id, language)
);

CREATE INDEX idx_petition_translations_language ON petition_translations(language);
CREATE INDEX idx_actualite_translations_language ON actualite_translations(language);
CREATE INDEX idx_promise_translations_language ON promise_translations(language);
CREATE INDEX idx_comment_translations_language ON comment_translations(language);
