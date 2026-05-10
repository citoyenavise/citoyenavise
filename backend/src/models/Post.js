/**
 * Post Model
 * Gère les posts/idées citoyennes avec commentaires, likes, et tags
 */

import { query } from '../db/pool.js';

class Post {
  static async list(filters = {}) {
    let sql = `
      SELECT
        p.id,
        p.titre,
        p.contenu,
        p.author_id,
        p.petition_id,
        p.elu_id,
        p.statut,
        p.likes_count,
        p.comments_count,
        p.created_at,
        p.published_at,
        u.nom_complet as author_name,
        u.email as author_email,
        ARRAY(SELECT json_build_object('id', id, 'nom', nom) FROM post_tags
              WHERE id IN (SELECT tag_id FROM post_post_tags WHERE post_id = p.id)) as tags
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.statut) {
      params.push(filters.statut);
      sql += ` AND p.statut = $${params.length}`;
    }

    if (filters.author_id) {
      params.push(filters.author_id);
      sql += ` AND p.author_id = $${params.length}`;
    }

    if (filters.petition_id) {
      params.push(filters.petition_id);
      sql += ` AND p.petition_id = $${params.length}`;
    }

    if (filters.elu_id) {
      params.push(filters.elu_id);
      sql += ` AND p.elu_id = $${params.length}`;
    }

    if (filters.tag_id) {
      params.push(filters.tag_id);
      sql += ` AND p.id IN (SELECT post_id FROM post_post_tags WHERE tag_id = $${params.length})`;
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      sql += ` AND (to_tsvector('french', p.titre || ' ' || p.contenu) @@ plainto_tsquery('french', $${params.length}))`;
    }

    sql += ` ORDER BY p.created_at DESC`;

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

  static async findById(id, userId = null) {
    const result = await query(
      `SELECT
        p.id,
        p.titre,
        p.contenu,
        p.author_id,
        p.petition_id,
        p.elu_id,
        p.statut,
        p.likes_count,
        p.comments_count,
        p.created_at,
        p.published_at,
        p.updated_at,
        u.nom_complet as author_name,
        u.email as author_email,
        ARRAY(SELECT json_build_object('id', id, 'nom', nom) FROM post_tags
              WHERE id IN (SELECT tag_id FROM post_post_tags WHERE post_id = p.id)) as tags,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $2) as user_liked
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = $1`,
      [id, userId || null]
    );

    return result.rows[0] || null;
  }

  static async create(data) {
    const { titre, contenu, author_id, petition_id = null, elu_id = null, tags = [] } = data;

    const result = await query(
      `INSERT INTO posts (titre, contenu, author_id, petition_id, elu_id, statut)
       VALUES ($1, $2, $3, $4, $5, 'draft')
       RETURNING *`,
      [titre, contenu, author_id, petition_id, elu_id]
    );

    const post = result.rows[0];

    // Add tags if provided
    if (tags.length > 0) {
      for (const tag_id of tags) {
        await query(
          `INSERT INTO post_post_tags (post_id, tag_id) VALUES ($1, $2)`,
          [post.id, tag_id]
        );
      }
    }

    return post;
  }

  static async update(id, data, userId) {
    // Verify ownership
    const post = await this.findById(id);
    if (!post || post.author_id !== userId) {
      return null;
    }

    const updates = [];
    const params = [id];
    let paramIndex = 2;

    if (data.titre !== undefined) {
      updates.push(`titre = $${paramIndex++}`);
      params.push(data.titre);
    }

    if (data.contenu !== undefined) {
      updates.push(`contenu = $${paramIndex++}`);
      params.push(data.contenu);
    }

    if (data.tags !== undefined && Array.isArray(data.tags)) {
      // Remove old tags
      await query(`DELETE FROM post_post_tags WHERE post_id = $1`, [id]);
      // Add new tags
      for (const tag_id of data.tags) {
        await query(
          `INSERT INTO post_post_tags (post_id, tag_id) VALUES ($1, $2)`,
          [id, tag_id]
        );
      }
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) return post; // Only updated_at changed

    const sql = `UPDATE posts SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
    const updateResult = await query(sql, params);
    return updateResult.rows[0] || null;
  }

  static async publish(id, userId) {
    // Verify ownership
    const post = await this.findById(id);
    if (!post || post.author_id !== userId) {
      return null;
    }

    if (post.statut !== 'draft') {
      return null;
    }

    const result = await query(
      `UPDATE posts SET statut = 'published', published_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    return result.rows[0] || null;
  }

  static async delete(id, userId) {
    // Verify ownership
    const post = await this.findById(id);
    if (!post || post.author_id !== userId) {
      return null;
    }

    const result = await query(
      'DELETE FROM posts WHERE id = $1 RETURNING id',
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
        COUNT(CASE WHEN statut = 'draft' THEN 1 END) as drafts,
        COUNT(CASE WHEN statut = 'published' THEN 1 END) as published,
        COALESCE(AVG(likes_count), 0) as avg_likes,
        COALESCE(AVG(comments_count), 0) as avg_comments,
        MAX(likes_count) as max_likes
      FROM posts
      WHERE statut = 'published'
    `);

    return result.rows[0];
  }

  static async getTopLiked(limit = 10) {
    const result = await query(
      `SELECT * FROM posts
       WHERE statut = 'published'
       ORDER BY likes_count DESC, created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  static async getRecent(limit = 20, offset = 0) {
    const result = await query(
      `SELECT * FROM posts
       WHERE statut = 'published'
       ORDER BY published_at DESC NULLS LAST, created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  }
}

class PostComment {
  static async add(postId, data) {
    const { author_id, contenu, parent_comment_id = null } = data;

    const result = await query(
      `INSERT INTO post_comments (post_id, author_id, contenu, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [postId, author_id, contenu, parent_comment_id]
    );

    return result.rows[0];
  }

  static async getComments(postId, limit = 50, offset = 0) {
    const result = await query(
      `SELECT pc.*, u.nom_complet, u.email
       FROM post_comments pc
       JOIN users u ON pc.author_id = u.id
       WHERE pc.post_id = $1 AND pc.parent_comment_id IS NULL
       ORDER BY pc.likes_count DESC, pc.created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    return result.rows;
  }

  static async getReplies(commentId, limit = 20) {
    const result = await query(
      `SELECT pc.*, u.nom_complet, u.email
       FROM post_comments pc
       JOIN users u ON pc.author_id = u.id
       WHERE pc.parent_comment_id = $1
       ORDER BY pc.created_at ASC
       LIMIT $2`,
      [commentId, limit]
    );

    return result.rows;
  }

  static async delete(commentId, userId) {
    const result = await query(
      'DELETE FROM post_comments WHERE id = $1 AND author_id = $2 RETURNING id',
      [commentId, userId]
    );

    return result.rows[0] ? true : false;
  }
}

class PostLike {
  static async like(postId, userId) {
    try {
      const result = await query(
        `INSERT INTO post_likes (post_id, user_id)
         VALUES ($1, $2)
         RETURNING *`,
        [postId, userId]
      );

      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        return { error: 'Already liked' };
      }
      throw err;
    }
  }

  static async unlike(postId, userId) {
    const result = await query(
      'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2 RETURNING id',
      [postId, userId]
    );

    return result.rows[0] ? true : false;
  }

  static async hasLiked(postId, userId) {
    const result = await query(
      'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    return result.rows.length > 0;
  }

  static async getLikes(postId) {
    const result = await query(
      `SELECT pl.*, u.nom_complet, u.email
       FROM post_likes pl
       JOIN users u ON pl.user_id = u.id
       WHERE pl.post_id = $1
       ORDER BY pl.created_at DESC`,
      [postId]
    );

    return result.rows;
  }

  static async countLikes(postId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM post_likes WHERE post_id = $1',
      [postId]
    );

    return parseInt(result.rows[0].count, 10);
  }
}

class CommentLike {
  static async like(commentId, userId) {
    try {
      const result = await query(
        `INSERT INTO comment_likes (comment_id, user_id)
         VALUES ($1, $2)
         RETURNING *`,
        [commentId, userId]
      );

      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        return { error: 'Already liked' };
      }
      throw err;
    }
  }

  static async unlike(commentId, userId) {
    const result = await query(
      'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2 RETURNING id',
      [commentId, userId]
    );

    return result.rows[0] ? true : false;
  }

  static async hasLiked(commentId, userId) {
    const result = await query(
      'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, userId]
    );

    return result.rows.length > 0;
  }

  static async countLikes(commentId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = $1',
      [commentId]
    );

    return parseInt(result.rows[0].count, 10);
  }
}

class PostTag {
  static async create(data) {
    const { nom, description = null, slug = null } = data;

    const result = await query(
      `INSERT INTO post_tags (nom, description, slug)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nom, description, slug || nom.toLowerCase().replace(/\s+/g, '-')]
    );

    return result.rows[0];
  }

  static async findAll() {
    const result = await query('SELECT * FROM post_tags ORDER BY nom ASC');
    return result.rows;
  }

  static async findById(id) {
    const result = await query('SELECT * FROM post_tags WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findBySlug(slug) {
    const result = await query('SELECT * FROM post_tags WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  }

  static async getPostsByTag(tagId, limit = 20, offset = 0) {
    const result = await query(
      `SELECT p.* FROM posts p
       JOIN post_post_tags ppt ON p.id = ppt.post_id
       WHERE ppt.tag_id = $1 AND p.statut = 'published'
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [tagId, limit, offset]
    );

    return result.rows;
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM post_tags WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows[0] ? true : false;
  }
}

export { Post, PostComment, PostLike, CommentLike, PostTag };
