/**
 * Migration Script
 * Exécute toutes les migrations SQL disponibles
 *
 * Utilisation:
 *   npm run migrate
 */

const { runMigrations } = require('../src/database/migrationRunner');

(async () => {
  try {
    console.log('Starting migrations...\n');
    const results = await runMigrations();
    console.log('\n✅ All migrations complete');
    console.log(`   ${results.length} migration(s) executed`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
