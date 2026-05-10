/**
 * Script de vérification des tables de traduction
 * Affiche toutes les tables présentes dans la base de données
 */

import sequelize from '../src/db/sequelize.js';

async function checkTables() {
  try {
    console.log('\n🔍 Vérification des tables de traduction...\n');

    // Requête pour obtenir toutes les tables
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tables.length === 0) {
      console.log('❌ Aucune table trouvée');
      process.exit(1);
    }

    console.log(`✅ ${tables.length} table(s) trouvée(s):\n`);

    // Afficher les tables
    tables.forEach((row, idx) => {
      const tableName = row.table_name;
      const icon = [
        'translations',
        'petition_translations',
        'actualite_translations',
        'promise_translations',
        'comment_translations'
      ].includes(tableName) ? '✅' : '⚪';

      console.log(`  ${idx + 1}. ${icon} ${tableName}`);
    });

    console.log('\n');

    // Vérifier présence tables i18n
    const expectedTables = [
      'translations',
      'petition_translations',
      'actualite_translations',
      'promise_translations',
      'comment_translations'
    ];

    const tableNames = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !tableNames.includes(t));

    if (missingTables.length > 0) {
      console.log(`⚠️  Tables i18n manquantes: ${missingTables.join(', ')}\n`);
      process.exit(1);
    } else {
      console.log('✅ Toutes les tables i18n sont présentes!\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Erreur de vérification:', err.message);
    console.error('\nVérifiez que:');
    console.error('  1. PostgreSQL est en cours d\'exécution');
    console.error('  2. DATABASE_URL dans .env est correcte');
    console.error('  3. Les migrations ont été exécutées (npm run migrate)');
    process.exit(1);
  }
}

checkTables();
