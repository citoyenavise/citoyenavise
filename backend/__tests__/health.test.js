/**
 * Tests pour les Health Check Endpoints
 */

import { describe, it, expect } from '@jest/globals';
import { HealthService } from '../src/services/health/HealthService.js';

describe('Health Check Endpoints', () => {
  describe('HealthService.getHealth()', () => {
    it('should return health status with all required fields', async () => {
      const health = await HealthService.getHealth();

      expect(health).toBeDefined();
      expect(health.status).toBe('ok');
      expect(health.timestamp).toBeDefined();
      expect(health.uptime).toBeGreaterThan(0);
      expect(health.responseTime).toBeDefined();
    });

    it('should include memory metrics', async () => {
      const health = await HealthService.getHealth();

      expect(health.memory).toBeDefined();
      expect(health.memory.heapUsed).toBeGreaterThan(0);
      expect(health.memory.heapTotal).toBeGreaterThan(0);
      expect(health.memory.rss).toBeGreaterThan(0);
    });

    it('should include CPU metrics', async () => {
      const health = await HealthService.getHealth();

      expect(health.cpu).toBeDefined();
      expect(health.cpu.usage).toBeDefined();
    });

    it('should check database status', async () => {
      const health = await HealthService.getHealth();

      expect(health.database).toBeDefined();
      expect(health.database.status).toMatch(/^(connected|disconnected)$/);
      expect(health.database.type).toBe('postgresql');
    });

    it('should have reasonable response time', async () => {
      const health = await HealthService.getHealth();

      // Response time should be in milliseconds
      expect(health.responseTime).toMatch(/^\d+ms$/);
    });
  });

  describe('HealthService.checkDatabase()', () => {
    it('should return database status object', async () => {
      const dbStatus = await HealthService.checkDatabase();

      expect(dbStatus).toBeDefined();
      expect(dbStatus.status).toMatch(/^(connected|disconnected)$/);
      expect(dbStatus.type).toBe('postgresql');
    });

    it('should indicate error if connection fails', async () => {
      const dbStatus = await HealthService.checkDatabase();

      if (dbStatus.status === 'disconnected') {
        expect(dbStatus.error).toBeDefined();
      }
    });
  });

  describe('HealthService.getReadiness()', () => {
    it('should return readiness status', async () => {
      const readiness = await HealthService.getReadiness();

      expect(readiness).toBeDefined();
      expect(readiness.ready).toBeDefined();
      expect(typeof readiness.ready).toBe('boolean');
    });

    it('should include services status', async () => {
      const readiness = await HealthService.getReadiness();

      expect(readiness.services).toBeDefined();
      expect(readiness.services.database).toBeDefined();
    });

    it('should be ready when database is connected', async () => {
      const readiness = await HealthService.getReadiness();

      if (readiness.services.database) {
        expect(readiness.ready).toBe(true);
      }
    });

    it('should not be ready when database is disconnected', async () => {
      const readiness = await HealthService.getReadiness();

      if (!readiness.services.database) {
        expect(readiness.ready).toBe(false);
      }
    });
  });

  describe('HealthService.getLiveness()', () => {
    it('should return liveness status', async () => {
      const liveness = await HealthService.getLiveness();

      expect(liveness).toBeDefined();
      expect(liveness.alive).toBe(true);
      expect(liveness.timestamp).toBeDefined();
      expect(liveness.uptime).toBeGreaterThan(0);
    });

    it('should always be alive when called', async () => {
      const liveness = await HealthService.getLiveness();

      expect(liveness.alive).toBe(true);
    });
  });

  describe('Memory Thresholds', () => {
    it('should show heap used less than heap total', async () => {
      const health = await HealthService.getHealth();

      expect(health.memory.heapUsed).toBeLessThanOrEqual(
        health.memory.heapTotal
      );
    });

    it('should warn if heap usage > 80%', async () => {
      const health = await HealthService.getHealth();
      const heapPercentage =
        (health.memory.heapUsed / health.memory.heapTotal) * 100;

      if (heapPercentage > 80) {
        console.warn(`⚠️  High heap usage: ${heapPercentage.toFixed(2)}%`);
      }

      expect(heapPercentage).toBeLessThan(99); // Should never be at max
    });
  });

  describe('Uptime Tracking', () => {
    it('should increase over time', async () => {
      const health1 = await HealthService.getHealth();

      // Wait 100ms
      await new Promise((resolve) => setTimeout(resolve, 100));

      const health2 = await HealthService.getHealth();

      expect(health2.uptime).toBeGreaterThanOrEqual(health1.uptime);
    });
  });
});
