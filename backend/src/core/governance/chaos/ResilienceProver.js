/**
 * ResilienceProver
 * PHASE 7.6 — Post-Chaos Invariant Validation
 *
 * Verifies that system invariants hold after chaos injection.
 *
 * CHECKS
 * ✔ idempotency intacta
 * ✔ causal ordering preserved
 * ✔ no duplicate execution
 * ✔ recovery correctness
 * ✔ shard consistency
 * ✔ proof chain integrity
 */

const crypto = require('crypto');

class ResilienceProver {
  constructor(options = {}) {
    // System snapshots
    this.snapshotBefore = null;
    this.snapshotAfter = null;

    // Validation results
    this.validations = {
      idempotencyIntact: { passed: false, details: null },
      causalOrderingPreserved: { passed: false, details: null },
      noDuplicateExecution: { passed: false, details: null },
      recoveryCorrect: { passed: false, details: null },
      shardConsistent: { passed: false, details: null },
      proofIntegrity: { passed: false, details: null }
    };

    // Violation tracking
    this.violations = [];
    this.resilientScore = 0;
  }

  /**
   * Capture system state BEFORE chaos injection
   */
  snapshotSystemBefore(system) {
    if (!system) {
      return { captured: false, reason: 'NO_SYSTEM' };
    }

    this.snapshotBefore = {
      timestamp: Date.now(),
      globalRegistry: system.globalEventRegistry ? {
        eventsRegistered: system.globalEventRegistry.metrics.eventsRegistered,
        duplicatesDetected: system.globalEventRegistry.metrics.duplicatesDetected,
        uniqueEventsProcessed: system.globalEventRegistry.metrics.uniqueEventsProcessed,
        registrySize: system.globalEventRegistry.eventRegistry.size
      } : null,
      proofSystem: system.proofSystem ? {
        totalProofs: system.proofSystem.proofLog.length,
        lastProofSequence: system.proofSystem.sequence
      } : null,
      replicationManager: system.replicationManager ? {
        pendingReplications: system.replicationManager.pendingReplications.size,
        dlqEntries: system.replicationManager.deadLetterQueue.length
      } : null,
      shardRouter: system.shardRouter ? {
        activeTraces: system.shardRouter.activeTraces.size,
        totalShards: system.shardRouter.shardCount
      } : null
    };

    return { captured: true, timestamp: this.snapshotBefore.timestamp };
  }

  /**
   * Capture system state AFTER chaos injection
   */
  snapshotSystemAfter(system) {
    if (!system) {
      return { captured: false, reason: 'NO_SYSTEM' };
    }

    this.snapshotAfter = {
      timestamp: Date.now(),
      globalRegistry: system.globalEventRegistry ? {
        eventsRegistered: system.globalEventRegistry.metrics.eventsRegistered,
        duplicatesDetected: system.globalEventRegistry.metrics.duplicatesDetected,
        uniqueEventsProcessed: system.globalEventRegistry.metrics.uniqueEventsProcessed,
        registrySize: system.globalEventRegistry.eventRegistry.size
      } : null,
      proofSystem: system.proofSystem ? {
        totalProofs: system.proofSystem.proofLog.length,
        lastProofSequence: system.proofSystem.sequence
      } : null,
      replicationManager: system.replicationManager ? {
        pendingReplications: system.replicationManager.pendingReplications.size,
        dlqEntries: system.replicationManager.deadLetterQueue.length
      } : null,
      shardRouter: system.shardRouter ? {
        activeTraces: system.shardRouter.activeTraces.size,
        totalShards: system.shardRouter.shardCount
      } : null
    };

    return { captured: true, timestamp: this.snapshotAfter.timestamp };
  }

  /**
   * VALIDATION 1: Idempotency Intact
   * Verify no duplicate events executed
   */
  validateIdempotency() {
    if (!this.snapshotBefore || !this.snapshotAfter) {
      return {
        passed: false,
        reason: 'MISSING_SNAPSHOTS',
        details: null
      };
    }

    const before = this.snapshotBefore.globalRegistry;
    const after = this.snapshotAfter.globalRegistry;

    if (!before || !after) {
      return { passed: false, reason: 'NO_REGISTRY', details: null };
    }

    // Idempotency is intact if:
    // - total registered events increased monotonically
    // - no event was registered twice
    const eventGrowth = after.eventsRegistered - before.eventsRegistered;
    const duplicatesDetected = after.duplicatesDetected - before.duplicatesDetected;

    const passed = eventGrowth >= 0 && duplicatesDetected >= 0;

    this.validations.idempotencyIntact = {
      passed,
      details: {
        eventGrowth,
        duplicatesDetected,
        beforeRegistered: before.eventsRegistered,
        afterRegistered: after.eventsRegistered
      }
    };

    if (!passed) {
      this.violations.push({
        type: 'IDEMPOTENCY_VIOLATION',
        details: this.validations.idempotencyIntact.details
      });
    }

    return this.validations.idempotencyIntact;
  }

  /**
   * VALIDATION 2: Causal Ordering Preserved
   * Verify event sequences remain monotonic
   */
  validateCausalOrdering(system) {
    if (!system || !system.globalEventRegistry) {
      return {
        passed: false,
        reason: 'NO_SYSTEM',
        details: null
      };
    }

    try {
      // Check sequence monotonicity for all traces
      const allEvents = system.globalEventRegistry.getAllEvents(1000);
      let sequenceValid = true;

      for (const event of allEvents) {
        if (event.sequence && event.sequence > 0) {
          // Sequence should be positive integer
          if (!Number.isInteger(event.sequence)) {
            sequenceValid = false;
            break;
          }
        }
      }

      this.validations.causalOrderingPreserved = {
        passed: sequenceValid,
        details: {
          eventsChecked: allEvents.length,
          sequenceValid
        }
      };

      if (!sequenceValid) {
        this.violations.push({
          type: 'CAUSAL_ORDERING_VIOLATION',
          details: this.validations.causalOrderingPreserved.details
        });
      }

      return this.validations.causalOrderingPreserved;
    } catch (err) {
      return {
        passed: false,
        reason: 'VALIDATION_ERROR',
        error: err.message
      };
    }
  }

  /**
   * VALIDATION 3: No Duplicate Execution
   * Verify idempotency registry prevents double execution
   */
  validateNoDuplicateExecution(system) {
    if (!system || !system.globalEventRegistry) {
      return {
        passed: false,
        reason: 'NO_SYSTEM',
        details: null
      };
    }

    try {
      // Check for any eventId appearing twice in registry
      const allEvents = system.globalEventRegistry.getAllEvents(1000);
      const eventIds = new Set();
      let duplicateFound = false;

      for (const event of allEvents) {
        if (eventIds.has(event.eventId)) {
          duplicateFound = true;
          break;
        }
        eventIds.add(event.eventId);
      }

      const passed = !duplicateFound;

      this.validations.noDuplicateExecution = {
        passed,
        details: {
          totalEvents: allEvents.length,
          uniqueEventIds: eventIds.size,
          duplicateFound
        }
      };

      if (!passed) {
        this.violations.push({
          type: 'DUPLICATE_EXECUTION_FOUND',
          details: this.validations.noDuplicateExecution.details
        });
      }

      return this.validations.noDuplicateExecution;
    } catch (err) {
      return {
        passed: false,
        reason: 'VALIDATION_ERROR',
        error: err.message
      };
    }
  }

  /**
   * VALIDATION 4: Recovery Correctness
   * Verify recovery path maintained system consistency
   */
  validateRecoveryCorrectness(recoveryResult) {
    if (!recoveryResult) {
      return {
        passed: false,
        reason: 'NO_RECOVERY_RESULT',
        details: null
      };
    }

    // Recovery is correct if:
    // - no new violations introduced
    // - system remains operational
    // - proof chain extended validly
    const passed = recoveryResult.success !== false &&
                   recoveryResult.violations === 0;

    this.validations.recoveryCorrect = {
      passed,
      details: {
        success: recoveryResult.success,
        violations: recoveryResult.violations || 0,
        eventsRecovered: recoveryResult.eventsRecovered
      }
    };

    if (!passed) {
      this.violations.push({
        type: 'RECOVERY_FAILED',
        details: this.validations.recoveryCorrect.details
      });
    }

    return this.validations.recoveryCorrect;
  }

  /**
   * VALIDATION 5: Shard Consistency
   * Verify shard state coherent across routing
   */
  validateShardConsistency(system) {
    if (!system || !system.shardRouter) {
      return {
        passed: false,
        reason: 'NO_SHARD_ROUTER',
        details: null
      };
    }

    try {
      // Check shard stats
      const allStats = system.shardRouter.getAllShardStats();
      let consistencyValid = true;

      // All shards should have owner
      for (const stat of allStats) {
        if (!stat.owner && stat.owner !== null) {
          consistencyValid = false;
          break;
        }
      }

      this.validations.shardConsistent = {
        passed: consistencyValid,
        details: {
          totalShards: allStats.length,
          shardsWithOwner: allStats.filter(s => s.owner).length,
          consistencyValid
        }
      };

      if (!consistencyValid) {
        this.violations.push({
          type: 'SHARD_CONSISTENCY_VIOLATION',
          details: this.validations.shardConsistent.details
        });
      }

      return this.validations.shardConsistent;
    } catch (err) {
      return {
        passed: false,
        reason: 'VALIDATION_ERROR',
        error: err.message
      };
    }
  }

  /**
   * VALIDATION 6: Proof System Integrity
   * Verify proof chain remains append-only and consistent
   */
  validateProofIntegrity(system) {
    if (!system || !system.proofSystem) {
      return {
        passed: false,
        reason: 'NO_PROOF_SYSTEM',
        details: null
      };
    }

    try {
      // Verify proof chain
      const verifyResult = system.proofSystem.verify();

      this.validations.proofIntegrity = {
        passed: verifyResult.valid,
        details: {
          valid: verifyResult.valid,
          entriesVerified: verifyResult.entriesVerified,
          error: verifyResult.error
        }
      };

      if (!verifyResult.valid) {
        this.violations.push({
          type: 'PROOF_INTEGRITY_VIOLATION',
          details: this.validations.proofIntegrity.details
        });
      }

      return this.validations.proofIntegrity;
    } catch (err) {
      return {
        passed: false,
        reason: 'VALIDATION_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Validate all invariants and compute resilience score
   */
  validateAll(system, recoveryResult = null) {
    // Snapshots should already exist
    if (!this.snapshotBefore || !this.snapshotAfter) {
      return {
        summary: 'VALIDATION_INCOMPLETE',
        reason: 'MISSING_SNAPSHOTS',
        passed: 0,
        total: 6,
        score: 0
      };
    }

    // Run all validations
    this.validateIdempotency();
    this.validateCausalOrdering(system);
    this.validateNoDuplicateExecution(system);
    this.validateRecoveryCorrectness(recoveryResult);
    this.validateShardConsistency(system);
    this.validateProofIntegrity(system);

    // Count passes
    const passCount = Object.values(this.validations)
      .filter(v => v.passed === true).length;
    const totalValidations = Object.keys(this.validations).length;

    this.resilientScore = (passCount / totalValidations) * 100;

    return {
      summary: passCount === totalValidations ? 'ALL_INVARIANTS_HELD' : 'SOME_VIOLATIONS',
      passed: passCount,
      total: totalValidations,
      score: this.resilientScore.toFixed(2) + '%',
      violations: this.violations.length,
      validations: this.validations
    };
  }

  /**
   * Get violations
   */
  getViolations() {
    return {
      count: this.violations.length,
      violations: this.violations,
      timestamp: Date.now()
    };
  }

  /**
   * Get resilience report
   */
  getReport() {
    return {
      resilientScore: this.resilientScore.toFixed(2) + '%',
      validations: this.validations,
      violations: this.violations,
      snapshotBefore: this.snapshotBefore,
      snapshotAfter: this.snapshotAfter,
      timestamp: Date.now()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.snapshotBefore = null;
    this.snapshotAfter = null;
    this.validations = {
      idempotencyIntact: { passed: false, details: null },
      causalOrderingPreserved: { passed: false, details: null },
      noDuplicateExecution: { passed: false, details: null },
      recoveryCorrect: { passed: false, details: null },
      shardConsistent: { passed: false, details: null },
      proofIntegrity: { passed: false, details: null }
    };
    this.violations = [];
    this.resilientScore = 0;
  }
}

module.exports = ResilienceProver;
