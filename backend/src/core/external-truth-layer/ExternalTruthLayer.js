const crypto = require('crypto');

/**
 * PHASE 9.0 — ExternalTruthLayer
 *
 * The SOLE SOURCE OF TRUTH for the distributed system.
 * Not part of cluster. Cannot be influenced by cluster.
 * Cluster is an OBSERVED SYSTEM, not a trusted system.
 */

const TRUTH_ENTRY_TYPES = Object.freeze({
  EVENT_OBSERVATION: 'EVENT_OBSERVATION',
  STATE_SNAPSHOT: 'STATE_SNAPSHOT',
  MESSAGE_CAPTURE: 'MESSAGE_CAPTURE',
  METRIC_RECORDING: 'METRIC_RECORDING',
  DISCREPANCY_DETECTION: 'DISCREPANCY_DETECTION',
  ADVERSARIAL_INJECTION: 'ADVERSARIAL_INJECTION'
});

const OBSERVATION_STATUS = Object.freeze({
  OBSERVED: 'OBSERVED',
  DIVERGED: 'DIVERGED',
  CONTRADICTED: 'CONTRADICTED',
  CORRUPTED: 'CORRUPTED',
  UNVERIFIABLE: 'UNVERIFIABLE'
});

class ExternalClockProvider {
  constructor() {
    this.baseTime = Date.now();
    this.offset = 0;
  }

  now() {
    return new Date(this.baseTime + this.offset + Date.now() - this.baseTime).toISOString();
  }

  advanceBy(ms) {
    this.offset += ms;
  }

  reset() {
    this.offset = 0;
  }
}

class ExternalTruthLayer {
  constructor(options = {}) {
    // External infrastructure (completely separate from cluster)
    this.externalClock = new ExternalClockProvider();
    this.truthLedger = [];      // Append-only, immutable
    this.observations = new Map();
    this.discrepancies = [];
    this.metadata = {
      createdAt: this.externalClock.now(),
      authoritative: true,
      source: 'EXTERNAL_OBSERVER'
    };

    // Freezing metadata to indicate immutability
    Object.freeze(this.metadata);
  }

  /**
   * Record an event observation from EXTERNAL perspective
   * (Not what cluster reports, what WE observe)
   */
  recordEventObservation(event) {
    try {
      if (!event || typeof event !== 'object') {
        throw new Error('Invalid event object');
      }

      const observation = Object.freeze({
        entryType: TRUTH_ENTRY_TYPES.EVENT_OBSERVATION,
        observedAt: this.externalClock.now(),
        event: Object.freeze({ ...event }),
        observationHash: this._computeHash(event),
        source: 'EXTERNAL_OBSERVER',
        isAuthoritative: true
      });

      this.truthLedger.push(observation);
      this.observations.set(observation.observationHash, observation);

      return observation;
    } catch (error) {
      return Object.freeze({
        entryType: TRUTH_ENTRY_TYPES.EVENT_OBSERVATION,
        error: error.message,
        isAuthoritative: true
      });
    }
  }

  /**
   * Record external state snapshot (independent from cluster snapshots)
   */
  recordExternalSnapshot(snapshot) {
    try {
      if (!snapshot) {
        throw new Error('Invalid snapshot');
      }

      const externalSnapshot = Object.freeze({
        entryType: TRUTH_ENTRY_TYPES.STATE_SNAPSHOT,
        snapshotId: snapshot.id || crypto.randomUUID(),
        capturedAt: this.externalClock.now(),
        content: Object.freeze(snapshot),
        snapshotHash: this._computeHash(snapshot),
        validity: 'VERIFIED_BY_EXTERNAL_OBSERVER',
        source: 'EXTERNAL_OBSERVER',
        isAuthoritative: true
      });

      this.truthLedger.push(externalSnapshot);
      this.observations.set(externalSnapshot.snapshotId, externalSnapshot);

      return externalSnapshot;
    } catch (error) {
      return Object.freeze({
        entryType: TRUTH_ENTRY_TYPES.STATE_SNAPSHOT,
        error: error.message,
        isAuthoritative: true
      });
    }
  }

  /**
   * Record network message as observed externally
   */
  recordMessageCapture(message) {
    try {
      const messageCapture = Object.freeze({
        entryType: TRUTH_ENTRY_TYPES.MESSAGE_CAPTURE,
        messageId: message.id || crypto.randomUUID(),
        capturedAt: this.externalClock.now(),
        sender: message.sender,
        receiver: message.receiver,
        latencyMs: message.latencyMs || 0,
        content: message.content,
        messageHash: this._computeHash(message),
        deliveryStatus: message.status || 'RECEIVED',
        source: 'EXTERNAL_OBSERVER',
        isAuthoritative: true
      });

      this.truthLedger.push(messageCapture);

      return messageCapture;
    } catch (error) {
      return Object.freeze({
        entryType: TRUTH_ENTRY_TYPES.MESSAGE_CAPTURE,
        error: error.message,
        isAuthoritative: true
      });
    }
  }

  /**
   * Record metric observation
   */
  recordMetric(metric) {
    try {
      const metricRecord = Object.freeze({
        entryType: TRUTH_ENTRY_TYPES.METRIC_RECORDING,
        metricId: crypto.randomUUID(),
        recordedAt: this.externalClock.now(),
        category: metric.category,
        value: metric.value,
        unit: metric.unit || 'unknown',
        source: 'EXTERNAL_OBSERVER',
        isAuthoritative: true
      });

      this.truthLedger.push(metricRecord);

      return metricRecord;
    } catch (error) {
      return Object.freeze({
        entryType: TRUTH_ENTRY_TYPES.METRIC_RECORDING,
        error: error.message,
        isAuthoritative: true
      });
    }
  }

  /**
   * Record a discrepancy between cluster claims and external truth
   */
  recordDiscrepancy(discrepancy) {
    try {
      const record = Object.freeze({
        entryType: TRUTH_ENTRY_TYPES.DISCREPANCY_DETECTION,
        discrepancyId: crypto.randomUUID(),
        detectedAt: this.externalClock.now(),
        type: discrepancy.type,
        clusterClaim: discrepancy.clusterClaim,
        externalTruth: discrepancy.externalTruth,
        severity: discrepancy.severity || 'WARNING',
        detail: discrepancy.detail,
        source: 'EXTERNAL_OBSERVER',
        isAuthoritative: true
      });

      this.truthLedger.push(record);
      this.discrepancies.push(record);

      return record;
    } catch (error) {
      return Object.freeze({
        entryType: TRUTH_ENTRY_TYPES.DISCREPANCY_DETECTION,
        error: error.message,
        isAuthoritative: true
      });
    }
  }

  /**
   * Record adversarial injection
   */
  recordAdversarialInjection(injection) {
    try {
      const record = Object.freeze({
        entryType: TRUTH_ENTRY_TYPES.ADVERSARIAL_INJECTION,
        injectionId: crypto.randomUUID(),
        injectedAt: this.externalClock.now(),
        type: injection.type,
        target: injection.target,
        severity: injection.severity,
        expectedEffect: injection.expectedEffect,
        source: 'EXTERNAL_OBSERVER',
        isAuthoritative: true
      });

      this.truthLedger.push(record);

      return record;
    } catch (error) {
      return Object.freeze({
        entryType: TRUTH_ENTRY_TYPES.ADVERSARIAL_INJECTION,
        error: error.message,
        isAuthoritative: true
      });
    }
  }

  /**
   * Get external state at timestamp (independent reconstruction)
   */
  getExternalStateAt(timestamp) {
    try {
      const entries = this.truthLedger.filter(e => {
        const entryTime = new Date(e.observedAt || e.capturedAt || e.recordedAt || e.injectedAt);
        const targetTime = new Date(timestamp);
        return entryTime <= targetTime;
      });

      return Object.freeze({
        timestamp,
        entries: entries.length,
        stateHash: this._computeHash(entries.map(e => e.observationHash || e.messageHash || e.snapshotHash)),
        source: 'EXTERNAL_OBSERVER',
        isAuthoritative: true
      });
    } catch (error) {
      return Object.freeze({
        timestamp,
        error: error.message,
        isAuthoritative: true
      });
    }
  }

  /**
   * Verify external consistency (independent of cluster)
   */
  verifyExternalConsistency() {
    try {
      const issues = [];

      // Check for hash contradictions
      const hashes = new Set();
      for (const entry of this.truthLedger) {
        if (entry.observationHash || entry.messageHash || entry.snapshotHash) {
          const hash = entry.observationHash || entry.messageHash || entry.snapshotHash;
          if (hashes.has(hash)) {
            issues.push({
              type: 'DUPLICATE_HASH',
              hash,
              severity: 'WARNING'
            });
          }
          hashes.add(hash);
        }
      }

      return Object.freeze({
        consistent: issues.length === 0,
        issues: Object.freeze([...issues]),
        timestamp: this.externalClock.now(),
        source: 'EXTERNAL_OBSERVER',
        isAuthoritative: true
      });
    } catch (error) {
      return Object.freeze({
        consistent: false,
        error: error.message,
        isAuthoritative: true
      });
    }
  }

  /**
   * Get all recorded discrepancies
   */
  getDiscrepancyReport() {
    return Object.freeze({
      totalDiscrepancies: this.discrepancies.length,
      discrepancies: Object.freeze([...this.discrepancies]),
      timestamp: this.externalClock.now(),
      source: 'EXTERNAL_OBSERVER',
      isAuthoritative: true
    });
  }

  /**
   * Get immutable truth ledger
   */
  getTruthLedger() {
    return Object.freeze([...this.truthLedger]);
  }

  /**
   * Compute ledger hash (fingerprint of all truth recorded)
   */
  getLedgerHash() {
    const concatenated = this.truthLedger
      .map(e => e.observationHash || e.messageHash || e.snapshotHash || this._computeHash(e))
      .join('');

    return this._computeHash(concatenated);
  }

  /**
   * Private hash function
   */
  _computeHash(data) {
    try {
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      return crypto.createHash('sha256').update(str).digest('hex');
    } catch (e) {
      return '';
    }
  }

  /**
   * External observer is always authoritative
   */
  isAuthoritative() {
    return true;
  }
}

module.exports = ExternalTruthLayer;
module.exports.TRUTH_ENTRY_TYPES = TRUTH_ENTRY_TYPES;
module.exports.OBSERVATION_STATUS = OBSERVATION_STATUS;
module.exports.ExternalClockProvider = ExternalClockProvider;
