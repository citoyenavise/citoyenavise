import { pool } from '../../database.js';
import logger from '../../core/utils/logger.js';

export class PublicationService {
  /**
   * Publish linked entities
   */
  static async publishDataset(datasetId) {
    try {
      const query = `
        UPDATE public_entities
        SET status = 'published',
            is_published = TRUE,
            published_at = CURRENT_TIMESTAMP,
            updated_by = 'system'
        WHERE dataset_id = $1 AND status = 'linked'
      `;

      const result = await pool.query(query, [datasetId]);

      // Update dataset status
      await this.updateDatasetStatus(datasetId, 'published');

      logger.info(`Published ${result.rowCount} entities for dataset ${datasetId}`, {
        meta: { datasetId, publishedCount: result.rowCount },
      });

      return {
        dataset_id: datasetId,
        status: 'published',
        published_count: result.rowCount,
      };
    } catch (err) {
      logger.error(`Publication failed for dataset ${datasetId}`, {
        meta: { error: err.message },
      });
      throw err;
    }
  }

  /**
   * Get public institutions (published entities)
   */
  static async getInstitutions(filters = {}) {
    const {
      type = null,
      region = null,
      city = null,
      search = null,
      limit = 20,
      offset = 0,
    } = filters;

    let query = `
      SELECT
        id, name, type, address, city, region, coordinates,
        phone, email, website, status
      FROM public_entities
      WHERE is_published = TRUE AND status = 'published'
    `;

    const params = [];

    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    if (region) {
      query += ` AND region = $${params.length + 1}`;
      params.push(region);
    }

    if (city) {
      query += ` AND city = $${params.length + 1}`;
      params.push(city);
    }

    if (search) {
      query += ` AND (name ILIKE $${params.length + 1} OR address ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get institution by ID
   */
  static async getInstitution(entityId) {
    const query = `
      SELECT
        id, dataset_id, name, description, type, subtype, category,
        address, postal_code, city, region, latitude, longitude,
        phone, email, website, opening_hours,
        metadata, status, published_at
      FROM public_entities
      WHERE id = $1 AND is_published = TRUE
    `;

    const result = await pool.query(query, [entityId]);
    return result.rows[0] || null;
  }

  /**
   * Get institution with attachments
   */
  static async getInstitutionWithAttachments(entityId) {
    const entity = await this.getInstitution(entityId);

    if (!entity) return null;

    // Get attachments
    const attachQuery = `
      SELECT attachment_type, target_id, relation_type, confidence_score
      FROM entity_attachments
      WHERE entity_id = $1
      ORDER BY confidence_score DESC
    `;

    const attachResult = await pool.query(attachQuery, [entityId]);

    return {
      ...entity,
      attachments: attachResult.rows,
    };
  }

  /**
   * Search institutions full-text
   */
  static async searchInstitutions(query, limit = 50) {
    const searchQuery = `
      SELECT
        id, name, type, city, region, latitude, longitude
      FROM public_entities
      WHERE is_published = TRUE
        AND (
          name ILIKE $1
          OR address ILIKE $1
          OR metadata->>'description' ILIKE $1
        )
      ORDER BY
        CASE
          WHEN name ILIKE $2 THEN 0
          WHEN name ILIKE $1 THEN 1
          ELSE 2
        END,
        name
      LIMIT $3
    `;

    const result = await pool.query(searchQuery, [
      `%${query}%`,
      `${query}%`,
      limit,
    ]);

    return result.rows;
  }

  /**
   * Get institutions by coordinates (for map)
   */
  static async getInstitutionsByBounds(minLat, maxLat, minLng, maxLng, type = null) {
    let query = `
      SELECT
        id, name, type, latitude, longitude, city, region,
        phone, website
      FROM public_entities
      WHERE is_published = TRUE
        AND latitude BETWEEN $1 AND $2
        AND longitude BETWEEN $3 AND $4
    `;

    const params = [minLat, maxLat, minLng, maxLng];

    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    query += ` ORDER BY name ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get GeoJSON for map visualization
   */
  static async getGeoJSON(filters = {}) {
    const institutions = await this.getInstitutions({ ...filters, limit: 10000 });

    const features = institutions
      .filter(inst => inst.latitude && inst.longitude)
      .map(inst => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [inst.longitude, inst.latitude],
        },
        properties: {
          id: inst.id,
          name: inst.name,
          type: inst.type,
          city: inst.city,
          region: inst.region,
          phone: inst.phone,
          website: inst.website,
        },
      }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  /**
   * Get statistics for public data
   */
  static async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_institutions,
        COUNT(DISTINCT dataset_id) as dataset_count,
        COUNT(DISTINCT type) as type_count,
        COUNT(DISTINCT region) as region_count,
        COUNT(DISTINCT city) as city_count,
        JSONB_OBJECT_AGG(type, count) as by_type
      FROM (
        SELECT type, COUNT(*) as count
        FROM public_entities
        WHERE is_published = TRUE
        GROUP BY type
      ) t
    `;

    const typeQuery = `
      SELECT
        type, COUNT(*) as count
      FROM public_entities
      WHERE is_published = TRUE
      GROUP BY type
      ORDER BY count DESC
    `;

    const regionQuery = `
      SELECT
        region, COUNT(*) as count
      FROM public_entities
      WHERE is_published = TRUE AND region IS NOT NULL
      GROUP BY region
      ORDER BY count DESC
    `;

    const [statsResult, typeResult, regionResult] = await Promise.all([
      pool.query(query),
      pool.query(typeQuery),
      pool.query(regionQuery),
    ]);

    return {
      total: statsResult.rows[0],
      by_type: typeResult.rows,
      by_region: regionResult.rows,
    };
  }

  /**
   * Export dataset as CSV
   */
  static async exportDataset(datasetId, format = 'csv') {
    const query = `
      SELECT
        id, name, type, address, postal_code, city, region,
        phone, email, website, latitude, longitude, status
      FROM public_entities
      WHERE dataset_id = $1 AND is_published = TRUE
      ORDER BY name
    `;

    const result = await pool.query(query, [datasetId]);

    if (format === 'csv') {
      return this.convertToCSV(result.rows);
    } else if (format === 'json') {
      return JSON.stringify(result.rows, null, 2);
    }

    return result.rows;
  }

  /**
   * Convert rows to CSV
   */
  static convertToCSV(rows) {
    if (rows.length === 0) return '';

    const headers = Object.keys(rows[0]);
    const csvHeaders = headers.join(',');

    const csvRows = rows.map(row =>
      headers
        .map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma or newline
          if (value === null || value === undefined) return '';
          const strValue = String(value).replace(/"/g, '""');
          return /[,\n"]/.test(strValue) ? `"${strValue}"` : strValue;
        })
        .join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Update dataset status
   */
  static async updateDatasetStatus(datasetId, status) {
    const query = `
      UPDATE public_datasets
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE dataset_id = $2
    `;

    await pool.query(query, [status, datasetId]);
  }

  /**
   * Archive dataset
   */
  static async archiveDataset(datasetId) {
    const query = `
      UPDATE public_entities
      SET status = 'archived', is_published = FALSE, archived_at = CURRENT_TIMESTAMP
      WHERE dataset_id = $1
    `;

    const result = await pool.query(query, [datasetId]);

    await this.updateDatasetStatus(datasetId, 'archived');

    logger.info(`Archived ${result.rowCount} entities for dataset ${datasetId}`, {
      meta: { datasetId },
    });

    return { archived_count: result.rowCount };
  }
}
