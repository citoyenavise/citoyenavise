/**
 * EnforcementProofSystem
 * PHASE 7.0.4 — Cryptographically Verifiable Enforcement Audit Trail
 * PHASE 7.0.5 — Dual-Layer Storage: Real-Time + Batch Processing
 *
 * Dual-layer architecture:
 * - REAL_TIME_PROOFS: Immutable, authoritative, synchronous (enforcement decisions)
 * - BATCH_PROOFS: Observability only, async, non-authoritative (metrics/analytics)
 *
 * GUARANTEE: Batch layer NEVER influences enforcement decisions.
 * Real-time path remains fully deterministic and auditable.
 *
 * Real-Time Captures:
 * - Monotonic sequencing for causal ordering
 * - SHA-256 chaining for tamper detection
 * - Immutable proof entries (Object.freeze)
 * - Append-only log (max 50000 entries)
 * - Deterministic hash (excludes 'hash' and 'capturedAt')
 *
 * Batch Captures:
 * - Non-blocking queue for observability
 * - Aggregate metrics and analytics
 * - Compact representation (not full chain)
 */

const crypto = require('crypto');

class EnforcementProofSystem {
  constructor(options = {}) {
    // PHASE 7.0.5: Dual-layer storage
    // REAL_TIME_PROOFS: Authoritative, immutable, synchronous
    this.proofLog = []; // Append-only, authoritative
    this.maxProofLogSize = options.maxProofLogSize || 50000;
    this.sequence = 0; // Monotonic counter (real-time only)
    this.previousHash = null; // For chaining (real-time only)

    // BATCH_PROOFS: Observability only, non-authoritative
    this.batchProcessingBuffer = []; // Non-blocking queue for batch processing
    this.maxBatchBufferSize = options.maxBatchBufferSize || 5000;
    this.batchSequence = 0; // Separate sequence for batch (analytics only)

    // Metrics
    this.metrics = {
      // Real-time metrics (authoritative)
      totalCaptured: 0,
      successCount: 0,
      violationCount: 0,
      byModule: {}, // { moduleName: { success, violation, count } }
      latencyPerRule: {}, // { action: [ms...] }
      proofSystemErrors: 0,
      chainLength: 0,
      lastCaptureTime: null,
      realTimeLatencyMs: 0,
      // Batch metrics (observability only)
      batchQueueDepth: 0,
      batchFlushed: 0,
      proofFlushRate: 0, // proofs per second
      // PHASE 7.0.5: Enhanced observability metrics
      batchAutoCompactCount: 0, // auto-compactions triggered
      lastFlushTimestamp: null, // ISO string
      lastFlushDurationMs: 0 // duration of last compactProofs()
    };
  }

  /**
   * Calculate SHA-256 hash for a proof entry
   * Excludes 'hash' and 'capturedAt' for determinism
   */
  _calculateHash(entry) {
    const canonical = {
      sequence: entry.sequence,
      decisionId: entry.decisionId,
      module: entry.module,
      action: entry.action,
      ruleEvaluated: entry.ruleEvaluated,
      decision: entry.decision,
      severity: entry.severity,
      enforcementLayer: entry.enforcementLayer,
      input: entry.input,
      result: entry.result,
      traceId: entry.traceId,
      latencyMs: entry.latencyMs,
      engineState: entry.engineState,
      previousHash: entry.previousHash
    };

    const json = JSON.stringify(canonical);
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  /**
   * Capture an enforcement decision
   * context: { module, action, ruleEvaluated, input, result, severity, enforcementLayer, traceId, startTime, engineState }
   */
  captureDecision(context) {
    try {
      if (!context) throw new Error('context required');
      if (!context.module || !context.action) throw new Error('module and action required');

      const now = Date.now();
      this.sequence++;

      const proofEntry = {
        sequence: this.sequence,
        decisionId: `enf_${now}_${Math.random().toString(36).substring(7)}`,
        module: context.module,
        action: context.action,
        ruleEvaluated: context.ruleEvaluated || 'unknown',
        decision: context.result?.valid ? 'ALLOWED' : 'BLOCKED',
        severity: context.severity || 'INFO',
        enforcementLayer: context.enforcementLayer || 'UNKNOWN',
        input: context.input || {},
        result: context.result || {},
        traceId: context.traceId || null,
        latencyMs: context.startTime ? now - context.startTime : 0,
        engineState: context.engineState || null,
        previousHash: this.previousHash,
        capturedAt: new Date().toISOString()
      };

      // Calculate hash
      proofEntry.hash = this._calculateHash(proofEntry);

      // Freeze for immutability
      Object.freeze(proofEntry);

      // Append to log
      this.proofLog.push(proofEntry);

      // Cap log size
      if (this.proofLog.length > this.maxProofLogSize) {
        this.proofLog.shift();
        this.sequence--;
      }

      // Update chain pointer
      this.previousHash = proofEntry.hash;

      // Update metrics
      this.metrics.totalCaptured++;
      this.metrics.chainLength = this.proofLog.length;
      this.metrics.lastCaptureTime = now;
      this.metrics.realTimeLatencyMs = context.latencyMs || 0;

      if (proofEntry.decision === 'ALLOWED') {
        this.metrics.successCount++;
      } else {
        this.metrics.violationCount++;
      }

      // Track by module
      const mod = context.module;
      if (!this.metrics.byModule[mod]) {
        this.metrics.byModule[mod] = { success: 0, violation: 0, count: 0 };
      }
      this.metrics.byModule[mod].count++;
      if (proofEntry.decision === 'ALLOWED') {
        this.metrics.byModule[mod].success++;
      } else {
        this.metrics.byModule[mod].violation++;
      }

      // Track latency per action
      const action = context.action;
      if (!this.metrics.latencyPerRule[action]) {
        this.metrics.latencyPerRule[action] = [];
      }
      this.metrics.latencyPerRule[action].push(proofEntry.latencyMs);
      if (this.metrics.latencyPerRule[action].length > 1000) {
        this.metrics.latencyPerRule[action].shift();
      }

      // PHASE 7.0.5: Non-blocking batch enqueue (observability only)
      // Batch data is for analytics/metrics, NEVER for enforcement decisions
      this.batchSequence++;
      const batchEntry = {
        batchSequence: this.batchSequence,
        module: context.module,
        action: context.action,
        decision: proofEntry.decision,
        latencyMs: proofEntry.latencyMs,
        timestamp: now
      };
      this.batchProcessingBuffer.push(batchEntry);
      this.metrics.batchQueueDepth = this.batchProcessingBuffer.length;

      // Auto-compact if batch buffer gets large
      if (this.batchProcessingBuffer.length > this.maxBatchBufferSize) {
        this.metrics.batchAutoCompactCount++;
        this.compactProofs();
      }

      return proofEntry;
    } catch (error) {
      this.metrics.proofSystemErrors++;
      console.error('[EnforcementProofSystem] captureDecision error:', error.message);
      // Never throw — proof system failures must not block enforcement
      return null;
    }
  }

  /**
   * Verify proof chain integrity
   * Checks: sequence monotonicity, hash chaining, hash correctness
   */
  verify() {
    try {
      if (this.proofLog.length === 0) {
        return { valid: true, entriesVerified: 0 };
      }

      // Check sequence starts at 1
      if (this.proofLog[0].sequence !== 1) {
        return {
          valid: false,
          entriesVerified: 0,
          error: 'First proof sequence is not 1'
        };
      }

      // Check first proof has null previousHash
      if (this.proofLog[0].previousHash !== null) {
        return {
          valid: false,
          entriesVerified: 0,
          error: 'First proof previousHash is not null'
        };
      }

      let previousHash = null;
      for (let i = 0; i < this.proofLog.length; i++) {
        const entry = this.proofLog[i];

        // Check sequence is monotonic
        if (entry.sequence !== i + 1) {
          return {
            valid: false,
            entriesVerified: i,
            error: `Sequence gap at index ${i}: expected ${i + 1}, got ${entry.sequence}`
          };
        }

        // Check previousHash matches chain
        if (entry.previousHash !== previousHash) {
          return {
            valid: false,
            entriesVerified: i,
            error: `Hash chain broken at index ${i}`
          };
        }

        // Recalculate hash
        const expectedHash = this._calculateHash(entry);
        if (entry.hash !== expectedHash) {
          return {
            valid: false,
            entriesVerified: i,
            error: `Hash mismatch at index ${i}`
          };
        }

        previousHash = entry.hash;
      }

      return { valid: true, entriesVerified: this.proofLog.length };
    } catch (error) {
      return {
        valid: false,
        entriesVerified: 0,
        error: error.message
      };
    }
  }

  /**
   * Replay proofs with optional filtering
   * filter: { module?, action?, decision? }
   * Returns: array of filtered proofs with only business fields
   */
  replay(filter = null) {
    let entries = this.proofLog;

    if (filter) {
      entries = entries.filter((entry) => {
        if (filter.module && entry.module !== filter.module) return false;
        if (filter.action && entry.action !== filter.action) return false;
        if (filter.decision && entry.decision !== filter.decision) return false;
        return true;
      });
    }

    // Return business-relevant fields only
    return entries.map((entry) => ({
      sequence: entry.sequence,
      decisionId: entry.decisionId,
      module: entry.module,
      action: entry.action,
      decision: entry.decision,
      severity: entry.severity,
      enforcementLayer: entry.enforcementLayer,
      result: entry.result,
      latencyMs: entry.latencyMs,
      capturedAt: entry.capturedAt
    }));
  }

  /**
   * Get proof system metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get last N proofs (for introspection)
   */
  getLastNProofs(n = 50) {
    const start = Math.max(0, this.proofLog.length - n);
    return this.proofLog.slice(start).map((entry) => ({
      sequence: entry.sequence,
      decisionId: entry.decisionId,
      module: entry.module,
      action: entry.action,
      decision: entry.decision,
      severity: entry.severity,
      latencyMs: entry.latencyMs,
      capturedAt: entry.capturedAt,
      hash: entry.hash.substring(0, 16) // Truncated for readability
    }));
  }

  /**
   * PHASE 7.0.5 — Compact batch proofs (observability only, non-authoritative)
   * Flushes batchProcessingBuffer and returns aggregated metrics
   * CRITICAL: Batch never influences enforcement decisions
   */
  compactProofs() {
    const flushStart = Date.now();
    const now = flushStart;
    const flushCount = this.batchProcessingBuffer.length;

    if (flushCount === 0) {
      return {
        flushed: 0,
        compacted: null,
        metrics: this.metrics
      };
    }

    // Aggregate batch data (observability only)
    const aggregated = {
      batchId: `batch_${now}_${Math.random().toString(36).substring(7)}`,
      entriesCount: flushCount,
      timestamp: new Date().toISOString(),
      sequenceRange: {
        start: this.batchProcessingBuffer[0].batchSequence,
        end: this.batchProcessingBuffer[flushCount - 1].batchSequence
      },
      aggregatedMetrics: {
        successCount: 0,
        violationCount: 0,
        byModule: {},
        latencies: []
      }
    };

    // Aggregate metrics from batch
    for (const proof of this.batchProcessingBuffer) {
      if (proof.decision === 'ALLOWED') {
        aggregated.aggregatedMetrics.successCount++;
      } else {
        aggregated.aggregatedMetrics.violationCount++;
      }

      const mod = proof.module;
      if (!aggregated.aggregatedMetrics.byModule[mod]) {
        aggregated.aggregatedMetrics.byModule[mod] = 0;
      }
      aggregated.aggregatedMetrics.byModule[mod]++;

      aggregated.aggregatedMetrics.latencies.push(proof.latencyMs);
    }

    // PHASE 7.0.5: Calculate flush rate with null safety
    const elapsed = this.metrics.lastCaptureTime
      ? Math.max(1, (Date.now() - this.metrics.lastCaptureTime) / 1000)
      : 1;
    const flushRate = flushCount / elapsed;
    this.metrics.proofFlushRate = Math.round(flushRate);

    // PHASE 7.0.5: Record flush timestamp and duration
    this.metrics.lastFlushTimestamp = new Date().toISOString();
    this.metrics.lastFlushDurationMs = Date.now() - flushStart;

    // Clear batch buffer
    this.batchProcessingBuffer = [];
    this.metrics.batchQueueDepth = 0;
    this.metrics.batchFlushed += flushCount;

    return {
      flushed: flushCount,
      compacted: aggregated,
      metrics: this.metrics
    };
  }

  /**
   * PHASE 7.0.5 — Verify batch proofs (audit only, NOT authoritative)
   * CRITICAL: Results are for observability/analytics only.
   * Real-time proofs (proofLog) are the authoritative source.
   */
  verifyBatch() {
    // Batch verification is for observability only
    if (this.batchProcessingBuffer.length === 0) {
      return {
        valid: true,
        entriesVerified: 0,
        isAuthoritative: false,
        message: 'Batch is empty'
      };
    }

    // Check relative sequence ordering within current buffer
    // PHASE 7.0.5: Use relative check, not absolute from 1 (after flush, sequences > 1)
    for (let i = 1; i < this.batchProcessingBuffer.length; i++) {
      const prev = this.batchProcessingBuffer[i - 1];
      const curr = this.batchProcessingBuffer[i];
      if (curr.batchSequence !== prev.batchSequence + 1) {
        return {
          valid: false,
          entriesVerified: i,
          isAuthoritative: false,
          error: `Batch sequence gap at index ${i}: expected ${prev.batchSequence + 1}, got ${curr.batchSequence}`
        };
      }
    }

    return {
      valid: true,
      entriesVerified: this.batchProcessingBuffer.length,
      isAuthoritative: false,
      message: 'Batch proof integrity OK (observability only)'
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.proofLog = [];
    this.sequence = 0;
    this.previousHash = null;
    this.batchProcessingBuffer = [];
    this.batchSequence = 0;
    this.metrics = {
      totalCaptured: 0,
      successCount: 0,
      violationCount: 0,
      byModule: {},
      latencyPerRule: {},
      proofSystemErrors: 0,
      chainLength: 0,
      lastCaptureTime: null,
      realTimeLatencyMs: 0,
      batchQueueDepth: 0,
      batchFlushed: 0,
      proofFlushRate: 0,
      batchAutoCompactCount: 0,
      lastFlushTimestamp: null,
      lastFlushDurationMs: 0
    };
  }
}

module.exports = EnforcementProofSystem;
