/**
 * Script migration V012 — Extension Elu fiche descriptive
 * Phase G.2 - Lot 1
 *
 * Usage local : node backend/scripts/migrate-v012-elu-fiche.js
 * Usage prod  : POST /api/admin/migrate-v012 (protégé adminAuth)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../src/db/sequelize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../src/database/migrations/V012_elu_fiche_descriptive.sql'
);

async function runMigration() {
  console.log('[V012] Lecture du fichier SQL...');
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

  console.log('[V012] Exécution de la migration...');
  await sequelize.query(sql);

  console.log('[V012] Vérification colonnes ajoutées...');
  const [columns] = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'elus'
      AND column_name IN (
        'parti_politique', 'parti_couleur', 'poste', 'roles_secondaires',
        'circonscription_id', 'mandat_debut', 'mandat_fin', 'legislature',
        'telephone', 'adresse_bureau', 'reseaux_sociaux',
        'statut', 'cause_fin', 'source_url', 'source_derniere_maj'
      )
    ORDER BY column_name;
  `);

  const expected = 15;
  console.log(`[V012] ${columns.length}/${expected} colonnes présentes :`);
  columns.forEach((c) => console.log(`  - ${c.column_name}`));

  if (columns.length !== expected) {
    throw new Error(
      `[V012] ERREUR : ${columns.length}/${expected} colonnes seulement. Migration incomplète.`
    );
  }

  console.log('[V012] OK — Migration V012 appliquée avec succès.');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[V012] ÉCHEC :', err.message);
    process.exit(1);
  });
