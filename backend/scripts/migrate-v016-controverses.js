/**
 * Script migration V016 — Table controverses
 * Phase G.2 - Lot 5
 *
 * Usage local : node backend/scripts/migrate-v016-controverses.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../src/db/sequelize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../src/database/migrations/V016_controverses.sql'
);

async function runMigration() {
  console.log('[V016] Lecture du fichier SQL...');
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

  console.log('[V016] Exécution de la migration...');
  await sequelize.query(sql);

  console.log('[V016] Vérification table controverses...');
  const [tables] = await sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name = 'controverses';
  `);

  if (tables.length === 0) {
    throw new Error('[V016] ERREUR : table controverses absente.');
  }

  const [columns] = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'controverses'
    ORDER BY ordinal_position;
  `);

  console.log(`[V016] Table controverses : ${columns.length} colonnes`);
  columns.forEach((c) => console.log(`  - ${c.column_name}`));

  console.log('[V016] OK — Migration V016 appliquée avec succès.');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[V016] ÉCHEC :', err.message);
    process.exit(1);
  });
