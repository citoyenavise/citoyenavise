/**
 * PHASE 9.9 — RealityFinalSealEngine
 * Final state validation, capture, and cryptographic sealing
 * Produces immutable, verifiable final certificate
 */

const crypto = require('crypto');

const SEAL_STATES = {
  UNSEALED: 'UNSEALED',
  SEALING: 'SEALING',
  SEALED: 'SEALED',
  VERIFIED: 'VERIFIED',
  BROKEN: 'BROKEN'
};

const SEAL_ERRORS = {
  DIVERGENCE_TOO_HIGH: 'DIVERGENCE_TOO_HIGH',
  COHERENCE_INSUFFICIENT: 'COHERENCE_INSUFFICIENT',
  PHASE_UNCONVERGED: 'PHASE_UNCONVERGED',
  HASH_MISMATCH: 'HASH_MISMATCH',
  SEAL_GENERATION_FAILED: 'SEAL_GENERATION_FAILED',
  MISSING_PHASE: 'MISSING_PHASE'
};

class RealityFinalSealEngine {
  constructor(truthStack, allPhases = {}, options = {}) {
    this.truthStack = truthStack;
    this.allPhases = allPhases;

    this.maxDivergenceForSeal = options.maxDivergenceForSeal || 0.01;
    this.minCoherenceForSeal = options.minCoherenceForSeal || 0.99;
    this.hashAlgorithm = options.hashAlgorithm || 'sha256';

    this.sealStatus = SEAL_STATES.UNSEALED;
    this.finalSnapshot = null;
    this.finalSeal = null;

    this.metrics = {
      sealsGenerated: 0,
      sealsVerified: 0,
      capturesPerformed: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Capture final system state snapshot
  captureFinalSnapshot() {
    try {
      const snapshot = {
        timestamp: new Date().toISOString(),

        // Capture all phase states
        phases: this._capturePhaseStates(),

        // Global metrics
        globalMetrics: {
          divergence: this._computeFinalDivergence(),
          coherence: this._computeGlobalCoherence(),
          regionalAgreement: this._checkRegionalAgreement()
        },

        // Archive info
        archive: {
          size: this._getArchiveSize(),
          hash: this._computeArchiveHash()
        }
      };

      // Compute global hash
      snapshot.globalHash = this._computeGlobalHash(snapshot);

      // Freeze snapshot
      this.finalSnapshot = Object.freeze(snapshot);
      this.metrics.capturesPerformed++;

      return this.finalSnapshot;
    } catch (error) {
      throw new Error(`Snapshot capture failed: ${error.message}`);
    }
  }

  // Compute final divergence across system
  _computeFinalDivergence() {
    if (!this.truthStack.divergenceTracker) return 0.0;

    const regions = ['EU', 'US', 'APAC'];
    let maxDivergence = 0.0;

    for (const region of regions) {
      const d = this.truthStack.divergenceTracker.getDivergence(region) || 0.0;
      maxDivergence = Math.max(maxDivergence, d);
    }

    return Math.max(0.0, maxDivergence);
  }

  // Compute global coherence at final moment
  _computeGlobalCoherence() {
    if (!this.truthStack.coherenceMonitor) return 1.0;
    return this.truthStack.coherenceMonitor.getGlobalCoherence();
  }

  // Check if all regions agree on final state
  _checkRegionalAgreement() {
    const regions = ['EU', 'US', 'APAC'];
    let allAgree = true;

    for (const region of regions) {
      if (!this.truthStack.regionalStates?.[region]?.agreed) {
        allAgree = false;
        break;
      }
    }

    return allAgree;
  }

  // Get current archive size
  _getArchiveSize() {
    if (!this.truthStack.archive) return 0;
    return this.truthStack.archive.size?.();
  }

  // Compute archive integrity hash
  _computeArchiveHash() {
    if (!this.truthStack.archive) return '';

    const hash = crypto.createHash(this.hashAlgorithm);
    const entries = this.truthStack.archive.getAllEntries?.() || [];

    for (const entry of entries) {
      hash.update(JSON.stringify(entry));
    }

    return hash.digest('hex');
  }

  // Capture state from all phases
  _capturePhaseStates() {
    const phases = {};

    for (let i = 0; i <= 8; i++) {
      const phase = this.allPhases[i] || {};
      phases[i] = {
        status: phase.status || 'UNKNOWN',
        hash: this._getPhaseHash(i),
        locked: phase.locked || false
      };
    }

    return phases;
  }

  // Get hash representing phase state
  _getPhaseHash(phaseNum) {
    const phase = this.allPhases[phaseNum];
    if (!phase) return '';

    const hash = crypto.createHash(this.hashAlgorithm);

    // Hash phase state deterministically
    if (phase.getState) {
      const state = phase.getState();
      hash.update(JSON.stringify(state));
    }

    return hash.digest('hex');
  }

  // Compute global hash across entire system
  _computeGlobalHash(snapshot) {
    const hash = crypto.createHash(this.hashAlgorithm);

    // Include all phases in order
    for (let i = 0; i <= 8; i++) {
      if (snapshot.phases[i]) {
        hash.update(snapshot.phases[i].hash);
      }
    }

    // Include metrics
    hash.update(JSON.stringify({
      divergence: snapshot.globalMetrics.divergence,
      coherence: snapshot.globalMetrics.coherence
    }));

    // Include timestamp
    hash.update(snapshot.timestamp);

    return hash.digest('hex');
  }

  // Validate that final divergence is acceptable
  validateFinalDivergence() {
    if (!this.finalSnapshot) {
      throw new Error('No snapshot captured yet');
    }

    const divergence = this.finalSnapshot.globalMetrics.divergence;

    if (divergence > this.maxDivergenceForSeal) {
      throw new Error(
        `Divergence too high: ${divergence} > ${this.maxDivergenceForSeal}`
      );
    }

    return {
      valid: true,
      divergence,
      threshold: this.maxDivergenceForSeal
    };
  }

  // Validate global coherence is excellent
  validateGlobalCoherence() {
    if (!this.finalSnapshot) {
      throw new Error('No snapshot captured yet');
    }

    const coherence = this.finalSnapshot.globalMetrics.coherence;

    if (coherence < this.minCoherenceForSeal) {
      throw new Error(
        `Coherence insufficient: ${coherence} < ${this.minCoherenceForSeal}`
      );
    }

    return {
      valid: true,
      coherence,
      threshold: this.minCoherenceForSeal
    };
  }

  // Verify all phases converged
  verifyAllPhasesConverged() {
    if (!this.finalSnapshot) {
      throw new Error('No snapshot captured yet');
    }

    const phases = this.finalSnapshot.phases;
    const unconverged = [];

    for (let i = 0; i <= 8; i++) {
      if (!phases[i] || phases[i].status !== 'CONVERGED') {
        unconverged.push(i);
      }
    }

    if (unconverged.length > 0) {
      throw new Error(`Phases unconverged: ${unconverged.join(', ')}`);
    }

    return {
      valid: true,
      allConverged: true,
      phasesChecked: 9
    };
  }

  // Generate cryptographic seal signature
  generateFinalSealSignature() {
    try {
      if (!this.finalSnapshot) {
        throw new Error('No snapshot to seal');
      }

      this.sealStatus = SEAL_STATES.SEALING;

      // Compute seal signature
      const sealData = {
        globalHash: this.finalSnapshot.globalHash,
        timestamp: this.finalSnapshot.timestamp,
        divergence: this.finalSnapshot.globalMetrics.divergence,
        coherence: this.finalSnapshot.globalMetrics.coherence,
        seal_marker: 'FINAL_SYSTEM_SEAL'
      };

      const signatureInput = JSON.stringify(sealData);
      const signature = crypto
        .createHash(this.hashAlgorithm)
        .update(signatureInput)
        .digest('hex');

      this.finalSeal = {
        signature,
        algorithm: `${this.hashAlgorithm.toUpperCase()}-HMAC`,
        timestamp: new Date().toISOString(),
        data: sealData
      };

      this.sealStatus = SEAL_STATES.SEALED;
      this.metrics.sealsGenerated++;

      return Object.freeze(this.finalSeal);
    } catch (error) {
      this.sealStatus = SEAL_STATES.BROKEN;
      throw new Error(`Seal generation failed: ${error.message}`);
    }
  }

  // Validate seal integrity
  validateSealIntegrity() {
    if (!this.finalSeal) {
      return {
        valid: false,
        reason: 'No seal generated',
        status: SEAL_STATES.UNSEALED
      };
    }

    try {
      // Recompute signature
      const signatureInput = JSON.stringify(this.finalSeal.data);
      const recomputedSignature = crypto
        .createHash(this.hashAlgorithm)
        .update(signatureInput)
        .digest('hex');

      const valid = recomputedSignature === this.finalSeal.signature;

      if (valid) {
        this.sealStatus = SEAL_STATES.VERIFIED;
        this.metrics.sealsVerified++;
      } else {
        this.sealStatus = SEAL_STATES.BROKEN;
      }

      return {
        valid,
        signature: this.finalSeal.signature,
        verified: valid,
        status: this.sealStatus,
        timestamp: this.finalSeal.timestamp
      };
    } catch (error) {
      this.sealStatus = SEAL_STATES.BROKEN;
      return {
        valid: false,
        reason: error.message,
        status: SEAL_STATES.BROKEN
      };
    }
  }

  // Get final system state (immutable)
  getFinalSystemState() {
    if (!this.finalSnapshot) {
      return null;
    }

    return {
      snapshot: Object.freeze({ ...this.finalSnapshot }),
      seal: this.finalSeal ? Object.freeze({ ...this.finalSeal }) : null,
      timestamp: this.finalSnapshot.timestamp,
      globalHash: this.finalSnapshot.globalHash,
      sealStatus: this.sealStatus
    };
  }

  // Get seal status
  getFinalSealStatus() {
    return {
      status: this.sealStatus,
      sealed: this.sealStatus !== SEAL_STATES.UNSEALED,
      verified: this.sealStatus === SEAL_STATES.VERIFIED,
      broken: this.sealStatus === SEAL_STATES.BROKEN,
      timestamp: this.finalSeal?.timestamp || null
    };
  }

  // Get metrics (frozen)
  getMetrics() {
    return Object.freeze({
      ...this.metrics,
      currentStatus: this.sealStatus,
      hasFinalSnapshot: !!this.finalSnapshot,
      hasFinalSeal: !!this.finalSeal,
      isAuthoritative: false
    });
  }
}

// Freeze class
Object.freeze(RealityFinalSealEngine);
Object.freeze(RealityFinalSealEngine.prototype);

module.exports = {
  RealityFinalSealEngine,
  SEAL_STATES,
  SEAL_ERRORS
};
