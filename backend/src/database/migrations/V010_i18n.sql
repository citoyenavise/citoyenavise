/**
 * Migration V010 - i18n (Internationalization)
 * Création des tables de traductions pour support multilingue
 *
 * Tables :
 * - translations: Traductions globales (clé-valeur FR/EN)
 * - petition_translations: Traductions des pétitions
 * - actualite_translations: Traductions des actualités
 * - promise_translations: Traductions des promesses
 * - comment_translations: Traductions des commentaires
 *
 * Date: 2026-05-10
 */

-- Table globale des traductions (système)
CREATE TABLE IF NOT EXISTS translations (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  fr TEXT NOT NULL,
  en TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Traductions des pétitions
CREATE TABLE IF NOT EXISTS petition_translations (
  id SERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  language VARCHAR(2) NOT NULL,
  titre VARCHAR(255),
  description TEXT,
  UNIQUE(petition_id, language),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Traductions des actualités
CREATE TABLE IF NOT EXISTS actualite_translations (
  id SERIAL PRIMARY KEY,
  actualite_id INTEGER NOT NULL REFERENCES actualites(id) ON DELETE CASCADE,
  language VARCHAR(2) NOT NULL,
  titre VARCHAR(255),
  contenu TEXT,
  UNIQUE(actualite_id, language),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Traductions des promesses électorales
CREATE TABLE IF NOT EXISTS promise_translations (
  id SERIAL PRIMARY KEY,
  promise_id INTEGER NOT NULL REFERENCES promises(id) ON DELETE CASCADE,
  language VARCHAR(2) NOT NULL,
  titre VARCHAR(255),
  description TEXT,
  UNIQUE(promise_id, language),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Traductions des commentaires
CREATE TABLE IF NOT EXISTS comment_translations (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  language VARCHAR(2) NOT NULL,
  contenu TEXT,
  UNIQUE(comment_id, language),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes pour optimiser les recherches par langue
CREATE INDEX IF NOT EXISTS idx_petition_translations_language ON petition_translations(language);
CREATE INDEX IF NOT EXISTS idx_actualite_translations_language ON actualite_translations(language);
CREATE INDEX IF NOT EXISTS idx_promise_translations_language ON promise_translations(language);
CREATE INDEX IF NOT EXISTS idx_comment_translations_language ON comment_translations(language);

-- Indexes supplémentaires pour les recherches mixtes
CREATE INDEX IF NOT EXISTS idx_petition_translations_petition_id ON petition_translations(petition_id);
CREATE INDEX IF NOT EXISTS idx_actualite_translations_actualite_id ON actualite_translations(actualite_id);
CREATE INDEX IF NOT EXISTS idx_promise_translations_promise_id ON promise_translations(promise_id);
CREATE INDEX IF NOT EXISTS idx_comment_translations_comment_id ON comment_translations(comment_id);

-- Index sur la clé des traductions globales
CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key);
