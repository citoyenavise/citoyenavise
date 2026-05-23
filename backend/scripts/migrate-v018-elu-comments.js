/**
 * Script migration V018 — Table elu_comments
 * Phase G.2 - Lot 7
 *
 * Usage local : node backend/scripts/migrate-v018-elu-comments.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../src/db/sequelize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../src/database/migrations/V018_elu_comments.sql'
);

async function runMigration() {
  console.log('[V018] Lecture du fichier SQL...');
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

  console.log('[V018] Exécution de la migration...');
  await sequelize.query(sql);

  console.log('[V018] Vérification table elu_comments...');
  const [tables] = await sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name = 'elu_comments';
  `);

  if (tables.length === 0) {
    throw new Error('[V018] ERREUR : table elu_comments absente.');
  }

  const [columns] = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'elu_comments'
    ORDER BY ordinal_position;
  `);

  console.log(`[V018] Table elu_comments : ${columns.length} colonnes`);
  columns.forEach((c) => console.log(`  - ${c.column_name}`));

  console.log('[V018] OK — Migration V018 appliquée avec succès.');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[V018] ÉCHEC :', err.message);
    process.exit(1);
  });
