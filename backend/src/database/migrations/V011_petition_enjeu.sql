-- ============================================================
-- Migration V011 — Référentiel enjeux sur pétitions
-- Date    : 2026-05-22
-- Auteur  : Opérateur (Lot 2 Phase G.1)
--
-- Objet :
--   Ajout d'une colonne `enjeu` (VARCHAR + CHECK constraint)
--   sur la table `petitions` pour permettre la catégorisation
--   des pétitions selon 8 thématiques civiques.
--
-- Valeurs autorisées :
--   taxes | logement | sante | elections | droits |
--   environnement | energie | autre
--
-- Comportement :
--   - Nullable (rétro-compatible avec les pétitions existantes)
--   - Default NULL
--   - CHECK pour intégrité référentielle au niveau BD
--   - Index pour accélérer les filtres GET /petitions?enjeu=...
--
-- Idempotente : utilise IF NOT EXISTS / DO blocks.
-- ============================================================

-- 1. Ajouter la colonne (idempotent)
ALTER TABLE petitions
  ADD COLUMN IF NOT EXISTS enjeu VARCHAR(20);

-- 2. Ajouter la contrainte CHECK (sans erreur si déjà présente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'petitions_enjeu_check'
  ) THEN
    ALTER TABLE petitions
      ADD CONSTRAINT petitions_enjeu_check
      CHECK (enjeu IN (
        'taxes',
        'logement',
        'sante',
        'elections',
        'droits',
        'environnement',
        'energie',
        'autre'
      ));
  END IF;
END$$;

-- 3. Index pour les requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_petitions_enjeu
  ON petitions (enjeu)
  WHERE enjeu IS NOT NULL;

-- 4. Commentaire de documentation
COMMENT ON COLUMN petitions.enjeu IS
  'Catégorie civique de la pétition (V011). Valeurs : taxes, logement, sante, elections, droits, environnement, energie, autre. NULL = non catégorisée.';
