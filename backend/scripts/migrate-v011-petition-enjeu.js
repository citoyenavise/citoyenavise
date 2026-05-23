/**
 * Migration V011 — Référentiel enjeux (one-off local)
 *
 * Usage local (depuis la racine du repo OU depuis backend/) :
 *   node backend/scripts/migrate-v011-petition-enjeu.js
 *   ou
 *   npm --prefix backend run migrate:v011
 *
 * Idempotent : peut être relancé sans dommage.
 *
 * En PRODUCTION (Neon), utiliser plutôt l'endpoint :
 *   POST /api/v1/admin/migrate-petition-enjeu
 *   (token ADMIN_SEED_TOKEN requis)
 */

// Charger explicitement backend/.env avant tout import qui lit process.env
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sequelizeModule = await import('../src/db/sequelize.js');
const sequelize = sequelizeModule.default;
const petitionModule = await import('../src/models/Petition.js');
const Petition = petitionModule.default;

const BACKFILL = {
  'Etendre le reseau de pistes cyclables securisees a Quebec': 'environnement',
  'Étendre le réseau de pistes cyclables sécurisées à Québec': 'environnement',
  'Ameliorer la frequence des autobus RTC en banlieue de Quebec': 'autre',
  'Améliorer la fréquence des autobus RTC en banlieue de Québec': 'autre',
  'Preserver les espaces verts du quartier Sainte-Foy contre la densification excessive': 'environnement',
  'Préserver les espaces verts du quartier Sainte-Foy contre la densification excessive': 'environnement',
};

async function run() {
  console.log('🚀 Migration V011 — Référentiel enjeux');
  console.log('═══════════════════════════════════════════\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Connexion BD établie\n');

    // 1. ADD COLUMN
    console.log('1️⃣  Ajout colonne enjeu...');
    await sequelize.query(
      `ALTER TABLE petitions ADD COLUMN IF NOT EXISTS enjeu VARCHAR(20)`,
    );
    console.log('   ✓ Colonne enjeu présente\n');

    // 2. CHECK constraint
    console.log('2️⃣  Ajout contrainte CHECK...');
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'petitions_enjeu_check'
        ) THEN
          ALTER TABLE petitions
            ADD CONSTRAINT petitions_enjeu_check
            CHECK (enjeu IN (
              'taxes', 'logement', 'sante', 'elections',
              'droits', 'environnement', 'energie', 'autre'
            ));
        END IF;
      END$$;
    `);
    console.log('   ✓ Contrainte CHECK en place\n');

    // 3. INDEX
    console.log('3️⃣  Création index...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_petitions_enjeu
        ON petitions (enjeu)
        WHERE enjeu IS NOT NULL
    `);
    console.log('   ✓ Index idx_petitions_enjeu créé\n');

    // 4. Backfill
    console.log('4️⃣  Backfill enjeux sur pétitions seed...');
    let backfilledCount = 0;
    for (const [titre, enjeu] of Object.entries(BACKFILL)) {
      const petition = await Petition.findOne({ where: { titre } });
      if (petition && petition.enjeu !== enjeu) {
        petition.enjeu = enjeu;
        await petition.save();
        console.log(`   ✓ #${petition.id} "${petition.titre.substring(0, 50)}..." → ${enjeu}`);
        backfilledCount += 1;
      }
    }
    console.log(`   ${backfilledCount} pétition(s) mise(s) à jour\n`);

    console.log('═══════════════════════════════════════════');
    console.log('✨ Migration V011 terminée avec succès');
    console.log('═══════════════════════════════════════════');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERREUR migration :');
    console.error(err);
    process.exit(1);
  }
}

run();
