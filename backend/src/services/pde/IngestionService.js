import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../database.js';
import logger from '../../core/utils/logger.js';

export class IngestionService {
  /**
   * Ingest raw data from any source
   */
  static async ingest(options) {
    const {
      dataset_name,
      type,
      source_name,
      source_url,
      description,
      data,
      reliability = 'trusted',
    } = options;

    try {
      // Validate input
      if (!dataset_name || !type || !data || !Array.isArray(data)) {
        throw new Error('Invalid ingestion payload');
      }

      // Create dataset record
      const datasetId = await this.createDataset({
        dataset_id: dataset_name,
        name: dataset_name,
        description,
        type,
        source_name,
        source_url,
        source_reliability: reliability,
        total_records: data.length,
      });

      // Create import job
      const jobId = await this.createImportJob(dataset_name, data.length);

      // Store raw data asynchronously
      this.processDataAsync(datasetId, dataset_name, data, jobId);

      logger.info(`Ingestion started for dataset ${dataset_name}`, {
        meta: {
          datasetId,
          jobId,
          recordCount: data.length,
        },
      });

      return {
        dataset_id: dataset_name,
        status: 'importing',
        imported_count: 0,
        total_count: data.length,
        processing_job_id: jobId,
        estimated_completion: '2 minutes',
      };
    } catch (err) {
      logger.error('Ingestion failed', {
        meta: {
          dataset_name,
          error: err.message,
        },
      });
      throw err;
    }
  }

  /**
   * Create dataset record in database
   */
  static async createDataset(datasetData) {
    const query = `
      INSERT INTO public_datasets (
        dataset_id, name, description, type, source_name,
        source_url, source_reliability, total_records, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (dataset_id) DO UPDATE
      SET updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;

    const result = await pool.query(query, [
      datasetData.dataset_id,
      datasetData.name,
      datasetData.description,
      datasetData.type,
      datasetData.source_name,
      datasetData.source_url,
      datasetData.source_reliability,
      datasetData.total_records,
      'importing',
    ]);

    return result.rows[0].id;
  }

  /**
   * Create import job for tracking
   */
  static async createImportJob(datasetId, totalRecords) {
    const jobId = uuidv4();
    const query = `
      INSERT INTO import_jobs (id, dataset_id, total_records, status, estimated_completion)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '2 minutes')
      RETURNING id
    `;

    await pool.query(query, [jobId, datasetId, totalRecords, 'processing']);
    return jobId;
  }

  /**
   * Process data asynchronously
   */
  static processDataAsync(datasetId, datasetName, data, jobId) {
    setImmediate(async () => {
      try {
        let successCount = 0;
        let failureCount = 0;

        for (const record of data) {
          try {
            // Store raw record as-is
            await this.storeRawRecord(datasetName, record);
            successCount++;

            // Update job progress every 100 records
            if (successCount % 100 === 0) {
              await this.updateJobProgress(jobId, successCount, failureCount);
            }
          } catch (err) {
            failureCount++;
            logger.warn(`Failed to ingest record in ${datasetName}`, {
              meta: { error: err.message },
            });
          }
        }

        // Mark job complete
        await this.completeImportJob(jobId, successCount, failureCount);

        // Trigger normalization
        await this.triggerNormalization(datasetName);

        logger.info(`Ingestion complete for ${datasetName}`, {
          meta: {
            success: successCount,
            failed: failureCount,
          },
        });
      } catch (err) {
        logger.error(`Async ingestion failed for ${datasetName}`, {
          meta: { error: err.message },
        });
        await this.failImportJob(jobId, err.message);
      }
    });
  }

  /**
   * Store raw record in database
   */
  static async storeRawRecord(datasetName, record) {
    const entityId = uuidv4();
    const query = `
      INSERT INTO public_entities (
        id, dataset_id, entity_id, name, status, metadata, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    // Extract name if available
    const name = record.name || record.titre || record.title || `Entity-${entityId}`;

    await pool.query(query, [
      entityId,
      datasetName,
      record.id || entityId,
      name,
      'raw',
      JSON.stringify(record), // Store entire raw record as JSON
      'system',
    ]);
  }

  /**
   * Update import job progress
   */
  static async updateJobProgress(jobId, processed, failed) {
    const query = `
      UPDATE import_jobs
      SET processed_records = $1, failed_records = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;

    await pool.query(query, [processed, failed, jobId]);
  }

  /**
   * Complete import job
   */
  static async completeImportJob(jobId, successCount, failureCount) {
    const query = `
      UPDATE import_jobs
      SET status = 'completed',
          processed_records = $1,
          failed_records = $2,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;

    await pool.query(query, [successCount, failureCount, jobId]);
  }

  /**
   * Mark import job as failed
   */
  static async failImportJob(jobId, errorMessage) {
    const query = `
      UPDATE import_jobs
      SET status = 'failed', error_message = $1, completed_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await pool.query(query, [errorMessage, jobId]);
  }

  /**
   * Trigger normalization after ingestion
   */
  static async triggerNormalization(datasetName) {
    // This will be called by the NormalizationService
    // For now, just log that normalization should happen
    logger.info(`Normalization triggered for ${datasetName}`, { meta: {} });
  }

  /**
   * Get dataset status
   */
  static async getDatasetStatus(datasetId) {
    const query = `
      SELECT id, dataset_id, name, type, total_records, imported_records,
             processed_records, status, created_at
      FROM public_datasets
      WHERE dataset_id = $1
    `;

    const result = await pool.query(query, [datasetId]);
    return result.rows[0] || null;
  }

  /**
   * List all datasets
   */
  static async listDatasets() {
    const query = `
      SELECT id, dataset_id, name, type, source_name, total_records,
             imported_records, processed_records, status, created_at, updated_at
      FROM public_datasets
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }
}
