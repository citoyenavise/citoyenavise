/**
 * Health Check Endpoints
 * Used by Render.com, load balancers, Kubernetes probes, monitoring systems
 *
 * Standards:
 * - GET /health → Full health status (all details)
 * - GET /health/ready → Readiness probe (Kubernetes)
 * - GET /health/live → Liveness probe (Kubernetes)
 */

import express from 'express';
import { HealthService } from '../services/health/HealthService.js';
import { logger } from '../middlewares/logger.js';

const router = express.Router();

/**
 * GET /health
 *
 * Full health check with all details
 * Used by: Render.com, monitoring systems, dashboards
 *
 * Response (200 OK):
 * {
 *   "status": "ok",
 *   "timestamp": "2026-05-10T15:30:00.123Z",
 *   "uptime": 3600,
 *   "database": { "status": "connected", "type": "postgresql" },
 *   "memory": {
 *     "heapUsed": 45,
 *     "heapTotal": 128,
 *     "rss": 156,
 *     "external": 2
 *   },
 *   "cpu": { "user": 1200, "system": 300 },
 *   "responseTime": "2ms"
 * }
 */
router.get('/', async (req, res) => {
  try {
    const health = await HealthService.getHealth();

    // Return 200 if all systems OK with service name
    res.status(200).json({
      service: 'citoyenavise-api',
      ...health,
    });
  } catch (err) {
    logger.error('Health check failed', {
      meta: { error: err.message },
    });

    res.status(503).json({
      service: 'citoyenavise-api',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: err.message,
    });
  }
});

/**
 * GET /health/ready
 *
 * Readiness probe for Kubernetes/orchestration
 * Returns 200 when service is ready to accept traffic
 * Returns 503 when not ready (DB not connected, etc)
 *
 * Used by: Kubernetes readinessProbe, load balancers
 */
router.get('/ready', async (req, res) => {
  try {
    const readiness = await HealthService.getReadiness();

    if (readiness.ready) {
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        services: readiness.services,
      });
    }
  } catch (err) {
    logger.error('Readiness check failed', {
      meta: { error: err.message },
    });

    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: err.message,
    });
  }
});

/**
 * GET /health/live
 *
 * Liveness probe for Kubernetes/orchestration
 * Returns 200 if service is running (not hung)
 * Returns 503 if service is down
 *
 * Used by: Kubernetes livenessProbe (for container restart decisions)
 */
router.get('/live', async (req, res) => {
  try {
    const liveness = await HealthService.getLiveness();

    res.status(200).json(liveness);
  } catch (err) {
    logger.error('Liveness check failed', {
      meta: { error: err.message },
    });

    res.status(503).json({
      alive: false,
      timestamp: new Date().toISOString(),
      error: err.message,
    });
  }
});

export default router;
