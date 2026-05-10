/**
 * EluCommitment Model
 * Gère les engagements des élus
 */

import { query } from '../db/pool.js';

class EluCommitment {
  static async list(filters = {}) {
    let sql = `
      SELECT
        ec.id,
        ec.elu_id,
        ec.titre,
        ec.description,
        ec.status,
        ec.deadline,
        ec.created_at,
        ec.completed_at,
        ec.updated_at,
        (SELECT COUNT(*) FROM commitment_tracking WHERE commitment_id = ec.id) as track_count
      FROM elu_commitments ec
      WHERE 1=1
    `;
    const params = [];

    if (filters.elu_id) {
      params.push(filters.elu_id);
      sql += ` AND ec.elu_id = $${params.length}`;
    }

    if (filters.status) {
      params.push(filters.status);
      sql += ` AND ec.status = $${params.length}`;
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      sql += ` AND (ec.titre ILIKE $${params.length} OR ec.description ILIKE $${params.length})`;
      params.push(`%${filters.search}%`);
    }

    sql += ` ORDER BY ec.created_at DESC`;

    if (filters.limit) {
      params.push(filters.limit);
      sql += ` LIMIT $${params.length}`;
    }

    if (filters.offset) {
      params.push(filters.offset);
      sql += ` OFFSET $${params.length}`;
    }

    const result = await query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT
        ec.id,
        ec.elu_id,
        ec.titre,
        ec.description,
        ec.status,
        ec.deadline,
        ec.created_at,
        ec.completed_at,
        ec.updated_at,
        (SELECT COUNT(*) FROM commitment_tracking WHERE commitment_id = ec.id) as track_count
      FROM elu_commitments ec
      WHERE ec.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByElu(eluId, filters = {}) {
    return this.list({ ...filters, elu_id: eluId });
  }

  static async create(eluId, data) {
    const { titre, description, status = 'engagée', deadline } = data;

    const result = await query(
      `INSERT INTO elu_commitments (elu_id, titre, description, status, deadline)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [eluId, titre, description, status, deadline || null]
    );

    return result.rows[0];
  }

  static async update(id, data) {
    const updates = [];
    const params = [id];
    let paramIndex = 2;

    if (data.titre !== undefined) {
      updates.push(`titre = $${paramIndex++}`);
      params.push(data.titre);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }

    if (data.deadline !== undefined) {
      updates.push(`deadline = $${paramIndex++}`);
      params.push(data.deadline);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `UPDATE elu_commitments SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  static async complete(id) {
    return this.update(id, {
      status: 'complétée',
      completed_at: new Date()
    });
  }

  static async abandon(id) {
    return this.update(id, {
      status: 'abandonnée',
      completed_at: new Date()
    });
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM elu_commitments WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows[0] || null;
  }

  static async search(searchTerm, filters = {}) {
    return this.list({ ...filters, search: searchTerm });
  }

  static async getStats() {
    const result = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'engagée' THEN 1 END) as en_attente,
        COUNT(CASE WHEN status = 'en cours' THEN 1 END) as en_cours,
        COUNT(CASE WHEN status = 'complétée' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'abandonnée' THEN 1 END) as abandoned,
        AVG(EXTRACT(DAY FROM (CASE WHEN completed_at IS NOT NULL THEN completed_at - created_at END))) as avg_completion_days
      FROM elu_commitments
    `);

    return result.rows[0];
  }
}

class CommitmentUpdate {
  static async add(commitmentId, data) {
    const { authorId, contenu, statusChange = null } = data;

    const result = await query(
      `INSERT INTO commitment_updates (commitment_id, author_id, contenu, status_change)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [commitmentId, authorId || null, contenu, statusChange]
    );

    return result.rows[0];
  }

  static async getUpdates(commitmentId) {
    const result = await query(
      `SELECT * FROM commitment_updates
       WHERE commitment_id = $1
       ORDER BY created_at DESC`,
      [commitmentId]
    );

    return result.rows;
  }

  static async delete(updateId) {
    const result = await query(
      'DELETE FROM commitment_updates WHERE id = $1 RETURNING id',
      [updateId]
    );

    return result.rows[0] || null;
  }
}

class CommitmentTracking {
  static async track(commitmentId, citoyenId) {
    try {
      const result = await query(
        `INSERT INTO commitment_tracking (commitment_id, citoyen_id)
         VALUES ($1, $2)
         RETURNING *`,
        [commitmentId, citoyenId]
      );

      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        return { error: 'Already tracking' };
      }
      throw err;
    }
  }

  static async untrack(commitmentId, citoyenId) {
    const result = await query(
      `DELETE FROM commitment_tracking
       WHERE commitment_id = $1 AND citoyen_id = $2
       RETURNING id`,
      [commitmentId, citoyenId]
    );

    return result.rows[0] || null;
  }

  static async isTracking(commitmentId, citoyenId) {
    const result = await query(
      `SELECT id FROM commitment_tracking
       WHERE commitment_id = $1 AND citoyen_id = $2`,
      [commitmentId, citoyenId]
    );

    return result.rows.length > 0;
  }

  static async getTracking(commitmentId) {
    const result = await query(
      `SELECT ct.*, u.email, u.nom_complet
       FROM commitment_tracking ct
       JOIN users u ON ct.citoyen_id = u.id
       WHERE ct.commitment_id = $1
       ORDER BY ct.tracked_at DESC`,
      [commitmentId]
    );

    return result.rows;
  }

  static async getTrackingCount(commitmentId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM commitment_tracking WHERE commitment_id = $1',
      [commitmentId]
    );

    return parseInt(result.rows[0].count, 10);
  }
}

export { EluCommitment, CommitmentUpdate, CommitmentTracking };
