/**
 * Script migration V020 — Table mandats (historique cycle de vie)
 * Phase G.2 - Lot 9
 *
 * Usage local : node backend/scripts/migrate-v020-mandats.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../src/db/sequelize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../src/database/migrations/V020_mandats.sql'
);

async function runMigration() {
  console.log('[V020] Lecture du fichier SQL...');
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

  console.log('[V020] Exécution de la migration...');
  await sequelize.query(sql);

  console.log('[V020] Vérification table mandats...');
  const [tables] = await sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name = 'mandats';
  `);

  if (tables.length === 0) {
    throw new Error('[V020] ERREUR : table mandats absente.');
  }

  const [columns] = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'mandats'
    ORDER BY ordinal_position;
  `);

  console.log(`[V020] Table mandats : ${columns.length} colonnes`);
  columns.forEach((c) => console.log(`  - ${c.column_name}`));

  console.log('[V020] OK — Migration V020 appliquée avec succès.');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[V020] ÉCHEC :', err.message);
    process.exit(1);
  });
