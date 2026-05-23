/**
 * Script orchestré — purge complète + import fédéral 45ᵉ législature
 * Phase G.2 - Lot 14
 *
 * SÉQUENCE :
 *   1. DELETE FROM elus (CASCADE → promesses, actions, votes, controverses,
 *      donateurs, liens_interets, mandats, elu_comments, elu_follows, changelog)
 *   2. Import openparliament.ca → 338 députés actuels (45ᵉ législature)
 *   3. Import CSV optionnel (sénateurs + PM/cabinet précisés + GG + juges)
 *
 * Usages :
 *   node scripts/purge-and-import-federal.js --confirm-purge --dry-run
 *   node scripts/purge-and-import-federal.js --confirm-purge --apply
 *   node scripts/purge-and-import-federal.js --confirm-purge --apply \
 *        --csv=data/federal-extras.csv
 *
 * SÉCURITÉ :
 *   --confirm-purge OBLIGATOIRE pour exécution (anti-erreur)
 *   --dry-run par défaut si --apply absent
 */

import fs from 'fs';
import path from 'path';
import sequelize from '../src/db/sequelize.js';
import '../src/models/index.js'; // charge associations + hooks
import { syncFromSource, syncFromCsv } from '../src/services/electoralSync.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  })
);

if (!args['confirm-purge']) {
  console.error('[ERREUR] Le drapeau --confirm-purge est OBLIGATOIRE.');
  console.error('         Cette commande va SUPPRIMER tous les élus existants.');
  process.exit(2);
}

const dryRun = !args.apply;
const csvPath = args.csv || null;

async function step1_purge() {
  console.log('\n=== ÉTAPE 1 : PURGE TABLE elus (CASCADE) ===');

  const [before] = await sequelize.query('SELECT COUNT(*) AS c FROM elus');
  console.log(`[purge] Élus existants avant : ${before[0].c}`);

  if (dryRun) {
    console.log('[purge] DRY-RUN : aucune suppression effectuée.');
    return;
  }

  await sequelize.query('TRUNCATE TABLE elus RESTART IDENTITY CASCADE');

  const [after] = await sequelize.query('SELECT COUNT(*) AS c FROM elus');
  console.log(`[purge] Élus restants après : ${after[0].c}`);
  console.log('[purge] OK — Table elus purgée (CASCADE).');
}

async function step2_importDeputes() {
  console.log('\n=== ÉTAPE 2 : IMPORT DÉPUTÉS (openparliament.ca) ===');

  const result = await syncFromSource('openparliament', {
    dryRun,
    autoMarkSortant: false,
  });

  console.log('[import-deputes] Résultat :');
  console.log(`  - Créés       : ${result.created}`);
  console.log(`  - Mis à jour  : ${result.updated}`);
  console.log(`  - Erreurs     : ${result.errors?.length || 0}`);

  if (result.errors && result.errors.length > 0) {
    console.error('[import-deputes] Détail erreurs :');
    result.errors.slice(0, 5).forEach((e) => console.error(`  - ${e.nom || e.id}: ${e.message}`));
    if (result.errors.length > 5) {
      console.error(`  ... +${result.errors.length - 5} autre(s)`);
    }
  }

  if (dryRun && result.preview) {
    console.log(`[import-deputes] DRY-RUN preview : ${result.preview.to_create.length} à créer`);
  }

  return result;
}

async function step3_importExtras() {
  if (!csvPath) {
    console.log('\n=== ÉTAPE 3 : SKIP (pas de --csv fourni) ===');
    console.log('[extras] Pour importer Sénateurs + Gouverneur général + Juges :');
    console.log('         node scripts/purge-and-import-federal.js \\');
    console.log('              --confirm-purge --apply \\');
    console.log('              --csv=data/federal-extras.csv');
    return;
  }

  console.log(`\n=== ÉTAPE 3 : IMPORT CSV EXTRAS (${csvPath}) ===`);

  const absPath = path.resolve(csvPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Fichier CSV introuvable : ${absPath}`);
  }

  const content = fs.readFileSync(absPath, 'utf8');

  const result = await syncFromCsv(content, {
    niveau: 'fédéral',
    legislature: '45',
    dryRun,
    autoMarkSortant: false,
  });

  console.log('[import-extras] Résultat :');
  console.log(`  - Créés       : ${result.created}`);
  console.log(`  - Mis à jour  : ${result.updated}`);
  console.log(`  - Erreurs     : ${result.errors?.length || 0}`);

  if (result.errors && result.errors.length > 0) {
    console.error('[import-extras] Détail erreurs :');
    result.errors.slice(0, 10).forEach((e) => console.error(`  - ${e.nom || e.id}: ${e.message}`));
  }

  return result;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  PURGE + IMPORT FÉDÉRAL — 45ᵉ législature du Canada         ║');
  console.log(`║  Mode : ${dryRun ? 'DRY-RUN (aucune écriture)' : 'APPLY (écriture en BD)'}`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  await step1_purge();
  await step2_importDeputes();
  await step3_importExtras();

  console.log('\n=== TERMINÉ ===');

  const [final] = await sequelize.query(
    `SELECT statut, niveau, COUNT(*) AS c FROM elus GROUP BY statut, niveau ORDER BY niveau, statut`
  );
  console.log('[bilan] État de la table elus :');
  final.forEach((r) => console.log(`  - ${r.niveau}/${r.statut} : ${r.c}`));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[ÉCHEC]', err.message);
    console.error(err.stack);
    process.exit(1);
  });
