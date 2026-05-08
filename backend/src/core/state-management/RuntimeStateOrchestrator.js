/**
 * RuntimeStateOrchestrator.js - Orchestrate runtime system state
 * State Management Layer
 *
 * Responsibility: Manage system state transitions and lifecycle
 * - Track module and service states
 * - Coordinate state transitions
 * - Enforce state invariants
 * - Maintain state consistency
 * - Provide state visibility
 */

class RuntimeStateOrchestrator {
  constructor(options = {}) {
    this.stateMap = new Map();
    this.stateHistory = [];
    this.transitionRules = new Map();
    this.globalState = 'INITIALIZING';

    this.stateDefinitions = {
      MODULE: {
        UNINITIALIZED: 0,
        INITIALIZING: 1,
        READY: 2,
        DEGRADED: 3,
        FAILED: 4,
        RECOVERING: 5,
        STOPPED: 6
      },
      SERVICE: {
        DOWN: 0,
        STARTING: 1,
        HEALTHY: 2,
        UNHEALTHY: 3,
        DEGRADED: 4,
        RECOVERING: 5,
        STOPPING: 6
      },
      SYSTEM: {
        INITIALIZING: 0,
        BOOTING: 1,
        READY: 2,
        DEGRADED: 3,
        CRITICAL: 4,
        RECOVERING: 5,
        SHUTTING_DOWN: 6,
        STOPPED: 7
      }
    };

    this.config = {
      maxStateHistorySize: options.maxStateHistorySize || 10000,
      stateTransitionTimeout_ms: options.stateTransitionTimeout_ms || 5000,
      degradationThreshold: options.degradationThreshold || 0.3
    };

    this.metrics = {
      totalTransitions: 0,
      successfulTransitions: 0,
      failedTransitions: 0,
      averageTransitionTime_ms: 0
    };

    this._initializeTransitionRules();
  }

  /**
   * Initialize valid state transition rules
   */
  _initializeTransitionRules() {
    // Module state transitions
    this.transitionRules.set('MODULE', {
      UNINITIALIZED: ['INITIALIZING'],
      INITIALIZING: ['READY', 'FAILED'],
      READY: ['DEGRADED', 'FAILED', 'STOPPED', 'RECOVERING'],
      DEGRADED: ['READY', 'FAILED', 'RECOVERING'],
      FAILED: ['RECOVERING', 'STOPPED'],
      RECOVERING: ['READY', 'FAILED'],
      STOPPED: ['INITIALIZING']
    });

    // Service state transitions
    this.transitionRules.set('SERVICE', {
      DOWN: ['STARTING'],
      STARTING: ['HEALTHY', 'UNHEALTHY', 'FAILED'],
      HEALTHY: ['UNHEALTHY', 'DEGRADED', 'RECOVERING', 'STOPPING'],
      UNHEALTHY: ['RECOVERING', 'STOPPED'],
      DEGRADED: ['HEALTHY', 'UNHEALTHY', 'RECOVERING'],
      RECOVERING: ['HEALTHY', 'UNHEALTHY', 'STOPPED'],
      STOPPING: ['DOWN']
    });

    // System state transitions
    this.transitionRules.set('SYSTEM', {
      INITIALIZING: ['BOOTING', 'FAILED'],
      BOOTING: ['READY', 'CRITICAL'],
      READY: ['DEGRADED', 'CRITICAL', 'RECOVERING', 'SHUTTING_DOWN'],
      DEGRADED: ['READY', 'CRITICAL', 'RECOVERING'],
      CRITICAL: ['RECOVERING', 'SHUTTING_DOWN'],
      RECOVERING: ['READY', 'DEGRADED', 'CRITICAL'],
      SHUTTING_DOWN: ['STOPPED'],
      STOPPED: ['INITIALIZING']
    });
  }

  /**
   * Register entity with state tracking
   */
  registerEntity(entityId, entityType, initialState) {
    const entity = {
      entityId,
      entityType,
      currentState: initialState,
      previousState: null,
      stateChangedAt: Date.now(),
      transitionCount: 0,
      metadata: {}
    };

    this.stateMap.set(entityId, entity);

    return {
      registered: true,
      entityId,
      initialState
    };
  }

  /**
   * Request state transition
   */
  requestStateTransition(entityId, targetState, context = {}) {
    const entity = this.stateMap.get(entityId);

    if (!entity) {
      return {
        success: false,
        reason: 'Entity not found',
        entityId
      };
    }

    // Validate transition is allowed
    const allowedTransitions = this.transitionRules.get(entity.entityType)?.[entity.currentState] || [];

    if (!allowedTransitions.includes(targetState)) {
      return {
        success: false,
        reason: `Invalid transition from ${entity.currentState} to ${targetState}`,
        entityId,
        currentState: entity.currentState,
        requestedState: targetState
      };
    }

    // Execute transition
    const transitionId = `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const transition = {
      transitionId,
      entityId,
      entityType: entity.entityType,
      fromState: entity.currentState,
      toState: targetState,
      context,
      timestamp: new Date().toISOString(),
      startTime,
      status: 'IN_PROGRESS'
    };

    try {
      // Update entity state
      entity.previousState = entity.currentState;
      entity.currentState = targetState;
      entity.stateChangedAt = Date.now();
      entity.transitionCount++;

      transition.duration_ms = Date.now() - startTime;
      transition.status = 'COMPLETED';

      this.metrics.successfulTransitions++;
      this.metrics.totalTransitions++;

      // Record in history
      this.stateHistory.push(transition);
      if (this.stateHistory.length > this.config.maxStateHistorySize) {
        this.stateHistory.shift();
      }

      // Update metrics
      this._updateMetrics();

      return {
        success: true,
        transitionId,
        entityId,
        fromState: transition.fromState,
        toState: transition.toState,
        duration_ms: transition.duration_ms
      };
    } catch (error) {
      transition.status = 'FAILED';
      transition.error = error.message;
      this.metrics.failedTransitions++;
      this.metrics.totalTransitions++;

      // Rollback state
      entity.currentState = entity.previousState;

      return {
        success: false,
        reason: `Transition error: ${error.message}`,
        transitionId,
        entityId
      };
    }
  }

  /**
   * Update global system state
   */
  updateGlobalState(newState, reason = '') {
    const allowedTransitions = this.transitionRules.get('SYSTEM')?.[this.globalState] || [];

    if (!allowedTransitions.includes(newState)) {
      return {
        success: false,
        reason: `Invalid system state transition from ${this.globalState} to ${newState}`
      };
    }

    const previousState = this.globalState;
    this.globalState = newState;

    const stateUpdate = {
      timestamp: new Date().toISOString(),
      previousState,
      currentState: newState,
      reason,
      affectedEntities: this._getAffectedEntities(newState)
    };

    this.stateHistory.push(stateUpdate);

    return {
      success: true,
      previousState,
      currentState: newState,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get affected entities when system state changes
   */
  _getAffectedEntities(newSystemState) {
    const affected = [];

    for (const [id, entity] of this.stateMap) {
      if (newSystemState === 'SHUTTING_DOWN') {
        affected.push({ entityId: id, entityType: entity.entityType });
      } else if (newSystemState === 'RECOVERING') {
        if (entity.currentState === 'FAILED' || entity.currentState === 'DEGRADED') {
          affected.push({ entityId: id, entityType: entity.entityType });
        }
      }
    }

    return affected;
  }

  /**
   * Get entity state
   */
  getEntityState(entityId) {
    return this.stateMap.get(entityId) || null;
  }

  /**
   * Get all entities by type
   */
  getEntitiesByType(entityType) {
    const entities = [];

    for (const [id, entity] of this.stateMap) {
      if (entity.entityType === entityType) {
        entities.push({
          entityId: id,
          currentState: entity.currentState,
          stateChangedAt: entity.stateChangedAt,
          transitionCount: entity.transitionCount
        });
      }
    }

    return entities;
  }

  /**
   * Get entities in specific state
   */
  getEntitiesByState(entityType, state) {
    const entities = [];

    for (const [id, entity] of this.stateMap) {
      if (entity.entityType === entityType && entity.currentState === state) {
        entities.push({
          entityId: id,
          currentState: state,
          stateChangedAt: entity.stateChangedAt
        });
      }
    }

    return entities;
  }

  /**
   * Get system state overview
   */
  getSystemStateOverview() {
    const overview = {
      timestamp: new Date().toISOString(),
      globalState: this.globalState,
      entityCount: this.stateMap.size,
      byType: {},
      byState: {}
    };

    for (const [id, entity] of this.stateMap) {
      // Count by type
      overview.byType[entity.entityType] = (overview.byType[entity.entityType] || 0) + 1;

      // Count by state
      const stateKey = `${entity.entityType}_${entity.currentState}`;
      overview.byState[stateKey] = (overview.byState[stateKey] || 0) + 1;
    }

    return overview;
  }

  /**
   * Get state transition history
   */
  getStateHistory(limit = 50, entityId = null) {
    let history = this.stateHistory;

    if (entityId) {
      history = history.filter(h => h.entityId === entityId);
    }

    return history.slice(-limit);
  }

  /**
   * Check system health based on state
   */
  checkSystemHealth() {
    const unhealthyModules = this._countByState('MODULE', 'FAILED');
    const degradedModules = this._countByState('MODULE', 'DEGRADED');
    const unhealthyServices = this._countByState('SERVICE', 'UNHEALTHY');

    const health = {
      timestamp: new Date().toISOString(),
      unhealthyModules,
      degradedModules,
      unhealthyServices,
      globalState: this.globalState,
      isHealthy: unhealthyModules === 0 && this.globalState !== 'CRITICAL',
      isOperational: this.globalState === 'READY' || this.globalState === 'DEGRADED',
      requiresAttention: unhealthyModules > 0 || unhealthyServices > 0
    };

    return health;
  }

  /**
   * Count entities in specific state
   */
  _countByState(entityType, state) {
    let count = 0;

    for (const entity of this.stateMap.values()) {
      if (entity.entityType === entityType && entity.currentState === state) {
        count++;
      }
    }

    return count;
  }

  /**
   * Update metrics
   */
  _updateMetrics() {
    const recentTransitions = this.stateHistory.slice(-100);

    if (recentTransitions.length > 0) {
      const totalDuration = recentTransitions
        .filter(t => t.duration_ms)
        .reduce((sum, t) => sum + t.duration_ms, 0);

      const transitionsWithDuration = recentTransitions.filter(t => t.duration_ms).length;

      if (transitionsWithDuration > 0) {
        this.metrics.averageTransitionTime_ms = Math.round(totalDuration / transitionsWithDuration);
      }
    }
  }

  /**
   * Get state metrics
   */
  getStateMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.metrics,
      entitiesTracked: this.stateMap.size,
      stateHistorySize: this.stateHistory.length
    };
  }

  /**
   * Generate state report
   */
  generateStateReport() {
    return {
      timestamp: new Date().toISOString(),
      overview: this.getSystemStateOverview(),
      health: this.checkSystemHealth(),
      metrics: this.getStateMetrics(),
      recentTransitions: this.getStateHistory(20)
    };
  }

  /**
   * Reset orchestrator
   */
  reset() {
    this.stateMap.clear();
    this.stateHistory = [];
    this.globalState = 'INITIALIZING';
    this.metrics = {
      totalTransitions: 0,
      successfulTransitions: 0,
      failedTransitions: 0,
      averageTransitionTime_ms: 0
    };

    return { reset: true };
  }
}

module.exports = RuntimeStateOrchestrator;
