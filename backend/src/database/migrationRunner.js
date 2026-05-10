/**
 * Migration Runner — Gère les évolutions de schéma DB
 *
 * Utilisation:
 *   npm run migrate    # Exécuter toutes les migrations SQL
 *
 * Format des fichiers:
 *   {numero}_{description}.sql
 *   Exemple: 001_create_users.sql, 010_i18n.sql
 */

const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
  try {
    // Import dynamique pour éviter les problèmes de dépendances circulaires
    const sequelize = require('../db/sequelize').default;

    if (!sequelize) {
      throw new Error('Sequelize instance not found');
    }

    const migrationsDir = path.join(__dirname, '../migrations');

    // Vérifier que le dossier existe
    if (!fs.existsSync(migrationsDir)) {
      console.warn(`⚠️  Migrations directory not found: ${migrationsDir}`);
      return [];
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('ℹ️  No migration files found');
      return [];
    }

    console.log(`📋 Found ${files.length} migration file(s)\n`);

    const results = [];
    for (const file of files) {
      try {
        console.log(`🔄 Running migration: ${file}`);
        const sqlPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Exécuter le SQL
        await sequelize.query(sql);
        console.log(`✅ Migration ${file} complete\n`);

        results.push({ file, status: 'success' });
      } catch (err) {
        console.error(`❌ Migration ${file} failed:`, err.message);
        results.push({ file, status: 'failed', error: err.message });
        // Continuer avec les migrations suivantes ou arrêter?
        // Pour la sécurité, on arrête à la première erreur
        throw err;
      }
    }

    return results;
  } catch (err) {
    console.error('❌ Migration runner error:', err.message);
    throw err;
  }
};

module.exports = { runMigrations };
