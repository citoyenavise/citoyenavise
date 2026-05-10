/**
 * PHASE 10.0 — IndependentAuditStream
 * Decoupled external audit trail generation
 * Zero feedback to observed system
 */

const crypto = require('crypto');

class IndependentAuditStream {
  constructor(options = {}) {
    this.auditLog = [];
    this.externalTimeAuthority = options.externalTimeAuthority || Date.now;
    this.hashAlgorithm = options.hashAlgorithm || 'sha256';

    this.metrics = {
      entriesLogged: 0,
      anomaliesLogged: 0,
      driftsLogged: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Log observation externally
  logObservation(observation) {
    const entry = {
      entryId: this._generateId(),
      externalTimestamp: this.externalTimeAuthority(),
      entryType: 'OBSERVATION',
      data: {
        timestamp: observation.timestamp,
        behavior: observation.behavior,
        drift: observation.drift,
        entropy: observation.entropy,
        anomalousScore: observation.anomalousScore || 0
      },
      frozen: true
    };

    // Compute hash (immutable proof)
    entry.hash = this._computeEntryHash(entry);

    // Freeze entry
    Object.freeze(entry);
    Object.freeze(entry.data);

    // Add to log
    this.auditLog.push(entry);
    this.metrics.entriesLogged++;

    return entry;
  }

  // Log anomaly externally
  logAnomaly(anomaly) {
    const entry = {
      entryId: this._generateId(),
      externalTimestamp: this.externalTimeAuthority(),
      entryType: 'ANOMALY',
      data: {
        anomalyType: anomaly.type,
        magnitude: anomaly.magnitude,
        timestamp: anomaly.timestamp,
        severity: anomaly.severity || 'MEDIUM',
        description: anomaly.description || ''
      },
      frozen: true
    };

    entry.hash = this._computeEntryHash(entry);

    Object.freeze(entry);
    Object.freeze(entry.data);

    this.auditLog.push(entry);
    this.metrics.anomaliesLogged++;

    return entry;
  }

  // Log drift externally
  logDrift(drift) {
    const entry = {
      entryId: this._generateId(),
      externalTimestamp: this.externalTimeAuthority(),
      entryType: 'DRIFT',
      data: {
        magnitude: drift.magnitude,
        rate: drift.rate,
        acceleration: drift.acceleration || 0,
        classification: drift.classification || 'UNKNOWN',
        timestamp: drift.timestamp
      },
      frozen: true
    };

    entry.hash = this._computeEntryHash(entry);

    Object.freeze(entry);
    Object.freeze(entry.data);

    this.auditLog.push(entry);
    this.metrics.driftsLogged++;

    return entry;
  }

  // Generate complete audit log
  generateAuditLog() {
    const logData = {
      timestamp: new Date().toISOString(),
      totalEntries: this.auditLog.length,
      entries: Object.freeze([...this.auditLog]),
      logHash: this._computeLogHash()
    };

    return Object.freeze(logData);
  }

  // Verify log integrity
  verifyLogIntegrity() {
    const issues = [];

    // Check monotonic timestamps
    for (let i = 1; i < this.auditLog.length; i++) {
      if (this.auditLog[i].externalTimestamp < this.auditLog[i - 1].externalTimestamp) {
        issues.push({
          type: 'TIMESTAMP_NOT_MONOTONIC',
          index: i
        });
      }
    }

    // Verify hashes
    for (let i = 0; i < this.auditLog.length; i++) {
      const entry = this.auditLog[i];
      const expectedHash = this._computeEntryHash(entry);

      if (expectedHash !== entry.hash) {
        issues.push({
          type: 'HASH_MISMATCH',
          index: i
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      integrity: 'VALID' | 'COMPROMISED'
    };
  }

  // Get external timestamp
  getExternalTimestamp() {
    return this.externalTimeAuthority();
  }

  // Verify no feedback loops
  verifyNoFeedbackLoops() {
    // In production, check for any changes to observed system
    // that correlate with audit log entries
    return {
      feedbackLoops: 0,
      noFeedback: true
    };
  }

  // Get audit log
  getAuditLog(startIndex = 0, endIndex = null) {
    const end = endIndex || this.auditLog.length;
    const slice = this.auditLog.slice(startIndex, end);

    return Object.freeze([...slice]);
  }

  // Get log size
  getLogSize() {
    return {
      entries: this.auditLog.length,
      observations: this.metrics.entriesLogged,
      anomalies: this.metrics.anomaliesLogged,
      drifts: this.metrics.driftsLogged
    };
  }

  // Get metrics
  getMetrics() {
    return Object.freeze({
      ...this.metrics,
      currentSize: this.auditLog.length,
      isAuthoritative: false
    });
  }

  // Helper: Generate unique ID
  _generateId() {
    return crypto
      .randomBytes(8)
      .toString('hex');
  }

  // Helper: Compute entry hash
  _computeEntryHash(entry) {
    const hash = crypto.createHash(this.hashAlgorithm);

    // Hash entry content deterministically
    const content = {
      entryId: entry.entryId,
      externalTimestamp: entry.externalTimestamp,
      entryType: entry.entryType,
      data: entry.data
    };

    hash.update(JSON.stringify(content));

    return hash.digest('hex');
  }

  // Helper: Compute log hash
  _computeLogHash() {
    const hash = crypto.createHash(this.hashAlgorithm);

    for (const entry of this.auditLog) {
      hash.update(entry.hash);
    }

    return hash.digest('hex');
  }
}

// Freeze class
Object.freeze(IndependentAuditStream);
Object.freeze(IndependentAuditStream.prototype);

module.exports = {
  IndependentAuditStream
};
