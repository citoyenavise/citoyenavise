/**
 * Script CLI — synchronisation élus depuis sources officielles
 * Phase G.2 - Lot 13
 *
 * Usages :
 *   node scripts/sync-elus.js --source=openparliament --dry-run
 *   node scripts/sync-elus.js --source=ourcommons
 *   node scripts/sync-elus.js --source=openparliament --apply --mark-sortant
 *   node scripts/sync-elus.js --csv=path/to/senateurs.csv --apply
 *
 * Modes :
 *   --dry-run     (défaut) : affiche le plan, n'écrit rien
 *   --apply                : applique les changements
 *   --mark-sortant         : passe en 'sortant' les élus absents de la source
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import '../src/models/index.js'; // charge associations + hooks
import { syncFromSource, syncFromCsv } from '../src/services/electoralSync.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  })
);

const dryRun = !args.apply;
const autoMarkSortant = !!args['mark-sortant'];

async function main() {
  let result;

  if (args.csv) {
    const csvPath = path.resolve(args.csv);
    if (!fs.existsSync(csvPath)) {
      throw new Error(`Fichier CSV introuvable : ${csvPath}`);
    }
    const content = fs.readFileSync(csvPath, 'utf8');
    console.log(`[sync-elus] Import CSV : ${csvPath}`);
    console.log(`[sync-elus] Mode : ${dryRun ? 'DRY-RUN' : 'APPLY'}`);
    result = await syncFromCsv(content, {
      niveau: args.niveau || 'fédéral',
      legislature: args.legislature || '45',
      dryRun,
      autoMarkSortant,
    });
  } else if (args.source) {
    console.log(`[sync-elus] Source : ${args.source}`);
    console.log(`[sync-elus] Mode : ${dryRun ? 'DRY-RUN' : 'APPLY'}`);
    result = await syncFromSource(args.source, {
      dryRun,
      autoMarkSortant,
    });
  } else {
    console.error('Usage : --source=<openparliament|ourcommons> ou --csv=<path>');
    process.exit(2);
  }

  console.log('[sync-elus] Résultat :');
  console.log(JSON.stringify(result, null, 2));

  if (result.errors && result.errors.length > 0) {
    console.error(`[sync-elus] ${result.errors.length} erreur(s) détectée(s).`);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[sync-elus] ÉCHEC :', err.message);
    console.error(err.stack);
    process.exit(1);
  });
