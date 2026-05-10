/**
 * Petition Model
 * Gère les pétitions citoyennes adressées aux élus
 */

import { pool } from '../database.js';

export class Petition {
  /**
   * Lister pétitions avec filtres
   */
  static async list(filters = {}, limit = 50, offset = 0) {
    const { status, eluId, citoyenId, searchTerm, orderBy = 'created_at' } = filters;

    let query = 'SELECT * FROM petitions WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (eluId) {
      query += ` AND elu_id = $${paramCount}`;
      values.push(eluId);
      paramCount++;
    }

    if (citoyenId) {
      query += ` AND citoyen_id = $${paramCount}`;
      values.push(citoyenId);
      paramCount++;
    }

    if (searchTerm) {
      query += ` AND to_tsvector('french', titre || ' ' || description) @@ plainto_tsquery('french', $${paramCount})`;
      values.push(searchTerm);
      paramCount++;
    }

    // Order by
    const validOrderBy = ['created_at', 'signatures_count', 'deadline'];
    const orderDirection = validOrderBy.includes(orderBy) ? orderBy : 'created_at';

    if (orderDirection === 'signatures_count') {
      query += ` ORDER BY signatures_count DESC`;
    } else if (orderDirection === 'deadline') {
      query += ` ORDER BY deadline ASC NULLS LAST`;
    } else {
      query += ` ORDER BY created_at DESC`;
    }

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Trouver pétition par ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM petitions WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Créer nouvelle pétition
   */
  static async create(data) {
    const {
      titre,
      description,
      citoyenId,
      eluId,
      deadline
    } = data;

    const result = await pool.query(
      `INSERT INTO petitions (titre, description, citoyen_id, elu_id, deadline, status)
       VALUES ($1, $2, $3, $4, $5, 'draft')
       RETURNING *`,
      [titre, description, citoyenId, eluId, deadline]
    );
    return result.rows[0];
  }

  /**
   * Mettre à jour pétition
   */
  static async update(petitionId, data) {
    const allowedFields = ['titre', 'description', 'elu_id', 'status', 'deadline'];

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

    values.push(petitionId);
    const query = `
      UPDATE petitions
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Publier pétition (draft → published)
   */
  static async publish(petitionId) {
    const result = await pool.query(
      `UPDATE petitions
       SET status = 'published', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'draft'
       RETURNING *`,
      [petitionId]
    );
    return result.rows[0] || null;
  }

  /**
   * Fermer pétition
   */
  static async close(petitionId, status = 'closed') {
    const validStatuses = ['closed', 'won'];
    if (!validStatuses.includes(status)) throw new Error('Invalid status');

    const result = await pool.query(
      `UPDATE petitions
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, petitionId]
    );
    return result.rows[0] || null;
  }

  /**
   * Supprimer pétition (draft only)
   */
  static async delete(petitionId) {
    const result = await pool.query(
      'DELETE FROM petitions WHERE id = $1 AND status = $2 RETURNING id',
      [petitionId, 'draft']
    );
    return result.rows[0] ? true : false;
  }

  /**
   * Lister pétitions par statut
   */
  static async listByStatus(status, limit = 50, offset = 0) {
    return this.list({ status }, limit, offset);
  }

  /**
   * Lister pétitions d'un citoyen
   */
  static async listByCitoyen(citoyenId, limit = 50, offset = 0) {
    return this.list({ citoyenId }, limit, offset);
  }

  /**
   * Lister pétitions adressées à un élu
   */
  static async listByElu(eluId, limit = 50, offset = 0) {
    return this.list({ eluId }, limit, offset);
  }

  /**
   * Obtenir stats pétitions
   */
  static async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_petitions,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_petitions,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_petitions,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as won_petitions,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_petitions,
        COALESCE(AVG(signatures_count), 0) as avg_signatures,
        MAX(signatures_count) as max_signatures
      FROM petitions
    `);
    return result.rows[0];
  }

  /**
   * Chercher pétitions
   */
  static async search(searchTerm, limit = 50, offset = 0) {
    return this.list({ searchTerm, status: 'published' }, limit, offset);
  }

  /**
   * Obtenir pétitions les plus signées
   */
  static async getTopSigned(limit = 10) {
    const result = await pool.query(
      `SELECT * FROM petitions
       WHERE status = 'published'
       ORDER BY signatures_count DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

/**
 * PetitionSignature Model
 * Gère les signatures des pétitions
 */
export class PetitionSignature {
  /**
   * Signer une pétition
   */
  static async sign(petitionId, citoyenId) {
    try {
      const result = await pool.query(
        `INSERT INTO petition_signatures (petition_id, citoyen_id)
         VALUES ($1, $2)
         RETURNING *`,
        [petitionId, citoyenId]
      );
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') { // unique violation
        throw new Error('Already signed this petition');
      }
      throw err;
    }
  }

  /**
   * Retirer signature
   */
  static async unsign(petitionId, citoyenId) {
    const result = await pool.query(
      'DELETE FROM petition_signatures WHERE petition_id = $1 AND citoyen_id = $2 RETURNING *',
      [petitionId, citoyenId]
    );
    return result.rows[0] ? true : false;
  }

  /**
   * Vérifier si citoyen a signé
   */
  static async hasSigned(petitionId, citoyenId) {
    const result = await pool.query(
      'SELECT id FROM petition_signatures WHERE petition_id = $1 AND citoyen_id = $2',
      [petitionId, citoyenId]
    );
    return result.rows.length > 0;
  }

  /**
   * Obtenir signataires d'une pétition
   */
  static async getSignatures(petitionId, limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT ps.*, u.nom_complet, u.email
       FROM petition_signatures ps
       JOIN users u ON ps.citoyen_id = u.id
       WHERE ps.petition_id = $1
       ORDER BY ps.signed_at DESC
       LIMIT $2 OFFSET $3`,
      [petitionId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Compter signatures
   */
  static async countSignatures(petitionId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM petition_signatures WHERE petition_id = $1',
      [petitionId]
    );
    return parseInt(result.rows[0].count);
  }
}

/**
 * PetitionUpdate Model
 * Gère les mises à jour de pétitions
 */
export class PetitionUpdate {
  /**
   * Ajouter mise à jour
   */
  static async add(petitionId, authorId, contenu) {
    const result = await pool.query(
      `INSERT INTO petition_updates (petition_id, author_id, contenu)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [petitionId, authorId, contenu]
    );
    return result.rows[0];
  }

  /**
   * Obtenir mises à jour
   */
  static async getUpdates(petitionId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT pu.*, u.nom_complet
       FROM petition_updates pu
       JOIN users u ON pu.author_id = u.id
       WHERE pu.petition_id = $1
       ORDER BY pu.created_at DESC
       LIMIT $2 OFFSET $3`,
      [petitionId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Supprimer mise à jour
   */
  static async delete(updateId) {
    const result = await pool.query(
      'DELETE FROM petition_updates WHERE id = $1 RETURNING id',
      [updateId]
    );
    return result.rows[0] ? true : false;
  }
}

/**
 * PetitionComment Model
 * Gère les commentaires sur les pétitions
 */
export class PetitionComment {
  /**
   * Ajouter commentaire
   */
  static async add(petitionId, authorId, contenu, parentCommentId = null) {
    const result = await pool.query(
      `INSERT INTO petition_comments (petition_id, author_id, contenu, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [petitionId, authorId, contenu, parentCommentId]
    );
    return result.rows[0];
  }

  /**
   * Obtenir commentaires
   */
  static async getComments(petitionId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT pc.*, u.nom_complet
       FROM petition_comments pc
       JOIN users u ON pc.author_id = u.id
       WHERE pc.petition_id = $1 AND pc.parent_comment_id IS NULL
       ORDER BY pc.likes_count DESC, pc.created_at DESC
       LIMIT $2 OFFSET $3`,
      [petitionId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Supprimer commentaire
   */
  static async delete(commentId) {
    const result = await pool.query(
      'DELETE FROM petition_comments WHERE id = $1 RETURNING id',
      [commentId]
    );
    return result.rows[0] ? true : false;
  }
}
