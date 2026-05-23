/**
 * Script migration V017 — Tables donateurs + liens_interets
 * Phase G.2 - Lot 6
 *
 * Usage local : node backend/scripts/migrate-v017-financement.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../src/db/sequelize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../src/database/migrations/V017_financement.sql'
);

async function runMigration() {
  console.log('[V017] Lecture du fichier SQL...');
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

  console.log('[V017] Exécution de la migration...');
  await sequelize.query(sql);

  console.log('[V017] Vérification tables...');
  const [tables] = await sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name IN ('donateurs', 'liens_interets')
    ORDER BY table_name;
  `);

  if (tables.length !== 2) {
    throw new Error(
      `[V017] ERREUR : ${tables.length}/2 tables présentes (donateurs, liens_interets)`
    );
  }

  for (const t of tables) {
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = '${t.table_name}'
      ORDER BY ordinal_position;
    `);
    console.log(`[V017] Table ${t.table_name} : ${columns.length} colonnes`);
    columns.forEach((c) => console.log(`  - ${c.column_name}`));
  }

  console.log('[V017] OK — Migration V017 appliquée avec succès.');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[V017] ÉCHEC :', err.message);
    process.exit(1);
  });
