/**
 * Database Pool - Connexion PostgreSQL pour requêtes brutes
 * Utilise Sequelize en arrière-plan pour les requêtes SQL directes
 */

import sequelize from './db/sequelize.js';

class Pool {
  /**
   * Exécuter une requête SQL brute
   * @param {string} sql - Requête SQL avec placeholders $1, $2, etc.
   * @param {array} values - Paramètres de la requête
   * @returns {Promise<{rows: array}>}
   */
  async query(sql, values = []) {
    try {
      const result = await sequelize.query(sql, {
        replacements: values,
        type: sequelize.QueryTypes.SELECT,
      });

      return { rows: result };
    } catch (error) {
      console.error('Erreur requête SQL:', error);
      throw error;
    }
  }
}

export const pool = new Pool();
export default { pool };
