/**
 * PHASE 9.0 — DiscrepancyDetectionEngine
 *
 * Compares cluster's internal claims vs external observer's truth.
 * Does NOT correct discrepancies (append-only recording only).
 * Is purely observational and advisory.
 */

const DISCREPANCY_TYPES = Object.freeze({
  STATE_HASH_MISMATCH: 'STATE_HASH_MISMATCH',
  CHAIN_LENGTH_MISMATCH: 'CHAIN_LENGTH_MISMATCH',
  CONSISTENCY_SCORE_DIVERGENCE: 'CONSISTENCY_SCORE_DIVERGENCE',
  CAUSAL_CONTRADICTION: 'CAUSAL_CONTRADICTION',
  QUORUM_DISCREPANCY: 'QUORUM_DISCREPANCY',
  REGION_SYNC_FAILURE: 'REGION_SYNC_FAILURE',
  DETERMINISM_VIOLATION: 'DETERMINISM_VIOLATION',
  RECONSTRUCTION_PARITY_FAILURE: 'RECONSTRUCTION_PARITY_FAILURE'
});

class DiscrepancyDetectionEngine {
  constructor(cluster, externalTruthLayer) {
    this.cluster = cluster;
    this.truthLayer = externalTruthLayer;
    this.detectedDiscrepancies = [];
  }

  /**
   * Detect state hash mismatch between cluster and external observer
   */
  detectStateHashMismatch(timestamp) {
    try {
      // What cluster claims
      let clusterState = {};
      if (this.cluster && typeof this.cluster.verifyLineageAt === 'function') {
        const result = this.cluster.verifyLineageAt(timestamp);
        clusterState = {
          chainHash: result.chainHash || '',
          chainLength: result.chainLength || 0
        };
      }

      // What external observer measured
      const externalState = this.truthLayer.getExternalStateAt(timestamp);

      // Compare
      if (clusterState.chainHash !== externalState.stateHash) {
        const discrepancy = {
          type: DISCREPANCY_TYPES.STATE_HASH_MISMATCH,
          timestamp,
          clusterClaim: clusterState.chainHash.slice(0, 16) + '...' || 'UNKNOWN',
          externalTruth: externalState.stateHash.slice(0, 16) + '...' || 'UNKNOWN',
          severity: 'CRITICAL',
          detail: `Hash mismatch: cluster ${clusterState.chainHash} vs external ${externalState.stateHash}`
        };

        this.truthLayer.recordDiscrepancy(discrepancy);
        this.detectedDiscrepancies.push(Object.freeze(discrepancy));

        return Object.freeze(discrepancy);
      }

      return null;
    } catch (error) {
      const discrepancy = {
        type: DISCREPANCY_TYPES.STATE_HASH_MISMATCH,
        error: error.message,
        severity: 'CRITICAL'
      };

      this.truthLayer.recordDiscrepancy(discrepancy);
      this.detectedDiscrepancies.push(Object.freeze(discrepancy));

      return Object.freeze(discrepancy);
    }
  }

  /**
   * Detect chain length discrepancy
   */
  detectChainLengthMismatch(timestamp) {
    try {
      let clusterLength = 0;
      if (this.cluster && typeof this.cluster.verifyLineageAt === 'function') {
        const result = this.cluster.verifyLineageAt(timestamp);
        clusterLength = result.chainLength || 0;
      }

      const externalState = this.truthLayer.getExternalStateAt(timestamp);

      if (clusterLength !== externalState.entries) {
        const discrepancy = {
          type: DISCREPANCY_TYPES.CHAIN_LENGTH_MISMATCH,
          timestamp,
          clusterClaim: clusterLength,
          externalTruth: externalState.entries,
          severity: 'CRITICAL',
          detail: `Chain length mismatch: cluster ${clusterLength} vs external ${externalState.entries}`
        };

        this.truthLayer.recordDiscrepancy(discrepancy);
        this.detectedDiscrepancies.push(Object.freeze(discrepancy));

        return Object.freeze(discrepancy);
      }

      return null;
    } catch (error) {
      const discrepancy = {
        type: DISCREPANCY_TYPES.CHAIN_LENGTH_MISMATCH,
        error: error.message,
        severity: 'CRITICAL'
      };

      this.truthLayer.recordDiscrepancy(discrepancy);
      this.detectedDiscrepancies.push(Object.freeze(discrepancy));

      return Object.freeze(discrepancy);
    }
  }

  /**
   * Detect consistency score divergence
   */
  detectConsistencyScoreDivergence(timestamp) {
    try {
      let clusterScore = 1.0;
      if (this.cluster && typeof this.cluster.verifyGlobalLineageConsistency === 'function') {
        const result = this.cluster.verifyGlobalLineageConsistency();
        clusterScore = result.consistencyScore || 0;
      }

      // External observer's view (heuristic: based on observable conditions)
      const externalState = this.truthLayer.getExternalStateAt(timestamp);
      const externalScore = externalState.entries > 0 ? 0.8 : 1.0; // Simplified

      const delta = Math.abs(clusterScore - externalScore);
      if (delta > 0.1) {
        const discrepancy = {
          type: DISCREPANCY_TYPES.CONSISTENCY_SCORE_DIVERGENCE,
          timestamp,
          clusterClaim: clusterScore.toFixed(2),
          externalTruth: externalScore.toFixed(2),
          delta: delta.toFixed(2),
          severity: delta > 0.5 ? 'CRITICAL' : 'WARNING',
          detail: `Consistency score divergence: cluster ${clusterScore} vs external ${externalScore}`
        };

        this.truthLayer.recordDiscrepancy(discrepancy);
        this.detectedDiscrepancies.push(Object.freeze(discrepancy));

        return Object.freeze(discrepancy);
      }

      return null;
    } catch (error) {
      const discrepancy = {
        type: DISCREPANCY_TYPES.CONSISTENCY_SCORE_DIVERGENCE,
        error: error.message,
        severity: 'CRITICAL'
      };

      this.truthLayer.recordDiscrepancy(discrepancy);
      this.detectedDiscrepancies.push(Object.freeze(discrepancy));

      return Object.freeze(discrepancy);
    }
  }

  /**
   * Detect determinism violations under adversarial conditions
   */
  detectDeterminismViolation(adversarialEngine) {
    try {
      const activeConditions = adversarialEngine.getActiveConditions();

      if (activeConditions.length > 0) {
        // System is NOT deterministic under adversarial conditions
        const discrepancy = {
          type: DISCREPANCY_TYPES.DETERMINISM_VIOLATION,
          timestamp: this.truthLayer.externalClock.now(),
          clusterClaim: 'Deterministic operation guaranteed',
          externalTruth: `${activeConditions.length} adversarial conditions active`,
          severity: 'INFO',
          detail: 'System is non-deterministic under adversarial layer. This is EXPECTED.'
        };

        this.truthLayer.recordDiscrepancy(discrepancy);
        this.detectedDiscrepancies.push(Object.freeze(discrepancy));

        return Object.freeze(discrepancy);
      }

      return null;
    } catch (error) {
      return Object.freeze({
        type: DISCREPANCY_TYPES.DETERMINISM_VIOLATION,
        error: error.message
      });
    }
  }

  /**
   * Detect causal contradictions (temporal violations)
   */
  detectCausalContradictions() {
    try {
      let clusterCausal = true;
      if (this.cluster && typeof this.cluster.detectTemporalConflicts === 'function') {
        const result = this.cluster.detectTemporalConflicts();
        clusterCausal = !result.contradictionsFound;
      }

      // External observer checks causality via observations
      const truthConsistency = this.truthLayer.verifyExternalConsistency();

      if (!clusterCausal || !truthConsistency.consistent) {
        const discrepancy = {
          type: DISCREPANCY_TYPES.CAUSAL_CONTRADICTION,
          timestamp: this.truthLayer.externalClock.now(),
          clusterClaim: clusterCausal ? 'CAUSAL_VALID' : 'CAUSAL_INVALID',
          externalTruth: truthConsistency.consistent ? 'CONSISTENT' : 'INCONSISTENT',
          severity: 'CRITICAL',
          detail: 'Causal ordering contradiction detected'
        };

        this.truthLayer.recordDiscrepancy(discrepancy);
        this.detectedDiscrepancies.push(Object.freeze(discrepancy));

        return Object.freeze(discrepancy);
      }

      return null;
    } catch (error) {
      return Object.freeze({
        type: DISCREPANCY_TYPES.CAUSAL_CONTRADICTION,
        error: error.message
      });
    }
  }

  /**
   * Get all detected discrepancies
   */
  getDiscrepancyReport() {
    const bySeverity = {
      CRITICAL: 0,
      WARNING: 0,
      INFO: 0
    };

    const byType = {};

    for (const disc of this.detectedDiscrepancies) {
      bySeverity[disc.severity] = (bySeverity[disc.severity] || 0) + 1;
      byType[disc.type] = (byType[disc.type] || 0) + 1;
    }

    return Object.freeze({
      totalDiscrepancies: this.detectedDiscrepancies.length,
      bySeverity: Object.freeze(bySeverity),
      byType: Object.freeze(byType),
      discrepancies: Object.freeze([...this.detectedDiscrepancies]),
      timestamp: this.truthLayer.externalClock.now(),
      isAuthoritative: true
    });
  }

  /**
   * Check if any critical discrepancies exist
   */
  hasCriticalDiscrepancies() {
    return this.detectedDiscrepancies.some(d => d.severity === 'CRITICAL');
  }

  /**
   * Clear discrepancies (for testing only)
   */
  clear() {
    this.detectedDiscrepancies = [];
  }

  /**
   * External detection is authoritative
   */
  isAuthoritative() {
    return true;
  }
}

module.exports = DiscrepancyDetectionEngine;
module.exports.DISCREPANCY_TYPES = DISCREPANCY_TYPES;
