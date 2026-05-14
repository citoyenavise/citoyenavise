/**
 * Setup Test Database
 * Synchronise le schéma Sequelize pour l'environnement de test (CI).
 * Usage : npm run setup:db
 */
import sequelize from '../src/db/sequelize.js';
import '../src/models/index.js';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('OK - Connexion BD test etablie');
    await sequelize.sync({ force: true });
    console.log('OK - Schema synchronise (force:true)');
    process.exit(0);
  } catch (err) {
    console.error('ERREUR - Setup BD test echoue :', err.message);
    process.exit(1);
  }
})();
