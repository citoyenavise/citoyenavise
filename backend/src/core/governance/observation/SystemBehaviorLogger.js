/**
 * PHASE 10.0 — SystemBehaviorLogger
 * Immutable external recording of all observations
 * Pure append-only external log
 */

const crypto = require('crypto');

class SystemBehaviorLogger {
  constructor(options = {}) {
    this.log = [];
    this.hashAlgorithm = options.hashAlgorithm || 'sha256';

    this.metrics = {
      entriesLogged: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Record behavior externally
  recordBehavior(behavior) {
    const entry = {
      logId: this._generateId(),
      timestamp: new Date().toISOString(),
      behavior: behavior,
      frozen: true
    };

    // Compute hash (immutable proof)
    entry.hash = this._computeEntryHash(entry);

    // Freeze entry
    Object.freeze(entry);

    // Append to log (immutable)
    this.log.push(entry);
    this.metrics.entriesLogged++;

    return Object.freeze({ ...entry });
  }

  // Record observation
  recordObservation(observation) {
    const entry = {
      logId: this._generateId(),
      externalTimestamp: new Date().toISOString(),
      observationData: {
        timestamp: observation.timestamp,
        behavior: observation.behavior,
        drift: observation.drift,
        entropy: observation.entropy,
        anomalyScore: observation.anomalyScore || 0
      },
      frozen: true
    };

    entry.hash = this._computeEntryHash(entry);

    Object.freeze(entry);
    Object.freeze(entry.observationData);

    this.log.push(entry);
    this.metrics.entriesLogged++;

    return Object.freeze({ ...entry });
  }

  // Get log entries
  getLogEntries(startIndex = 0, endIndex = null) {
    const end = endIndex || this.log.length;
    const slice = this.log.slice(startIndex, end);

    return Object.freeze([...slice]);
  }

  // Get observations in time range
  getObservationsInRange(startTime, endTime) {
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();

    const filtered = this.log.filter((entry) => {
      const ts = new Date(entry.externalTimestamp).getTime();

      return ts >= startMs && ts <= endMs;
    });

    return Object.freeze([...filtered]);
  }

  // Get log hash
  getLogHash() {
    const hash = crypto.createHash(this.hashAlgorithm);

    for (const entry of this.log) {
      hash.update(entry.hash);
    }

    return hash.digest('hex');
  }

  // Verify log immutability
  verifyLogImmutability() {
    const issues = [];

    // Check each entry hash
    for (let i = 0; i < this.log.length; i++) {
      const entry = this.log[i];
      const expectedHash = this._computeEntryHash(entry);

      if (expectedHash !== entry.hash) {
        issues.push({
          type: 'HASH_MISMATCH',
          index: i,
          entryId: entry.logId
        });
      }
    }

    // Check timestamp ordering
    for (let i = 1; i < this.log.length; i++) {
      const prev = new Date(this.log[i - 1].externalTimestamp).getTime();
      const curr = new Date(this.log[i].externalTimestamp).getTime();

      if (curr < prev) {
        issues.push({
          type: 'TIMESTAMP_ORDER_VIOLATION',
          index: i
        });
      }
    }

    return {
      immutable: issues.length === 0,
      issues,
      integrity: issues.length === 0 ? 'VALID' : 'COMPROMISED'
    };
  }

  // Reprocess log for reproducibility
  async reprocessLog(processor) {
    const results = [];

    for (const entry of this.log) {
      try {
        const result = await processor(entry);

        results.push({
          logId: entry.logId,
          result,
          reproducible: true
        });
      } catch (error) {
        results.push({
          logId: entry.logId,
          error: error.message,
          reproducible: false
        });
      }
    }

    return Object.freeze(results);
  }

  // Verify reproducibility
  async verifyReproducibility(processor) {
    const runs = [];

    // Run processing twice
    for (let run = 0; run < 2; run++) {
      const results = await this.reprocessLog(processor);

      runs.push(results);
    }

    // Compare results
    const differences = [];

    for (let i = 0; i < runs[0].length; i++) {
      if (JSON.stringify(runs[0][i]) !== JSON.stringify(runs[1][i])) {
        differences.push({
          index: i,
          logId: runs[0][i].logId
        });
      }
    }

    return {
      reproducible: differences.length === 0,
      differences,
      reproducibilityIndex: 1.0 - differences.length / runs[0].length
    };
  }

  // Store report externally
  async storeReport(report) {
    const entry = {
      logId: this._generateId(),
      externalTimestamp: new Date().toISOString(),
      reportType: 'SYSTEM_REPORT',
      report,
      frozen: true
    };

    entry.hash = this._computeEntryHash(entry);

    Object.freeze(entry);

    this.log.push(entry);
    this.metrics.entriesLogged++;

    return Object.freeze({ ...entry });
  }

  // Get log metrics
  getLogMetrics() {
    return Object.freeze({
      ...this.metrics,
      currentSize: this.log.length,
      logHash: this.getLogHash(),
      immutability: this.verifyLogImmutability(),
      isAuthoritative: false
    });
  }

  // Get log statistics
  getLogStatistics() {
    return Object.freeze({
      totalEntries: this.log.length,
      oldestEntry: this.log.length > 0 ? this.log[0].externalTimestamp : null,
      newestEntry: this.log.length > 0 ? this.log[this.log.length - 1].externalTimestamp : null,
      entriesByType: this._countEntriesByType(),
      logHash: this.getLogHash(),
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

    const content = {
      logId: entry.logId,
      externalTimestamp: entry.externalTimestamp,
      behavior: entry.behavior,
      observationData: entry.observationData,
      reportType: entry.reportType,
      report: entry.report
    };

    hash.update(JSON.stringify(content));

    return hash.digest('hex');
  }

  // Helper: Count entries by type
  _countEntriesByType() {
    const counts = {};

    for (const entry of this.log) {
      const type = entry.behavior ? 'BEHAVIOR' :
                   entry.observationData ? 'OBSERVATION' :
                   entry.report ? 'REPORT' : 'OTHER';

      counts[type] = (counts[type] || 0) + 1;
    }

    return counts;
  }
}

// Freeze class
Object.freeze(SystemBehaviorLogger);
Object.freeze(SystemBehaviorLogger.prototype);

module.exports = {
  SystemBehaviorLogger
};
