/**
 * User Model
 * Gère les opérations base de données sur les utilisateurs
 */

import { pool } from '../database.js';

export class User {
  /**
   * Trouver utilisateur par email
   */
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Trouver utilisateur par ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Créer nouvel utilisateur
   */
  static async create(email, nomComplet, province, codePostal) {
    const result = await pool.query(
      `INSERT INTO users (email, nom_complet, province, code_postal)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, nom_complet, province, code_postal, created_at, verified_at`,
      [email, nomComplet, province, codePostal]
    );
    return result.rows[0];
  }

  /**
   * Mettre à jour utilisateur
   */
  static async update(userId, data) {
    const allowedFields = ['nom_complet', 'province', 'code_postal'];
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

    values.push(userId);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Marquer utilisateur comme vérifié
   */
  static async markVerified(userId) {
    const result = await pool.query(
      `UPDATE users
       SET verified_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Mettre à jour dernier login
   */
  static async updateLastLogin(userId, ipAddress, userAgent) {
    await pool.query(
      `UPDATE users
       SET last_login_at = CURRENT_TIMESTAMP,
           ip_address_registered = $2
       WHERE id = $1`,
      [userId, ipAddress]
    );
  }

  /**
   * Supprimer utilisateur
   */
  static async delete(userId) {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );
    return result.rows[0] ? true : false;
  }

  /**
   * Lister tous les utilisateurs (pagination)
   */
  static async list(limit = 20, offset = 0) {
    const result = await pool.query(
      `SELECT id, email, nom_complet, province, created_at, verified_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Compter utilisateurs vérifié
   */
  static async countVerified() {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE verified_at IS NOT NULL'
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Obtenir stats utilisateurs
   */
  static async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN verified_at IS NOT NULL THEN 1 END) as verified_users,
        COUNT(CASE WHEN verified_at IS NULL THEN 1 END) as unverified_users
      FROM users
    `);
    return result.rows[0];
  }
}

/**
 * EmailVerification Model
 * Gère les tokens de vérification email
 */
export class EmailVerification {
  /**
   * Créer token de vérification
   */
  static async create(userId, email, token, tokenType = 'magic_link', otpCode = null) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const result = await pool.query(
      `INSERT INTO email_verifications (user_id, email, token, token_type, otp_code, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, email, token, tokenType, otpCode, expiresAt]
    );
    return result.rows[0];
  }

  /**
   * Trouver vérification par token
   */
  static async findByToken(token) {
    const result = await pool.query(
      `SELECT * FROM email_verifications
       WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [token]
    );
    return result.rows[0] || null;
  }

  /**
   * Trouver vérification par OTP
   */
  static async findByOTP(email, otp) {
    const result = await pool.query(
      `SELECT * FROM email_verifications
       WHERE email = $1 AND otp_code = $2 AND expires_at > CURRENT_TIMESTAMP`,
      [email, otp]
    );
    return result.rows[0] || null;
  }

  /**
   * Marquer vérification comme utilisée
   */
  static async markAsUsed(verificationId) {
    await pool.query(
      `UPDATE email_verifications
       SET verified_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [verificationId]
    );
  }

  /**
   * Nettoyer tokens expirés
   */
  static async cleanupExpired() {
    await pool.query(
      `DELETE FROM email_verifications
       WHERE expires_at < CURRENT_TIMESTAMP`
    );
  }
}

/**
 * LoginAudit Model
 * Gère l'audit trail des connexions
 */
export class LoginAudit {
  /**
   * Enregistrer tentative de login
   */
  static async log(userId, ipAddress, userAgent, success = true, reason = null) {
    await pool.query(
      `INSERT INTO login_audits (user_id, ip_address, user_agent, success, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, ipAddress, userAgent, success, reason]
    );
  }

  /**
   * Obtenir historique login pour utilisateur
   */
  static async getHistory(userId, limit = 20) {
    const result = await pool.query(
      `SELECT * FROM login_audits
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  /**
   * Compter tentatives login échouées récentes
   */
  static async countRecentFailures(email, minutesBack = 15) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM login_audits la
       JOIN users u ON la.user_id = u.id
       WHERE u.email = $1
         AND la.success = false
         AND la.created_at > CURRENT_TIMESTAMP - INTERVAL '${minutesBack} minutes'`,
      [email]
    );
    return parseInt(result.rows[0].count);
  }
}
