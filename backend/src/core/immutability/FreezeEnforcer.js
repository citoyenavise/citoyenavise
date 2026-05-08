/**
 * FreezeEnforcer.js - Enforce immutability via Object.freeze()
 * Immutability & Sealing - PHASE 1.2 STEP 8
 *
 * Responsibility: Apply and verify Object.freeze() on constitutional objects
 * - Deep freeze all objects
 * - Verify freeze is applied
 * - Prevent accidental mutations
 * - Track frozen objects
 */

class FreezeEnforcer {
  constructor(options = {}) {
    this.frozenObjects = new Map();
    this.freezeLog = [];
    this.mutationAttempts = [];

    this.config = {
      deepFreeze: options.deepFreeze !== false,
      trackFrozen: options.trackFrozen !== false,
      preventExtensions: options.preventExtensions !== false,
      sealObjects: options.sealObjects !== false,
      maxLogSize: options.maxLogSize || 10000
    };

    this.metrics = {
      objectsFrozen: 0,
      objectsVerified: 0,
      mutationAttemptsDetected: 0,
      frozenObjectsCount: 0
    };
  }

  /**
   * Deep freeze object recursively
   */
  deepFreeze(object, objectName = 'unknown') {
    if (object === null || typeof object !== 'object') {
      return object;
    }

    // Already frozen
    if (Object.isFrozen(object)) {
      return object;
    }

    // Freeze the object itself
    Object.freeze(object);

    if (this.config.preventExtensions) {
      Object.preventExtensions(object);
    }

    if (this.config.sealObjects) {
      Object.seal(object);
    }

    // Recursively freeze properties if deep freeze enabled
    if (this.config.deepFreeze) {
      for (const key of Object.getOwnPropertyNames(object)) {
        const value = object[key];

        if ((typeof value === 'object' || typeof value === 'function') &&
            !Object.isFrozen(value)) {
          this.deepFreeze(value, `${objectName}.${key}`);
        }
      }
    }

    return object;
  }

  /**
   * Freeze constitutional object
   */
  freezeConstitution(objectName, constitutionObject) {
    const startTime = Date.now();

    try {
      // Perform deep freeze
      this.deepFreeze(constitutionObject, objectName);

      // Verify freeze
      const frozen = Object.isFrozen(constitutionObject);
      const duration = Date.now() - startTime;

      if (!frozen) {
        return {
          success: false,
          objectName,
          reason: 'Object freeze verification failed',
          frozen: false
        };
      }

      // Record frozen object
      this.frozenObjects.set(objectName, {
        objectName,
        frozenAt: new Date().toISOString(),
        frozenTimestamp: Date.now(),
        frozen: true,
        deep: this.config.deepFreeze,
        properties: Object.getOwnPropertyNames(constitutionObject).length,
        mutationAttempts: 0,
        verificationCount: 0
      });

      this.metrics.objectsFrozen++;
      this.metrics.frozenObjectsCount = this.frozenObjects.size;

      // Log freeze
      const log = {
        timestamp: new Date().toISOString(),
        objectName,
        action: 'FREEZE',
        success: true,
        frozen: true,
        duration_ms: duration,
        deepFreeze: this.config.deepFreeze
      };

      this.freezeLog.push(log);
      if (this.freezeLog.length > this.config.maxLogSize) {
        this.freezeLog.shift();
      }

      return {
        success: true,
        objectName,
        frozen: true,
        frozenAt: new Date().toISOString(),
        duration_ms: duration
      };
    } catch (error) {
      return {
        success: false,
        objectName,
        reason: `Freeze error: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Verify object is frozen
   */
  verifyFrozen(objectName, constitutionObject) {
    const startTime = Date.now();
    const frozen = Object.isFrozen(constitutionObject);
    const extensible = Object.isExtensible(constitutionObject);

    const verification = {
      objectName,
      timestamp: new Date().toISOString(),
      frozen,
      extensible,
      sealed: Object.isSealed(constitutionObject),
      duration_ms: Date.now() - startTime,
      status: frozen ? 'FROZEN' : 'NOT_FROZEN'
    };

    // Update record
    const record = this.frozenObjects.get(objectName);
    if (record) {
      record.verificationCount++;
      record.frozen = frozen;
    }

    this.metrics.objectsVerified++;

    return verification;
  }

  /**
   * Verify all frozen objects
   */
  verifyAllFrozen() {
    const results = [];
    const startTime = Date.now();

    for (const [objectName, record] of this.frozenObjects) {
      results.push({
        objectName,
        frozen: record.frozen,
        mutationAttempts: record.mutationAttempts,
        verificationCount: record.verificationCount
      });
    }

    return {
      timestamp: new Date().toISOString(),
      objectsChecked: results.length,
      allFrozen: results.every(r => r.frozen),
      withMutationAttempts: results.filter(r => r.mutationAttempts > 0),
      duration_ms: Date.now() - startTime,
      results
    };
  }

  /**
   * Detect mutation attempt (via proxy/wrapper)
   */
  recordMutationAttempt(objectName, property, attemptedValue, reason = '') {
    const record = this.frozenObjects.get(objectName);
    if (record) {
      record.mutationAttempts++;
    }

    this.metrics.mutationAttemptsDetected++;

    const attempt = {
      timestamp: new Date().toISOString(),
      objectName,
      property,
      attemptedValue,
      reason,
      severity: 'HIGH'
    };

    this.mutationAttempts.push(attempt);
    if (this.mutationAttempts.length > this.config.maxLogSize) {
      this.mutationAttempts.shift();
    }

    return {
      detected: true,
      objectName,
      property,
      blocked: true,
      message: `Mutation attempt blocked for frozen object: ${objectName}`
    };
  }

  /**
   * Get freeze status
   */
  getFreezeStatus(objectName) {
    const record = this.frozenObjects.get(objectName);

    if (!record) {
      return null;
    }

    return {
      objectName,
      frozen: record.frozen,
      frozenAt: record.frozenAt,
      properties: record.properties,
      mutationAttempts: record.mutationAttempts,
      verificationCount: record.verificationCount,
      status: record.frozen ? 'FROZEN' : 'UNFROZEN'
    };
  }

  /**
   * Get all freeze statuses
   */
  getAllFreezeStatuses() {
    const statuses = [];

    for (const [objectName, record] of this.frozenObjects) {
      statuses.push({
        objectName,
        frozen: record.frozen,
        frozenAt: record.frozenAt,
        mutationAttempts: record.mutationAttempts,
        verificationCount: record.verificationCount,
        status: record.frozen ? 'FROZEN' : 'UNFROZEN'
      });
    }

    return statuses;
  }

  /**
   * Get mutation attempts
   */
  getMutationAttempts(limit = 50) {
    return this.mutationAttempts.slice(-limit);
  }

  /**
   * Get mutation attempts report
   */
  getMutationReport() {
    return {
      timestamp: new Date().toISOString(),
      totalAttempts: this.mutationAttempts.length,
      attempts: this.getMutationAttempts(20),
      byObject: this._groupAttemptsByObject(),
      severity: this.mutationAttempts.length > 0 ? 'CRITICAL' : 'NONE'
    };
  }

  /**
   * Group mutation attempts by object
   */
  _groupAttemptsByObject() {
    const grouped = {};

    for (const attempt of this.mutationAttempts) {
      if (!grouped[attempt.objectName]) {
        grouped[attempt.objectName] = 0;
      }
      grouped[attempt.objectName]++;
    }

    return grouped;
  }

  /**
   * Get freeze log
   */
  getFreezeLog(limit = 50) {
    return this.freezeLog.slice(-limit);
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.metrics,
      frozenObjectsCount: this.frozenObjects.size
    };
  }

  /**
   * Generate immutability report
   */
  generateImmutabilityReport() {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        objectsFrozen: this.metrics.objectsFrozen,
        objectsVerified: this.metrics.objectsVerified,
        frozenObjectsCount: this.frozenObjects.size,
        mutationAttemptsDetected: this.metrics.mutationAttemptsDetected
      },
      freezeStatus: this.verifyAllFrozen(),
      objectStatuses: this.getAllFreezeStatuses(),
      mutations: this.getMutationReport(),
      metrics: this.getMetrics()
    };
  }

  /**
   * Reset enforcer
   */
  reset() {
    this.freezeLog = [];
    this.mutationAttempts = [];
    this.metrics = {
      objectsFrozen: 0,
      objectsVerified: 0,
      mutationAttemptsDetected: 0,
      frozenObjectsCount: 0
    };

    return { reset: true };
  }
}

module.exports = FreezeEnforcer;
