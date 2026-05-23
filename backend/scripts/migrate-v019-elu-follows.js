/**
 * Script migration V019 — Table elu_follows
 * Phase G.2 - Lot 8
 *
 * Usage local : node backend/scripts/migrate-v019-elu-follows.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../src/db/sequelize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../src/database/migrations/V019_elu_follows.sql'
);

async function runMigration() {
  console.log('[V019] Lecture du fichier SQL...');
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

  console.log('[V019] Exécution de la migration...');
  await sequelize.query(sql);

  console.log('[V019] Vérification table elu_follows...');
  const [tables] = await sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name = 'elu_follows';
  `);

  if (tables.length === 0) {
    throw new Error('[V019] ERREUR : table elu_follows absente.');
  }

  const [columns] = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'elu_follows'
    ORDER BY ordinal_position;
  `);

  console.log(`[V019] Table elu_follows : ${columns.length} colonnes`);
  columns.forEach((c) => console.log(`  - ${c.column_name}`));

  // Vérification clé primaire composite
  const [pk] = await sequelize.query(`
    SELECT a.attname AS column_name
    FROM pg_index i
    JOIN pg_attribute a
      ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'elu_follows'::regclass AND i.indisprimary;
  `);
  console.log(`[V019] Clé primaire : (${pk.map((p) => p.column_name).join(', ')})`);

  console.log('[V019] OK — Migration V019 appliquée avec succès.');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[V019] ÉCHEC :', err.message);
    process.exit(1);
  });
