/**
 * Script migration V014 — Table actions
 * Phase G.2 - Lot 3
 *
 * Usage local : node backend/scripts/migrate-v014-actions.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../src/db/sequelize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../src/database/migrations/V014_actions.sql'
);

async function runMigration() {
  console.log('[V014] Lecture du fichier SQL...');
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

  console.log('[V014] Exécution de la migration...');
  await sequelize.query(sql);

  console.log('[V014] Vérification table actions...');
  const [tables] = await sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name = 'actions';
  `);

  if (tables.length === 0) {
    throw new Error('[V014] ERREUR : table actions absente.');
  }

  const [columns] = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'actions'
    ORDER BY ordinal_position;
  `);

  console.log(`[V014] Table actions : ${columns.length} colonnes`);
  columns.forEach((c) => console.log(`  - ${c.column_name}`));

  console.log('[V014] OK — Migration V014 appliquée avec succès.');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[V014] ÉCHEC :', err.message);
    process.exit(1);
  });
