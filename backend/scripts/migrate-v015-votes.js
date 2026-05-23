/**
 * Script migration V015 — Table votes
 * Phase G.2 - Lot 4
 *
 * Usage local : node backend/scripts/migrate-v015-votes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../src/db/sequelize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../src/database/migrations/V015_votes.sql'
);

async function runMigration() {
  console.log('[V015] Lecture du fichier SQL...');
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

  console.log('[V015] Exécution de la migration...');
  await sequelize.query(sql);

  console.log('[V015] Vérification table votes...');
  const [tables] = await sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name = 'votes';
  `);

  if (tables.length === 0) {
    throw new Error('[V015] ERREUR : table votes absente.');
  }

  const [columns] = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'votes'
    ORDER BY ordinal_position;
  `);

  console.log(`[V015] Table votes : ${columns.length} colonnes`);
  columns.forEach((c) => console.log(`  - ${c.column_name}`));

  console.log('[V015] OK — Migration V015 appliquée avec succès.');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[V015] ÉCHEC :', err.message);
    process.exit(1);
  });
