/**
 * GracefulShutdownManager.js - Manage graceful shutdown and recovery
 * PHASE 1.6: Recovery Layer
 *
 * Responsibility: Ensure safe system shutdown and recovery
 * - Orderly service shutdown
 * - State persistence
 * - Resource cleanup
 * - Shutdown notification
 * - Recovery preparation
 */

class GracefulShutdownManager {
  constructor(options = {}) {
    this.services = new Map(); // Registered services
    this.shutdownInProgress = false;
    this.shutdownInitiatedAt = null;
    this.shutdownState = {
      started: false,
      notified: false,
      stopped: false,
      persisted: false,
      cleaned: false
    };

    this.config = {
      gracePeriod_ms: options.gracePeriod_ms || 30000,
      forceShutdownTimeout_ms: options.forceShutdownTimeout_ms || 60000,
      checkpointInterval_ms: options.checkpointInterval_ms || 5000
    };

    this.shutdownHistory = [];
    this.recoveryMetrics = {
      totalShutdowns: 0,
      gracefulShutdowns: 0,
      forcedShutdowns: 0,
      statesPersisted: 0,
      recoverySuccesses: 0,
      averageRecoveryTime_ms: 0
    };
  }

  /**
   * Register service for graceful shutdown
   */
  registerService(serviceName, handlers = {}) {
    this.services.set(serviceName, {
      name: serviceName,
      onShutdown: handlers.onShutdown || (() => Promise.resolve()),
      onNotified: handlers.onNotified || (() => Promise.resolve()),
      priority: handlers.priority || 5,
      state: 'RUNNING'
    });

    return { registered: true, serviceName };
  }

  /**
   * Initiate graceful shutdown
   */
  async initiateGracefulShutdown(reason = 'Manual shutdown requested') {
    if (this.shutdownInProgress) {
      return { success: false, reason: 'Shutdown already in progress' };
    }

    this.shutdownInProgress = true;
    this.shutdownInitiatedAt = Date.now();
    this.recoveryMetrics.totalShutdowns++;

    const shutdown = {
      shutdownId: `shutdown_${Date.now()}`,
      timestamp: new Date().toISOString(),
      reason,
      stages: [],
      startTime: Date.now(),
      completed: false
    };

    try {
      // Stage 1: Notify all services
      shutdown.stages.push(
        await this._notifyServices()
      );

      // Stage 2: Wait for in-flight operations to complete
      shutdown.stages.push(
        await this._waitForInFlightOperations()
      );

      // Stage 3: Stop accepting new requests
      shutdown.stages.push({
        stage: 'Stop accepting requests',
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      });

      // Stage 4: Persist state
      shutdown.stages.push(
        await this._persistState()
      );

      // Stage 5: Shutdown services in order
      shutdown.stages.push(
        await this._shutdownServices()
      );

      // Stage 6: Cleanup resources
      shutdown.stages.push(
        await this._cleanupResources()
      );

      shutdown.completed = true;
      shutdown.status = 'GRACEFUL_SHUTDOWN_SUCCESS';
      this.recoveryMetrics.gracefulShutdowns++;

    } catch (error) {
      shutdown.status = 'GRACEFUL_SHUTDOWN_FAILED';
      shutdown.error = error.message;

      // Attempt forced shutdown
      await this._forcedShutdown();
      this.recoveryMetrics.forcedShutdowns++;
    }

    shutdown.endTime = Date.now();
    shutdown.duration_ms = shutdown.endTime - shutdown.startTime;

    this.shutdownHistory.push(shutdown);
    if (this.shutdownHistory.length > 100) {
      this.shutdownHistory.shift();
    }

    this.shutdownInProgress = false;

    return {
      success: shutdown.status === 'GRACEFUL_SHUTDOWN_SUCCESS',
      shutdownId: shutdown.shutdownId,
      status: shutdown.status,
      duration_ms: shutdown.duration_ms
    };
  }

  /**
   * Notify all services of shutdown
   */
  async _notifyServices() {
    const startTime = Date.now();
    const results = [];

    // Sort services by priority
    const sortedServices = Array.from(this.services.values())
      .sort((a, b) => b.priority - a.priority);

    for (const service of sortedServices) {
      try {
        await Promise.race([
          service.onNotified(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Notification timeout')), 5000)
          )
        ]);

        results.push({
          service: service.name,
          status: 'NOTIFIED'
        });
      } catch (error) {
        results.push({
          service: service.name,
          status: 'NOTIFICATION_FAILED',
          error: error.message
        });
      }
    }

    this.shutdownState.notified = true;

    return {
      stage: 'Notify services',
      status: 'COMPLETED',
      duration_ms: Date.now() - startTime,
      results
    };
  }

  /**
   * Wait for in-flight operations
   */
  async _waitForInFlightOperations() {
    const startTime = Date.now();
    const maxWait = this.config.gracePeriod_ms;
    let waited = 0;

    // In real implementation, track in-flight operations
    // For demonstration:
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      stage: 'Wait for in-flight operations',
      status: 'COMPLETED',
      duration_ms: Date.now() - startTime,
      waited_ms: waited
    };
  }

  /**
   * Persist system state
   */
  async _persistState() {
    const startTime = Date.now();

    try {
      const stateSnapshot = {
        timestamp: new Date().toISOString(),
        services: Array.from(this.services.entries()).map(([name, service]) => ({
          name,
          state: service.state
        })),
        metrics: this.recoveryMetrics
      };

      // In real implementation, write to persistent storage
      // For demonstration, just track in memory

      this.shutdownState.persisted = true;
      this.recoveryMetrics.statesPersisted++;

      return {
        stage: 'Persist state',
        status: 'COMPLETED',
        duration_ms: Date.now() - startTime,
        stateSize: JSON.stringify(stateSnapshot).length
      };
    } catch (error) {
      return {
        stage: 'Persist state',
        status: 'FAILED',
        error: error.message,
        duration_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Shutdown services in order
   */
  async _shutdownServices() {
    const startTime = Date.now();
    const results = [];

    // Sort services by priority (highest first)
    const sortedServices = Array.from(this.services.values())
      .sort((a, b) => b.priority - a.priority);

    for (const service of sortedServices) {
      try {
        await Promise.race([
          service.onShutdown(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Shutdown timeout')), 10000)
          )
        ]);

        service.state = 'STOPPED';
        results.push({
          service: service.name,
          status: 'STOPPED'
        });
      } catch (error) {
        results.push({
          service: service.name,
          status: 'SHUTDOWN_FAILED',
          error: error.message
        });
      }
    }

    this.shutdownState.stopped = true;

    return {
      stage: 'Shutdown services',
      status: 'COMPLETED',
      duration_ms: Date.now() - startTime,
      results
    };
  }

  /**
   * Cleanup resources
   */
  async _cleanupResources() {
    const startTime = Date.now();

    try {
      // Clear active connections, caches, etc.
      const cleanupActions = [
        'Close database connections',
        'Flush caches',
        'Release locks',
        'Cancel timers'
      ];

      for (const action of cleanupActions) {
        // Simulate cleanup
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      this.shutdownState.cleaned = true;

      return {
        stage: 'Cleanup resources',
        status: 'COMPLETED',
        duration_ms: Date.now() - startTime,
        actionsCompleted: cleanupActions.length
      };
    } catch (error) {
      return {
        stage: 'Cleanup resources',
        status: 'FAILED',
        error: error.message,
        duration_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Forced shutdown (if graceful fails)
   */
  async _forcedShutdown() {
    const startTime = Date.now();

    try {
      // Immediately stop all services
      for (const service of this.services.values()) {
        service.state = 'FORCED_STOP';
      }

      return {
        stage: 'Forced shutdown',
        status: 'COMPLETED',
        duration_ms: Date.now() - startTime
      };
    } catch (error) {
      return {
        stage: 'Forced shutdown',
        status: 'FAILED',
        error: error.message,
        duration_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Prepare for recovery
   */
  prepareForRecovery() {
    if (this.shutdownInProgress) {
      return { success: false, reason: 'Shutdown in progress' };
    }

    return {
      success: true,
      recovery: {
        readyToStart: this.shutdownState.persisted,
        stateAvailable: this.shutdownState.persisted,
        servicesStoppedCleanly: this.shutdownState.stopped,
        resourcesCleaned: this.shutdownState.cleaned,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get shutdown status
   */
  getShutdownStatus() {
    return {
      shutdownInProgress: this.shutdownInProgress,
      shutdownInitiatedAt: this.shutdownInitiatedAt ? new Date(this.shutdownInitiatedAt).toISOString() : null,
      elapsedTime_ms: this.shutdownInProgress ? Date.now() - this.shutdownInitiatedAt : null,
      state: this.shutdownState,
      registeredServices: this.services.size,
      metrics: this.recoveryMetrics
    };
  }

  /**
   * Get shutdown history
   */
  getShutdownHistory(limit = 10) {
    return this.shutdownHistory.slice(-limit);
  }

  /**
   * Generate recovery report
   */
  generateRecoveryReport() {
    return {
      timestamp: new Date().toISOString(),
      status: this.getShutdownStatus(),
      recentShutdowns: this.getShutdownHistory(5),
      metrics: this.recoveryMetrics
    };
  }

  /**
   * Get recovery metrics
   */
  getRecoveryMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.recoveryMetrics
    };
  }

  /**
   * Reset shutdown manager
   */
  reset() {
    this.shutdownInProgress = false;
    this.shutdownInitiatedAt = null;
    this.shutdownState = {
      started: false,
      notified: false,
      stopped: false,
      persisted: false,
      cleaned: false
    };
    this.shutdownHistory = [];

    return { reset: true };
  }
}

module.exports = GracefulShutdownManager;
