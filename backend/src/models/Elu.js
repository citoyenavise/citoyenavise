/**
 * Elu Model
 * Gère les opérations base de données sur les élus (politiciens, représentants)
 */

import { pool } from '../database.js';

export class Elu {
  /**
   * Lister tous les élus avec filtres
   */
  static async list(filters = {}, limit = 50, offset = 0) {
    const { niveau, région, titre, searchTerm, isActive = true } = filters;

    let query = 'SELECT * FROM elus WHERE is_active = $1';
    const values = [isActive];
    let paramCount = 2;

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

    if (titre) {
      query += ` AND titre = $${paramCount}`;
      values.push(titre);
      paramCount++;
    }

    if (searchTerm) {
      query += ` AND to_tsvector('french', nom_complet) @@ plainto_tsquery('french', $${paramCount})`;
      values.push(searchTerm);
      paramCount++;
    }

    query += ` ORDER BY nom_complet ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Trouver élu par ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM elus WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Trouver élu par email
   */
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM elus WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Créer nouvel élu
   */
  static async create(data) {
    const {
      nomComplet,
      titre,
      région,
      niveau,
      email,
      photoUrl,
      siteWeb,
      dateDebutMandat,
      dateFinMandat,
      party,
      phone,
      biography
    } = data;

    const result = await pool.query(
      `INSERT INTO elus (nom_complet, titre, région, niveau, email, photo_url, site_web, date_debut_mandat, date_fin_mandat, party, phone, biography)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        nomComplet,
        titre,
        région,
        niveau,
        email,
        photoUrl,
        siteWeb,
        dateDebutMandat,
        dateFinMandat,
        party,
        phone,
        biography
      ]
    );
    return result.rows[0];
  }

  /**
   * Mettre à jour élu
   */
  static async update(eluId, data) {
    const allowedFields = [
      'nom_complet', 'titre', 'région', 'niveau', 'email',
      'photo_url', 'site_web', 'date_debut_mandat', 'date_fin_mandat',
      'party', 'phone', 'biography', 'is_active'
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

    values.push(eluId);
    const query = `
      UPDATE elus
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Supprimer élu
   */
  static async delete(eluId) {
    const result = await pool.query(
      'DELETE FROM elus WHERE id = $1 RETURNING id',
      [eluId]
    );
    return result.rows[0] ? true : false;
  }

  /**
   * Lister élus par niveau (fédéral, provincial, municipal)
   */
  static async listByNiveau(niveau, limit = 50, offset = 0) {
    return this.list({ niveau }, limit, offset);
  }

  /**
   * Lister élus par région
   */
  static async listByRégion(région, limit = 50, offset = 0) {
    return this.list({ région }, limit, offset);
  }

  /**
   * Lister élus par titre
   */
  static async listByTitre(titre, limit = 50, offset = 0) {
    return this.list({ titre }, limit, offset);
  }

  /**
   * Chercher élus par nom
   */
  static async search(searchTerm, limit = 50, offset = 0) {
    return this.list({ searchTerm }, limit, offset);
  }

  /**
   * Obtenir stats élus
   */
  static async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_elus,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_elus,
        COUNT(DISTINCT niveau) as niveaux,
        COUNT(DISTINCT région) as régions
      FROM elus
    `);
    return result.rows[0];
  }

  /**
   * Lister élus avec leurs contacts
   */
  static async findByIdWithContacts(eluId) {
    const eluResult = await pool.query(
      'SELECT * FROM elus WHERE id = $1',
      [eluId]
    );

    if (!eluResult.rows[0]) return null;

    const contactsResult = await pool.query(
      'SELECT * FROM elus_contacts WHERE elu_id = $1',
      [eluId]
    );

    const socialResult = await pool.query(
      'SELECT * FROM elus_social_media WHERE elu_id = $1',
      [eluId]
    );

    return {
      ...eluResult.rows[0],
      contacts: contactsResult.rows,
      socialMedia: socialResult.rows
    };
  }
}

/**
 * EluContact Model
 * Gère les contacts additionnels des élus
 */
export class EluContact {
  /**
   * Ajouter contact pour élu
   */
  static async add(eluId, type, label, value) {
    const result = await pool.query(
      `INSERT INTO elus_contacts (elu_id, type, label, value)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [eluId, type, label, value]
    );
    return result.rows[0];
  }

  /**
   * Obtenir tous les contacts d'un élu
   */
  static async getByEluId(eluId) {
    const result = await pool.query(
      'SELECT * FROM elus_contacts WHERE elu_id = $1',
      [eluId]
    );
    return result.rows;
  }

  /**
   * Supprimer contact
   */
  static async delete(contactId) {
    const result = await pool.query(
      'DELETE FROM elus_contacts WHERE id = $1 RETURNING id',
      [contactId]
    );
    return result.rows[0] ? true : false;
  }
}

/**
 * EluSocialMedia Model
 * Gère les réseaux sociaux des élus
 */
export class EluSocialMedia {
  /**
   * Ajouter réseau social
   */
  static async add(eluId, platform, username, url = null) {
    const result = await pool.query(
      `INSERT INTO elus_social_media (elu_id, platform, username, url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [eluId, platform, username, url]
    );
    return result.rows[0];
  }

  /**
   * Obtenir réseaux sociaux d'un élu
   */
  static async getByEluId(eluId) {
    const result = await pool.query(
      'SELECT * FROM elus_social_media WHERE elu_id = $1',
      [eluId]
    );
    return result.rows;
  }

  /**
   * Supprimer réseau social
   */
  static async delete(socialMediaId) {
    const result = await pool.query(
      'DELETE FROM elus_social_media WHERE id = $1 RETURNING id',
      [socialMediaId]
    );
    return result.rows[0] ? true : false;
  }
}
