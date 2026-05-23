/**
 * Script normalisation — régions + partis politiques
 * Phase G.2 - Lot 14 (post-import)
 *
 * Objectif : harmoniser les valeurs hétérogènes provenant des sources
 *            (openparliament en anglais + CSV en français).
 *
 * Audit : chaque modification est tracée dans elu_changelog
 *         (source='systeme', auditDetails={raison:'normalisation_*'}).
 *
 * Usage :
 *   node scripts/normalize-elus.js --dry-run   (défaut)
 *   node scripts/normalize-elus.js --apply
 */

import sequelize from '../src/db/sequelize.js';
import '../src/models/index.js'; // charge associations + hooks
import Elu from '../src/models/Elu.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  })
);

const dryRun = !args.apply;

// ═══════════════════════════════════════════════════════════════════
// Tables de mapping
// ═══════════════════════════════════════════════════════════════════

const REGIONS_MAP = {
  AB: 'Alberta',
  BC: 'Colombie-Britannique',
  MB: 'Manitoba',
  NB: 'Nouveau-Brunswick',
  NL: 'Terre-Neuve-et-Labrador',
  NS: 'Nouvelle-Écosse',
  NT: 'Territoires du Nord-Ouest',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Île-du-Prince-Édouard',
  QC: 'Québec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
};

const PARTIS_MAP = {
  Liberal: 'Parti libéral du Canada',
  Conservative: 'Parti conservateur du Canada',
  Bloc: 'Bloc québécois',
  NDP: 'Nouveau Parti démocratique',
  Green: 'Parti vert',
  Independent: 'Indépendant',
  'Non affilié': 'Indépendant',
};

// ═══════════════════════════════════════════════════════════════════
// Normalisation
// ═══════════════════════════════════════════════════════════════════

async function normalizeRegions() {
  console.log('\n─── Normalisation régions (codes ISO → français) ───');

  const stats = { updated: 0, skipped: 0, byCode: {} };

  for (const [code, nom] of Object.entries(REGIONS_MAP)) {
    const elus = await Elu.findAll({ where: { region: code } });
    stats.byCode[code] = { count: elus.length, target: nom };

    if (dryRun) {
      console.log(`  [dry-run] ${code} → ${nom} : ${elus.length} élus`);
      stats.skipped += elus.length;
      continue;
    }

    for (const elu of elus) {
      await elu.update(
        { region: nom },
        {
          auditSource: 'systeme',
          auditUserId: null,
          auditDetails: { raison: 'normalisation_regions', from: code, to: nom },
        }
      );
      stats.updated += 1;
    }
    console.log(`  ${code} → ${nom} : ${elus.length} élus`);
  }

  return stats;
}

async function normalizePartis() {
  console.log('\n─── Normalisation partis politiques ───');

  const stats = { updated: 0, skipped: 0, byParti: {} };

  for (const [src, target] of Object.entries(PARTIS_MAP)) {
    const elus = await Elu.findAll({ where: { partiPolitique: src } });
    stats.byParti[src] = { count: elus.length, target };

    if (dryRun) {
      console.log(`  [dry-run] "${src}" → "${target}" : ${elus.length} élus`);
      stats.skipped += elus.length;
      continue;
    }

    for (const elu of elus) {
      await elu.update(
        { partiPolitique: target },
        {
          auditSource: 'systeme',
          auditUserId: null,
          auditDetails: { raison: 'normalisation_partis', from: src, to: target },
        }
      );
      stats.updated += 1;
    }
    console.log(`  "${src}" → "${target}" : ${elus.length} élus`);
  }

  return stats;
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  NORMALISATION ÉLUS — régions + partis');
  console.log(`  Mode : ${dryRun ? 'DRY-RUN (aucune écriture)' : 'APPLY'}`);
  console.log('═══════════════════════════════════════════════════════════');

  const regionStats = await normalizeRegions();
  const partiStats = await normalizePartis();

  console.log('\n─── BILAN ───');
  if (dryRun) {
    console.log(`Régions à modifier : ${regionStats.skipped}`);
    console.log(`Partis à modifier  : ${partiStats.skipped}`);
    console.log('\nPour appliquer : node scripts/normalize-elus.js --apply');
  } else {
    console.log(`Régions mises à jour : ${regionStats.updated}`);
    console.log(`Partis mis à jour    : ${partiStats.updated}`);

    // Vérification post-normalisation
    console.log('\n─── Vérification post-normalisation ───');
    const [partis] = await sequelize.query(`
      SELECT COALESCE(parti_politique, '(non renseigné)') AS parti, COUNT(*) AS c
      FROM elus
      WHERE statut = 'actif'
      GROUP BY parti_politique
      ORDER BY c DESC
    `);
    console.table(partis);

    const [regions] = await sequelize.query(`
      SELECT region, COUNT(*) AS c
      FROM elus
      WHERE statut = 'actif'
      GROUP BY region
      ORDER BY c DESC
    `);
    console.table(regions);
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[normalize-elus] ÉCHEC :', err.message);
    console.error(err.stack);
    process.exit(1);
  });
