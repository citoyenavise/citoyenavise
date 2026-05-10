/**
 * Circonscription Model
 * Gère les opérations base de données sur les circonscriptions électorales
 */

import { pool } from '../database.js';

export class Circonscription {
  /**
   * Lister toutes les circonscriptions avec filtres
   */
  static async list(filters = {}, limit = 50, offset = 0) {
    const { niveau, région, searchTerm, codePostal } = filters;

    let query = 'SELECT * FROM circonscriptions WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (niveau) {
      query += ` AND niveau = $${paramCount}`;
      values.push(niveau);
      paramCount++;
    }

    if (région) {
      query += ` AND région ILIKE $${paramCount}`;
      values.push(`%${région}%`);
      paramCount++;
    }

    if (codePostal) {
      query += ` AND code_postal ILIKE $${paramCount}`;
      values.push(`${codePostal}%`);
      paramCount++;
    }

    if (searchTerm) {
      query += ` AND to_tsvector('french', nom) @@ plainto_tsquery('french', $${paramCount})`;
      values.push(searchTerm);
      paramCount++;
    }

    query += ` ORDER BY niveau DESC, région ASC, nom ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Trouver circonscription par ID avec détails des élus
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM circonscriptions WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Trouver circonscription(s) par code postal
   */
  static async findByCodePostal(codePostal, niveau = null) {
    let query = `
      SELECT c.* FROM circonscriptions c
      WHERE c.code_postal = $1 OR c.id IN (
        SELECT circonscription_id FROM code_postal_to_circonscription
        WHERE code_postal = $1
      )
    `;
    const values = [codePostal];

    if (niveau) {
      query += ' AND c.niveau = $2';
      values.push(niveau);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Trouver circonscription(s) par région
   */
  static async findByRégion(région, niveau = null) {
    let query = 'SELECT * FROM circonscriptions WHERE région ILIKE $1';
    const values = [`%${région}%`];

    if (niveau) {
      query += ' AND niveau = $2';
      values.push(niveau);
    }

    query += ' ORDER BY nom ASC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Créer nouvelle circonscription
   */
  static async create(data) {
    const {
      codePostal,
      région,
      nom,
      niveau,
      elusIds = [],
      population,
      geom,
    } = data;

    const result = await pool.query(
      `INSERT INTO circonscriptions (code_postal, région, nom, niveau, elus_ids, population, geom)
       VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromText($7, 4326))
       RETURNING *`,
      [codePostal, région, nom, niveau, elusIds, population, geom || null]
    );
    return result.rows[0];
  }

  /**
   * Mettre à jour circonscription
   */
  static async update(circonscriptionId, data) {
    const allowedFields = [
      'code_postal',
      'région',
      'nom',
      'niveau',
      'population',
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) return null;

    values.push(circonscriptionId);
    const query = `
      UPDATE circonscriptions
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Ajouter un élu à une circonscription
   */
  static async addElu(circonscriptionId, eluId) {
    // Vérifier que l'élu ne soit pas déjà dans la liste
    const circ = await this.findById(circonscriptionId);
    if (!circ) throw new Error('Circonscription not found');
    if (circ.elus_ids.includes(eluId))
      throw new Error('Élu already in circonscription');

    // Ajouter l'élu à l'array
    const oldElus = circ.elus_ids;
    const newElus = [...circ.elus_ids, eluId];

    const result = await pool.query(
      `UPDATE circonscriptions
       SET elus_ids = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newElus, circonscriptionId]
    );

    // Log in history
    await CirconscriptionHistory.log(
      circonscriptionId,
      oldElus,
      newElus,
      'system',
      `Added élu ${eluId}`
    );

    return result.rows[0];
  }

  /**
   * Retirer un élu d'une circonscription
   */
  static async removeElu(circonscriptionId, eluId) {
    const circ = await this.findById(circonscriptionId);
    if (!circ) throw new Error('Circonscription not found');

    const oldElus = circ.elus_ids;
    const newElus = circ.elus_ids.filter((id) => id !== eluId);

    const result = await pool.query(
      `UPDATE circonscriptions
       SET elus_ids = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newElus, circonscriptionId]
    );

    // Log in history
    await CirconscriptionHistory.log(
      circonscriptionId,
      oldElus,
      newElus,
      'system',
      `Removed élu ${eluId}`
    );

    return result.rows[0];
  }

  /**
   * Remplacer tous les élus d'une circonscription
   */
  static async setElus(circonscriptionId, elusIds) {
    const circ = await this.findById(circonscriptionId);
    if (!circ) throw new Error('Circonscription not found');

    const oldElus = circ.elus_ids;

    const result = await pool.query(
      `UPDATE circonscriptions
       SET elus_ids = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [elusIds, circonscriptionId]
    );

    // Log in history
    await CirconscriptionHistory.log(
      circonscriptionId,
      oldElus,
      elusIds,
      'system',
      'Updated élus list'
    );

    return result.rows[0];
  }

  /**
   * Supprimer circonscription
   */
  static async delete(circonscriptionId) {
    const result = await pool.query(
      'DELETE FROM circonscriptions WHERE id = $1 RETURNING id',
      [circonscriptionId]
    );
    return !!result.rows[0];
  }

  /**
   * Lister circonscriptions par niveau
   */
  static async listByNiveau(niveau, limit = 50, offset = 0) {
    return this.list({ niveau }, limit, offset);
  }

  /**
   * Obtenir stats circonscriptions
   */
  static async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_circonscriptions,
        COUNT(DISTINCT niveau) as niveaux,
        COUNT(DISTINCT région) as régions,
        COALESCE(SUM(population), 0) as total_population
      FROM circonscriptions
    `);
    return result.rows[0];
  }

  /**
   * Obtenir circonscriptions pour un élu
   */
  static async findByEluId(eluId) {
    const result = await pool.query(
      `SELECT * FROM circonscriptions
       WHERE $1 = ANY(elus_ids)
       ORDER BY niveau DESC, région ASC`,
      [eluId]
    );
    return result.rows;
  }

  /**
   * Chercher circonscriptions
   */
  static async search(searchTerm, limit = 50, offset = 0) {
    return this.list({ searchTerm }, limit, offset);
  }
}

/**
 * CirconscriptionHistory Model
 * Gère l'audit trail des changements
 */
export class CirconscriptionHistory {
  /**
   * Logger un changement
   */
  static async log(circonscriptionId, oldElus, newElus, changedBy, reason) {
    await pool.query(
      `INSERT INTO circonscriptions_history (circonscription_id, old_elus_ids, new_elus_ids, changed_by, change_reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [circonscriptionId, oldElus, newElus, changedBy, reason]
    );
  }

  /**
   * Obtenir historique d'une circonscription
   */
  static async getHistory(circonscriptionId, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM circonscriptions_history
       WHERE circonscription_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [circonscriptionId, limit]
    );
    return result.rows;
  }
}

/**
 * CodePostalCirconscription Model
 * Gère la relation code postal → circonscription
 */
export class CodePostalCirconscription {
  /**
   * Ajouter mapping code postal → circonscription
   */
  static async add(codePostal, circonscriptionId, niveau) {
    const result = await pool.query(
      `INSERT INTO code_postal_to_circonscription (code_postal, circonscription_id, niveau)
       VALUES ($1, $2, $3)
       ON CONFLICT (code_postal) DO UPDATE SET circonscription_id = $2, niveau = $3
       RETURNING *`,
      [codePostal, circonscriptionId, niveau]
    );
    return result.rows[0];
  }

  /**
   * Trouver circonscription par code postal
   */
  static async findByCodePostal(codePostal, niveau = null) {
    let query =
      'SELECT * FROM code_postal_to_circonscription WHERE code_postal = $1';
    const values = [codePostal];

    if (niveau) {
      query += ' AND niveau = $2';
      values.push(niveau);
    }

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Supprimer mapping
   */
  static async delete(codePostal) {
    await pool.query(
      'DELETE FROM code_postal_to_circonscription WHERE code_postal = $1',
      [codePostal]
    );
  }
}
