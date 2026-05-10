/**
 * Database Pool - Requêtes SQL brutes via Sequelize
 * Compatibility layer pour les modèles qui utilisent du SQL direct
 */

import sequelize from './sequelize.js';

/**
 * Exécuter une requête SQL brute avec des paramètres
 * @param {string} sql - Requête SQL avec placeholders $1, $2, etc.
 * @param {array} params - Paramètres de la requête
 * @returns {Promise<{rows: array}>}
 */
export async function query(sql, params = []) {
  try {
    const result = await sequelize.query(sql, {
      replacements: params,
      type: sequelize.QueryTypes.SELECT,
    });

    return { rows: result };
  } catch (error) {
    console.error('Erreur requête SQL:', error);
    throw error;
  }
}

export default { query };
