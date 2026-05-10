import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../database.js';
import logger from '../../core/utils/logger.js';

export class LinkingService {
  /**
   * Create automatic links for normalized entities
   */
  static async linkDataset(datasetId) {
    try {
      // Get all normalized entities
      const query = `
        SELECT id, type, city, region, metadata
        FROM public_entities
        WHERE dataset_id = $1 AND status = 'normalized'
        LIMIT 1000
      `;

      const result = await pool.query(query, [datasetId]);
      const entities = result.rows;

      let linkedCount = 0;

      for (const entity of entities) {
        try {
          // Create type-specific links
          await this.createTypeSpecificLinks(entity);

          // Create regional links
          if (entity.region) {
            await this.createRegionalLinks(entity);
          }

          // Create parent organization links if applicable
          if (entity.metadata?.parent_organization) {
            await this.createHierarchicalLinks(entity);
          }

          // Mark as linked
          await this.markAsLinked(entity.id);
          linkedCount++;
        } catch (err) {
          logger.warn(`Failed to link entity ${entity.id}`, {
            meta: { error: err.message },
          });
        }
      }

      logger.info(`Linked ${linkedCount} entities for dataset ${datasetId}`, {
        meta: { datasetId, linkedCount },
      });

      return { linked: linkedCount };
    } catch (err) {
      logger.error(`Linking failed for dataset ${datasetId}`, {
        meta: { error: err.message },
      });
      throw err;
    }
  }

  /**
   * Create type-specific automatic links
   */
  static async createTypeSpecificLinks(entity) {
    const links = [];

    switch (entity.type) {
      case 'hospital':
        links.push({
          attachment_type: 'map',
          target_id: 'healthcare-layer',
          relation_type: 'appears_on',
          confidence_score: 1.0,
        });
        links.push({
          attachment_type: 'feed',
          target_id: `healthcare-${entity.region}`,
          relation_type: 'featured_in',
          confidence_score: 0.95,
        });
        links.push({
          attachment_type: 'idea',
          target_id: `healthcare-ideas-${entity.region}`,
          relation_type: 'related_to',
          confidence_score: 0.8,
        });
        break;

      case 'school':
        links.push({
          attachment_type: 'map',
          target_id: 'education-layer',
          relation_type: 'appears_on',
          confidence_score: 1.0,
        });
        links.push({
          attachment_type: 'feed',
          target_id: `education-${entity.region}`,
          relation_type: 'featured_in',
          confidence_score: 0.95,
        });
        break;

      case 'deputy':
        links.push({
          attachment_type: 'politics',
          target_id: `region-${entity.region}`,
          relation_type: 'represents',
          confidence_score: 0.95,
        });
        links.push({
          attachment_type: 'idea',
          target_id: `politics-ideas-${entity.region}`,
          relation_type: 'related_to',
          confidence_score: 0.9,
        });
        break;

      case 'service':
        links.push({
          attachment_type: 'idea',
          target_id: `services-${entity.region}`,
          relation_type: 'related_to',
          confidence_score: 0.85,
        });
        break;

      case 'municipality':
        links.push({
          attachment_type: 'region',
          target_id: entity.region,
          relation_type: 'belongs_to',
          confidence_score: 0.95,
        });
        links.push({
          attachment_type: 'map',
          target_id: 'municipal-layer',
          relation_type: 'appears_on',
          confidence_score: 1.0,
        });
        break;
    }

    // Insert all links
    for (const link of links) {
      await this.createAttachment(entity.id, link);
    }
  }

  /**
   * Create regional links
   */
  static async createRegionalLinks(entity) {
    const attachments = [
      {
        attachment_type: 'region',
        target_id: entity.region,
        relation_type: 'located_in',
        confidence_score: 0.95,
      },
    ];

    for (const attachment of attachments) {
      await this.createAttachment(entity.id, attachment);
    }
  }

  /**
   * Create hierarchical parent-child links
   */
  static async createHierarchicalLinks(entity) {
    const metadata = entity.metadata;
    if (!metadata.parent_organization) return;

    // Find parent entity
    const parentQuery = `
      SELECT id FROM public_entities
      WHERE metadata->>'entity_id' = $1
      LIMIT 1
    `;

    try {
      const result = await pool.query(parentQuery, [metadata.parent_organization]);

      if (result.rows.length > 0) {
        const parentId = result.rows[0].id;

        await this.createAttachment(entity.id, {
          attachment_type: 'parent_entity',
          target_id: parentId,
          relation_type: 'child_of',
          confidence_score: 0.95,
        });

        // Also create reverse link (parent has children)
        await this.createAttachment(parentId, {
          attachment_type: 'child_entity',
          target_id: entity.id,
          relation_type: 'parent_of',
          confidence_score: 0.95,
        });
      }
    } catch (err) {
      logger.warn(`Failed to create hierarchical links for ${entity.id}`, {
        meta: { error: err.message },
      });
    }
  }

  /**
   * Create attachment/relationship
   */
  static async createAttachment(entityId, attachmentData) {
    const query = `
      INSERT INTO entity_attachments (
        id, entity_id, attachment_type, target_id, relation_type, confidence_score, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
    `;

    try {
      await pool.query(query, [
        uuidv4(),
        entityId,
        attachmentData.attachment_type,
        attachmentData.target_id,
        attachmentData.relation_type,
        attachmentData.confidence_score,
        JSON.stringify(attachmentData.metadata || {}),
      ]);
    } catch (err) {
      // Silently fail on duplicates
      logger.debug(`Attachment already exists for ${entityId}`, { meta: {} });
    }
  }

  /**
   * Mark entity as linked
   */
  static async markAsLinked(entityId) {
    const query = `
      UPDATE public_entities
      SET status = 'linked', updated_at = CURRENT_TIMESTAMP, updated_by = 'system'
      WHERE id = $1
    `;

    await pool.query(query, [entityId]);
  }

  /**
   * Get attachments for an entity
   */
  static async getAttachments(entityId) {
    const query = `
      SELECT id, attachment_type, target_id, relation_type, confidence_score
      FROM entity_attachments
      WHERE entity_id = $1
      ORDER BY confidence_score DESC
    `;

    const result = await pool.query(query, [entityId]);
    return result.rows;
  }

  /**
   * Search for entities by type and region
   */
  static async searchByTypeAndRegion(type, region = null, limit = 100) {
    let query = `
      SELECT id, name, type, city, region, latitude, longitude
      FROM public_entities
      WHERE type = $1 AND status IN ('linked', 'published')
    `;

    const params = [type];

    if (region) {
      query += ` AND region = $${params.length + 1}`;
      params.push(region);
    }

    query += ` LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get statistics for a dataset
   */
  static async getDatasetStatistics(datasetId) {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN status = 'linked' THEN 1 END) as linked,
        COUNT(CASE WHEN status = 'normalized' THEN 1 END) as normalized,
        COUNT(CASE WHEN status = 'raw' THEN 1 END) as raw,
        COUNT(DISTINCT type) as type_count
      FROM public_entities
      WHERE dataset_id = $1
    `;

    const result = await pool.query(query, [datasetId]);
    return result.rows[0];
  }
}
