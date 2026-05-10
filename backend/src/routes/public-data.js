import express from 'express';
import { IngestionService, NormalizationService, LinkingService, PublicationService } from '../services/pde/index.js';
import logger from '../core/utils/logger.js';

const router = express.Router();

/**
 * POST /api/v1/public-data/import
 * Import raw data from any source
 */
router.post('/import', async (req, res) => {
  try {
    const { dataset_name, type, source_name, source_url, description, data, reliability } = req.body;

    if (!dataset_name || !type || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: dataset_name, type, data array',
      });
    }

    const result = await IngestionService.ingest({
      dataset_name,
      type,
      source_name,
      source_url,
      description,
      data,
      reliability: reliability || 'trusted',
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Import endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/public-data/normalize/:dataset_id
 * Normalize raw entities for a dataset
 */
router.post('/normalize/:dataset_id', async (req, res) => {
  try {
    const { dataset_id } = req.params;

    const result = await NormalizationService.normalizeDataset(dataset_id);

    res.json({
      success: true,
      data: {
        dataset_id,
        status: 'normalizing',
        normalized_count: result.normalized,
      },
    });
  } catch (err) {
    logger.error('Normalize endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/public-data/link/:dataset_id
 * Create automatic links for normalized entities
 */
router.post('/link/:dataset_id', async (req, res) => {
  try {
    const { dataset_id } = req.params;

    const result = await LinkingService.linkDataset(dataset_id);

    res.json({
      success: true,
      data: {
        dataset_id,
        status: 'linking',
        linked_count: result.linked,
      },
    });
  } catch (err) {
    logger.error('Link endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/public-data/publish/:dataset_id
 * Publish linked entities
 */
router.post('/publish/:dataset_id', async (req, res) => {
  try {
    const { dataset_id } = req.params;

    const result = await PublicationService.publishDataset(dataset_id);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Publish endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/public-data/datasets
 * List all datasets
 */
router.get('/datasets', async (req, res) => {
  try {
    const datasets = await IngestionService.listDatasets();

    res.json({
      success: true,
      data: datasets,
    });
  } catch (err) {
    logger.error('List datasets endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/public-data/datasets/:dataset_id
 * Get dataset status
 */
router.get('/datasets/:dataset_id', async (req, res) => {
  try {
    const { dataset_id } = req.params;

    const dataset = await IngestionService.getDatasetStatus(dataset_id);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: 'Dataset not found',
      });
    }

    res.json({
      success: true,
      data: dataset,
    });
  } catch (err) {
    logger.error('Get dataset endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/public-data/institutions
 * Get public institutions with optional filters
 */
router.get('/institutions', async (req, res) => {
  try {
    const { type, region, city, search, limit = 20, offset = 0 } = req.query;

    const institutions = await PublicationService.getInstitutions({
      type,
      region,
      city,
      search,
      limit: Math.min(parseInt(limit) || 20, 100),
      offset: parseInt(offset) || 0,
    });

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM public_entities WHERE is_published = TRUE`;
    const countResult = await require('../database.js').pool.query(countQuery);

    res.json({
      success: true,
      data: institutions,
      total: countResult.rows[0].total,
      limit: limit,
      offset: offset,
    });
  } catch (err) {
    logger.error('Get institutions endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/public-data/institutions/:id
 * Get institution detail with attachments
 */
router.get('/institutions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const institution = await PublicationService.getInstitutionWithAttachments(id);

    if (!institution) {
      return res.status(404).json({
        success: false,
        error: 'Institution not found',
      });
    }

    res.json({
      success: true,
      data: institution,
    });
  } catch (err) {
    logger.error('Get institution endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/public-data/institutions/search
 * Search institutions by name or address
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 2 characters',
      });
    }

    const results = await PublicationService.searchInstitutions(q, Math.min(parseInt(limit) || 50, 200));

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (err) {
    logger.error('Search endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/public-data/map/geojson
 * Get GeoJSON for map visualization
 */
router.get('/map/geojson', async (req, res) => {
  try {
    const { type, region, city } = req.query;

    const geojson = await PublicationService.getGeoJSON({ type, region, city });

    res.json(geojson);
  } catch (err) {
    logger.error('GeoJSON endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/public-data/map/bounds
 * Get institutions within geographic bounds
 */
router.get('/map/bounds', async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng, type } = req.query;

    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({
        success: false,
        error: 'Missing bounds parameters: minLat, maxLat, minLng, maxLng',
      });
    }

    const institutions = await PublicationService.getInstitutionsByBounds(
      parseFloat(minLat),
      parseFloat(maxLat),
      parseFloat(minLng),
      parseFloat(maxLng),
      type
    );

    res.json({
      success: true,
      data: institutions,
      count: institutions.length,
    });
  } catch (err) {
    logger.error('Map bounds endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/public-data/statistics
 * Get public data statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await PublicationService.getStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    logger.error('Statistics endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/v1/public-data/export/:dataset_id
 * Export dataset as CSV or JSON
 */
router.get('/export/:dataset_id', async (req, res) => {
  try {
    const { dataset_id } = req.params;
    const { format = 'csv' } = req.query;

    const data = await PublicationService.exportDataset(dataset_id, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${dataset_id}.csv"`);
      res.send(data);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${dataset_id}.json"`);
      res.send(data);
    }
  } catch (err) {
    logger.error('Export endpoint error', { meta: { error: err.message } });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
