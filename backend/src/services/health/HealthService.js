import { pool } from '../../database.js';
import { logger } from '../../middlewares/logger.js';

export class HealthService {
  /**
   * Get comprehensive health status
   */
  static async getHealth() {
    const startTime = Date.now();
    const memoryUsage = process.memoryUsage();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),

      // Database status
      database: await this.checkDatabase(),

      // Memory usage
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },

      // CPU info
      cpu: {
        usage: process.cpuUsage(),
      },

      // Response time
      responseTime: `${Date.now() - startTime}ms`,
    };
  }

  /**
   * Check database connectivity
   */
  static async checkDatabase() {
    try {
      // Try to execute a simple query
      const result = await pool.query('SELECT 1 as health_check');

      if (result && result.rows && result.rows[0]) {
        return {
          status: 'connected',
          type: 'postgresql',
        };
      }

      return {
        status: 'disconnected',
        type: 'postgresql',
        error: 'Query failed',
      };
    } catch (err) {
      logger.warn('Database health check failed', {
        meta: { error: err.message },
      });

      return {
        status: 'disconnected',
        type: 'postgresql',
        error: err.message,
      };
    }
  }

  /**
   * Check service readiness (all systems)
   */
  static async getReadiness() {
    try {
      const database = await this.checkDatabase();

      const ready = database.status === 'connected';

      return {
        ready,
        services: {
          database: database.status === 'connected',
        },
      };
    } catch (err) {
      logger.error('Readiness check failed', {
        meta: { error: err.message },
      });

      return {
        ready: false,
        services: {
          database: false,
        },
        error: err.message,
      };
    }
  }

  /**
   * Get liveness status (is service running?)
   */
  static async getLiveness() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }
}
