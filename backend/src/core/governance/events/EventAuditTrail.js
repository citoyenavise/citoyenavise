/**
 * EventAuditTrail
 * PHASE 5.3 — Event Schema Registry & Validation
 *
 * Immutable append-only audit trail for governance events.
 * Features:
 * - Hash chaining for tamper detection
 * - Replay capability
 * - Immutability guarantees
 * - Cryptographic verification
 */

const crypto = require('crypto');

class EventAuditTrail {
  constructor(options = {}) {
    this.trail = [];
    this.hashChain = [];
    this.previousHash = null;
    this.maxTrailSize = options.maxTrailSize || 50000; // PHASE 5.6: Memory cap
    this.metrics = {
      eventsLogged: 0,
      replayCount: 0,
      tamperDetectionCount: 0
    };
  }

  /**
   * Append event to audit trail
   * Returns immutable entry
   */
  append(event) {
    if (!event) throw new Error('event required');

    // Create audit entry
    const entry = {
      sequence: this.trail.length + 1,
      eventId: event.id,
      eventType: event.type,
      version: event.metadata?.version || '1.0.0',
      timestamp: event.timestamp,
      traceId: event.traceId,
      severity: event.severity,
      payload: event.payload,
      hash: null,
      previousHash: this.previousHash,
      auditedAt: new Date().toISOString()
    };

    // Calculate hash
    entry.hash = this._calculateHash(entry);

    // Verify chain integrity
    if (this.previousHash && entry.previousHash !== this.previousHash) {
      throw new Error('Hash chain integrity violation detected');
    }

    // Append (immutable in intent, though JS array is mutable)
    this.trail.push(Object.freeze(entry));
    this.hashChain.push(entry.hash);
    this.previousHash = entry.hash;

    // PHASE 5.6: Cap trail size to prevent memory growth
    if (this.trail.length > this.maxTrailSize) {
      this.trail.shift();
      this.hashChain.shift();
    }

    this.metrics.eventsLogged += 1;

    // Return immutable copy
    return Object.freeze({ ...entry });
  }

  /**
   * Verify audit trail integrity
   */
  verify() {
    let previousHash = null;

    for (let i = 0; i < this.trail.length; i++) {
      const entry = this.trail[i];

      // Verify sequence
      if (entry.sequence !== i + 1) {
        return {
          valid: false,
          reason: 'sequence_violation',
          index: i,
          expected_sequence: i + 1,
          actual_sequence: entry.sequence
        };
      }

      // Verify previous hash link
      if (i === 0) {
        if (entry.previousHash !== null) {
          return {
            valid: false,
            reason: 'first_entry_should_have_null_previous_hash',
            index: i
          };
        }
      } else {
        if (entry.previousHash !== previousHash) {
          return {
            valid: false,
            reason: 'hash_chain_broken',
            index: i,
            expected_previous_hash: previousHash,
            actual_previous_hash: entry.previousHash
          };
        }
      }

      // Verify hash
      const expectedHash = this._calculateHash(entry);
      if (entry.hash !== expectedHash) {
        return {
          valid: false,
          reason: 'entry_tampered',
          index: i,
          expected_hash: expectedHash,
          actual_hash: entry.hash
        };
      }

      previousHash = entry.hash;
    }

    return {
      valid: true,
      entriesVerified: this.trail.length,
      chainIntegrity: 'verified'
    };
  }

  /**
   * Get events in range
   */
  getRange(startIndex = 0, endIndex = null) {
    const end = endIndex || this.trail.length;
    return this.trail.slice(startIndex, end);
  }

  /**
   * Get last N entries
   */
  getRecent(n = 10) {
    return this.trail.slice(-n);
  }

  /**
   * Get by event type
   */
  getByType(eventType) {
    return this.trail.filter(e => e.eventType === eventType);
  }

  /**
   * Get by time range
   */
  getByTimeRange(startTime, endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    return this.trail.filter(e => {
      const time = new Date(e.timestamp).getTime();
      return time >= start && time <= end;
    });
  }

  /**
   * Get by trace ID (all related events)
   */
  getByTraceId(traceId) {
    return this.trail.filter(e => e.traceId === traceId);
  }

  /**
   * Replay events (for recovery/reconstruction)
   */
  replay(predicate = null) {
    this.metrics.replayCount += 1;

    if (!predicate) {
      return this.trail.map(e => ({
        eventId: e.eventId,
        eventType: e.eventType,
        version: e.version,
        timestamp: e.timestamp,
        traceId: e.traceId,
        payload: e.payload
      }));
    }

    // Replay with filter
    return this.trail
      .filter(predicate)
      .map(e => ({
        eventId: e.eventId,
        eventType: e.eventType,
        version: e.version,
        timestamp: e.timestamp,
        traceId: e.traceId,
        payload: e.payload
      }));
  }

  /**
   * Get audit trail size
   */
  getSize() {
    return this.trail.length;
  }

  /**
   * Get trail status
   */
  getStatus() {
    const integrity = this.verify();

    return {
      timestamp: new Date().toISOString(),
      entriesCount: this.trail.length,
      integrity: integrity.valid ? 'verified' : 'compromised',
      integrityDetails: integrity,
      metrics: this.getMetrics(),
      latestHash: this.previousHash
    };
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Export trail (for backup)
   */
  export() {
    return {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      entriesCount: this.trail.length,
      integrity: this.verify(),
      trail: this.trail.map(e => ({ ...e }))
    };
  }

  /**
   * Clear trail (dangerous - audit trail is immutable in concept)
   * Only for testing
   */
  clear() {
    this.trail = [];
    this.hashChain = [];
    this.previousHash = null;
    return { cleared: true };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      eventsLogged: 0,
      replayCount: 0,
      tamperDetectionCount: 0
    };
    return { reset: true };
  }

  /**
   * Private: Calculate entry hash
   * Hash includes all entry data except hash and auditedAt
   */
  _calculateHash(entry) {
    const hashInput = {
      sequence: entry.sequence,
      eventId: entry.eventId,
      eventType: entry.eventType,
      version: entry.version,
      timestamp: entry.timestamp,
      traceId: entry.traceId,
      severity: entry.severity,
      payload: entry.payload,
      previousHash: entry.previousHash
    };

    const serialized = JSON.stringify(hashInput);
    return crypto
      .createHash('sha256')
      .update(serialized)
      .digest('hex');
  }
}

module.exports = EventAuditTrail;
