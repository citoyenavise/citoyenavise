import { pool } from '../../database.js';
import logger from '../../core/utils/logger.js';

export class NormalizationService {
  /**
   * Normalize raw entities to standard format
   */
  static async normalizeDataset(datasetId) {
    try {
      // Get all raw entities for this dataset
      const query = `
        SELECT id, metadata, created_at
        FROM public_entities
        WHERE dataset_id = $1 AND status = 'raw'
        LIMIT 1000
      `;

      const result = await pool.query(query, [datasetId]);
      const entities = result.rows;

      if (entities.length === 0) {
        logger.info(`No raw entities to normalize for dataset ${datasetId}`, { meta: {} });
        return { normalized: 0 };
      }

      let normalizedCount = 0;

      for (const entity of entities) {
        try {
          const rawData = entity.metadata;

          // Normalize fields
          const normalizedData = {
            // Required fields
            name: this.normalizeField(rawData.name || rawData.titre || rawData.title || ''),
            type: this.normalizeType(rawData.type),

            // Address components
            address: rawData.address || rawData.adresse || '',
            postal_code: this.normalizePostalCode(rawData.postal_code || rawData.code_postal || ''),
            city: this.normalizeCity(rawData.city || rawData.ville || rawData.municipality || ''),
            region: rawData.region || rawData.province || '',

            // Contact
            phone: rawData.phone || rawData.telephone || '',
            email: rawData.email || '',
            website: rawData.website || rawData.url || '',

            // Classification
            category: this.normalizeCategory(rawData.category || rawData.categorie),
            jurisdiction: rawData.jurisdiction || 'provincial',

            // Metadata
            metadata: {
              ...rawData,
              budget: rawData.budget || null,
              employees: rawData.employees || null,
              capacity: rawData.capacity || null,
              services: Array.isArray(rawData.services) ? rawData.services : [],
              official_status: this.normalizeStatus(rawData.official_status || 'active'),
            },
          };

          // Geocode if address present
          if (normalizedData.address && normalizedData.city) {
            const coords = await this.geocodeAddress(
              normalizedData.address,
              normalizedData.city,
              normalizedData.region
            );
            if (coords) {
              normalizedData.latitude = coords.lat;
              normalizedData.longitude = coords.lng;
              normalizedData.location_accuracy = coords.accuracy;
            }
          }

          // Update entity with normalized data
          await this.updateNormalizedEntity(entity.id, normalizedData);
          normalizedCount++;
        } catch (err) {
          logger.warn(`Failed to normalize entity ${entity.id}`, {
            meta: { error: err.message },
          });
        }
      }

      logger.info(`Normalized ${normalizedCount} entities for dataset ${datasetId}`, {
        meta: { datasetId },
      });

      return { normalized: normalizedCount };
    } catch (err) {
      logger.error(`Normalization failed for dataset ${datasetId}`, {
        meta: { error: err.message },
      });
      throw err;
    }
  }

  /**
   * Normalize text field (trim, case)
   */
  static normalizeField(value) {
    if (!value) return '';
    return String(value).trim().charAt(0).toUpperCase() + String(value).trim().slice(1).toLowerCase();
  }

  /**
   * Normalize type enum
   */
  static normalizeType(type) {
    const typeMap = {
      hospital: 'hospital',
      hopital: 'hospital',
      school: 'school',
      école: 'school',
      ecole: 'school',
      deputy: 'deputy',
      deputé: 'deputy',
      depute: 'deputy',
      service: 'service',
      institution: 'institution',
      municipality: 'municipality',
      municipalité: 'municipality',
    };

    const normalized = String(type).toLowerCase().trim();
    return typeMap[normalized] || 'institution';
  }

  /**
   * Normalize postal code
   */
  static normalizePostalCode(postalCode) {
    if (!postalCode) return null;
    // Canadian format: A1A 1A1
    return String(postalCode).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  /**
   * Normalize city name
   */
  static normalizeCity(city) {
    if (!city) return '';
    // Canonical city names mapping
    const cityMap = {
      mtl: 'Montreal',
      qc: 'Quebec City',
      toronto: 'Toronto',
      calgary: 'Calgary',
      vancouver: 'Vancouver',
    };

    const normalized = String(city).toLowerCase().trim();
    return cityMap[normalized] || this.normalizeField(city);
  }

  /**
   * Normalize category enum
   */
  static normalizeCategory(category) {
    const validCategories = ['public', 'private', 'non_profit'];
    const normalized = String(category || 'public').toLowerCase();
    return validCategories.includes(normalized) ? normalized : 'public';
  }

  /**
   * Normalize official status
   */
  static normalizeStatus(status) {
    const statusMap = {
      active: 'active',
      actif: 'active',
      open: 'active',
      ouvert: 'active',
      inactive: 'inactive',
      inactif: 'inactive',
      closed: 'closed',
      fermé: 'closed',
      ferme: 'closed',
    };

    const normalized = String(status).toLowerCase();
    return statusMap[normalized] || 'active';
  }

  /**
   * Geocode address (mock implementation)
   * In production, integrate with Google Maps / Mapbox API
   */
  static async geocodeAddress(address, city, region) {
    try {
      // Mock geocoding - in production use real API
      // For now, just return null to skip geocoding
      return null;

      /*
      // Example: Google Maps Geocoding API
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) return null;

      const fullAddress = `${address}, ${city}, ${region}, Canada`;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (data.results.length === 0) return null;

      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        accuracy: 'address',
      };
      */
    } catch (err) {
      logger.warn(`Geocoding failed for ${address}`, { meta: { error: err.message } });
      return null;
    }
  }

  /**
   * Update entity with normalized data
   */
  static async updateNormalizedEntity(entityId, normalizedData) {
    const query = `
      UPDATE public_entities
      SET
        name = $1,
        type = $2,
        address = $3,
        postal_code = $4,
        city = $5,
        region = $6,
        phone = $7,
        email = $8,
        website = $9,
        category = $10,
        jurisdiction = $11,
        latitude = $12,
        longitude = $13,
        location_accuracy = $14,
        metadata = $15,
        status = 'normalized',
        updated_at = CURRENT_TIMESTAMP,
        updated_by = 'system'
      WHERE id = $16
    `;

    await pool.query(query, [
      normalizedData.name,
      normalizedData.type,
      normalizedData.address,
      normalizedData.postal_code,
      normalizedData.city,
      normalizedData.region,
      normalizedData.phone,
      normalizedData.email,
      normalizedData.website,
      normalizedData.category,
      normalizedData.jurisdiction,
      normalizedData.latitude,
      normalizedData.longitude,
      normalizedData.location_accuracy,
      JSON.stringify(normalizedData.metadata),
      entityId,
    ]);
  }

  /**
   * Get normalization rules for a dataset
   */
  static async getNormalizationRules(datasetId) {
    const query = `
      SELECT id, source_field, target_field, transformation_rule
      FROM normalization_rules
      WHERE dataset_id = $1 AND is_active = TRUE
    `;

    const result = await pool.query(query, [datasetId]);
    return result.rows;
  }

  /**
   * Create normalization rule
   */
  static async createNormalizationRule(datasetId, sourceField, targetField, transformationRule) {
    const query = `
      INSERT INTO normalization_rules (dataset_id, source_field, target_field, transformation_rule)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (dataset_id, source_field) DO UPDATE
      SET transformation_rule = $4, updated_at = CURRENT_TIMESTAMP
    `;

    await pool.query(query, [datasetId, sourceField, targetField, JSON.stringify(transformationRule)]);
  }
}
