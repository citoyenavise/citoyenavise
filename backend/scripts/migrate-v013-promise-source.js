/**
 * Script migration V013 — Extension Promise (source, date_promesse, contexte)
 * Phase G.2 - Lot 2
 *
 * Usage local : node backend/scripts/migrate-v013-promise-source.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../src/db/sequelize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../src/database/migrations/V013_promise_source.sql'
);

async function runMigration() {
  console.log('[V013] Lecture du fichier SQL...');
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

  console.log('[V013] Exécution de la migration...');
  await sequelize.query(sql);

  console.log('[V013] Vérification colonnes ajoutées...');
  const [columns] = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'promises'
      AND column_name IN ('source', 'source_url', 'date_promesse', 'contexte')
    ORDER BY column_name;
  `);

  const expected = 4;
  console.log(`[V013] ${columns.length}/${expected} colonnes présentes :`);
  columns.forEach((c) => console.log(`  - ${c.column_name}`));

  if (columns.length !== expected) {
    throw new Error(
      `[V013] ERREUR : ${columns.length}/${expected} colonnes seulement.`
    );
  }

  console.log('[V013] OK — Migration V013 appliquée avec succès.');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[V013] ÉCHEC :', err.message);
    process.exit(1);
  });
