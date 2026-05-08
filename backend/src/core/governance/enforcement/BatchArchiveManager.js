/**
 * BatchArchiveManager
 * PHASE 7.2 — Long-Term Batch Archive & Retention
 *
 * Manages immutable long-term storage of batch compaction results.
 * Each archived segment is frozen (Object.freeze), indexed by time,
 * and subject to TTL-based retention and eviction.
 *
 * INVARIANT: Archive never influences Real-Time enforcement decisions.
 * All operations are observability-only, read-only by design.
 */

const crypto = require('crypto');

/**
 * ArchiveSegment: immutable batch archive entry
 * Frozen at creation time, never mutated
 */
class ArchiveSegment {
  // Not a class in the OOP sense — we freeze plain objects
}

class BatchArchiveManager {
  constructor(options = {}) {
    this.segments = new Map(); // segmentId → frozen ArchiveSegment
    this.retentionMs = options.retentionMs || 7 * 24 * 60 * 60 * 1000; // 7 days default
    this.maxSegments = options.maxSegments || 10000;
    this.compressionEnabled = options.compressionEnabled !== false;
    this.maxAlerts = options.maxAlerts || 1000;

    // Temporal index: sorted array of { ts: Number (epoch ms), segmentId: String }
    this.temporalIndex = [];

    // Archive-level metrics
    this.archiveMetrics = {
      segmentsStored: 0,
      segmentsEvicted: 0,
      totalEntriesArchived: 0,
      compressionRatioSum: 0, // sum for average calculation
      lastArchiveTimestamp: null, // ISO string
      archiveErrors: 0,
      replayRequests: 0,
      createdAt: new Date().toISOString()
    };

    // Alert history (frozen objects)
    this.alerts = [];
  }

  /**
   * Archive a single compaction result from compactProofs()
   */
  archiveCompaction(compactionResult, options = {}) {
    if (!compactionResult || !compactionResult.batchId) {
      return { archived: false, reason: 'INVALID_COMPACTION' };
    }

    if (this.segments.size >= this.maxSegments) {
      this.archiveMetrics.archiveErrors++;
      return { archived: false, reason: 'ARCHIVE_FULL' };
    }

    // Generate unique segment ID
    const segmentId = `arch_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Calculate latency stats if latencies present
    const latencies = compactionResult.aggregatedMetrics?.latencies || [];
    const latencyStats = latencies.length > 0 ? this._computeLatencyStats(latencies) : null;

    // Estimate compression ratio: compare number of latency samples vs percentile stats (6 values)
    let compressionRatioEstimate = 1.0;
    if (this.compressionEnabled && latencies.length > 0 && latencyStats) {
      // Ratio = original sample count / compressed stats count (6 stats: p50, p95, p99, avg, min, max)
      compressionRatioEstimate = parseFloat((latencies.length / 6).toFixed(2));
    }

    // Create frozen segment
    const segment = Object.freeze({
      segmentId,
      batchId: compactionResult.batchId,
      nodeId: options.nodeId || null,
      archivedAt: new Date().toISOString(),
      segmentTimestamp: compactionResult.timestamp,
      sequenceRange: Object.freeze({ ...compactionResult.sequenceRange }),
      entriesCount: compactionResult.entriesCount,
      rootHash: options.rootHash || null,
      compressed: this.compressionEnabled && latencies.length > 0,
      compressionRatioEstimate,
      aggregatedMetrics: Object.freeze({
        successCount: compactionResult.aggregatedMetrics.successCount,
        violationCount: compactionResult.aggregatedMetrics.violationCount,
        violationRatePercent: compactionResult.entriesCount > 0
          ? parseFloat(((compactionResult.aggregatedMetrics.violationCount / compactionResult.entriesCount) * 100).toFixed(2))
          : 0,
        byModule: Object.freeze({ ...compactionResult.aggregatedMetrics.byModule })
      }),
      latencyStats: latencyStats ? Object.freeze(latencyStats) : null,
      isAuthoritative: false // INVARIANT
    });

    // Store and index
    this.segments.set(segmentId, segment);
    this._insertIntoTemporalIndex(new Date(compactionResult.timestamp).getTime(), segmentId);

    // Update metrics
    this.archiveMetrics.segmentsStored++;
    this.archiveMetrics.totalEntriesArchived += compactionResult.entriesCount;
    this.archiveMetrics.compressionRatioSum += compressionRatioEstimate;
    this.archiveMetrics.lastArchiveTimestamp = new Date().toISOString();

    return { archived: true, segmentId, compressed: segment.compressed };
  }

  /**
   * Bulk archive from DistributedBatchEngine (all active nodes)
   */
  archiveClusterBatch(engine, options = {}) {
    const archivedSegments = [];
    let nodesArchived = 0;

    // Archive compactions from each active node
    for (const [nodeId, node] of engine.nodes) {
      if (!node.isAlive()) continue;

      const compactionResult = node.proofSystem.compactProofs();
      if (!compactionResult.compacted) continue;

      const result = this.archiveCompaction(compactionResult.compacted, { nodeId });
      if (result.archived) {
        archivedSegments.push(result.segmentId);
        nodesArchived++;
      }
    }

    // Get global consolidation root hash
    const consolidation = engine.consolidateClusterProofs();
    const rootHash = consolidation.rootHash;

    return {
      archived: archivedSegments.length > 0,
      segments: archivedSegments,
      rootHash,
      nodesArchived,
      isAuthoritative: false
    };
  }

  /**
   * Get segment by ID
   */
  getSegmentById(segmentId) {
    return this.segments.get(segmentId) || null;
  }

  /**
   * Get segments by time range (binary search)
   */
  getSegmentsByTimeRange(startTs, endTs) {
    const start = typeof startTs === 'string' ? new Date(startTs).getTime() : startTs;
    const end = typeof endTs === 'string' ? new Date(endTs).getTime() : endTs;

    // Binary search for first entry >= start
    let lo = 0, hi = this.temporalIndex.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.temporalIndex[mid].ts < start) lo = mid + 1;
      else hi = mid;
    }

    // Collect segments in range
    const results = [];
    for (let i = lo; i < this.temporalIndex.length; i++) {
      if (this.temporalIndex[i].ts > end) break;
      const seg = this.segments.get(this.temporalIndex[i].segmentId);
      if (seg) results.push(seg);
    }
    return results;
  }

  /**
   * Get segments by source node ID
   */
  getSegmentsByNodeId(nodeId) {
    const results = [];
    for (const segment of this.segments.values()) {
      if (segment.nodeId === nodeId) {
        results.push(segment);
      }
    }
    return results;
  }

  /**
   * Replay segment for audit (read-only)
   */
  replaySegment(segmentId) {
    const segment = this.segments.get(segmentId);
    if (!segment) return { replayed: false, reason: 'SEGMENT_NOT_FOUND' };

    this.archiveMetrics.replayRequests++;

    return {
      replayed: true,
      segment, // frozen — read-only by design
      replayedAt: new Date().toISOString(),
      isAuthoritative: false
    };
  }

  /**
   * Search segments by flexible query
   */
  searchSegments(query) {
    const results = [];
    for (const segment of this.segments.values()) {
      let matches = true;

      if (query.nodeId && segment.nodeId !== query.nodeId) matches = false;
      if (query.violationRateAbove && segment.aggregatedMetrics.violationRatePercent <= query.violationRateAbove) matches = false;
      if (query.entriesAbove && segment.entriesCount <= query.entriesAbove) matches = false;
      if (query.startTimestamp && new Date(segment.segmentTimestamp).getTime() < query.startTimestamp) matches = false;
      if (query.endTimestamp && new Date(segment.segmentTimestamp).getTime() > query.endTimestamp) matches = false;

      if (matches) results.push(segment);
    }
    return results;
  }

  /**
   * Evict expired segments (TTL-based rotation)
   */
  evictExpiredSegments() {
    const cutoff = Date.now() - this.retentionMs;
    let evicted = 0;
    const toEvict = [];

    // Identify expired segments
    for (const [segmentId, segment] of this.segments) {
      if (new Date(segment.segmentTimestamp).getTime() < cutoff) {
        toEvict.push(segmentId);
      }
    }

    // Remove them
    for (const segmentId of toEvict) {
      this.segments.delete(segmentId);
      evicted++;
      this.archiveMetrics.segmentsEvicted++;
    }

    // Rebuild temporal index
    if (evicted > 0) {
      this.temporalIndex = this.temporalIndex.filter((entry) => this.segments.has(entry.segmentId));
    }

    return { evicted, retained: this.segments.size };
  }

  /**
   * Get archive metrics snapshot
   */
  getArchiveMetrics() {
    const compressionRatioAvg = this.archiveMetrics.segmentsStored > 0
      ? parseFloat((this.archiveMetrics.compressionRatioSum / this.archiveMetrics.segmentsStored).toFixed(2))
      : 0;

    return {
      isAuthoritative: false,
      segmentsStored: this.archiveMetrics.segmentsStored,
      segmentsEvicted: this.archiveMetrics.segmentsEvicted,
      totalEntriesArchived: this.archiveMetrics.totalEntriesArchived,
      compressionRatioAvg,
      lastArchiveTimestamp: this.archiveMetrics.lastArchiveTimestamp,
      archiveErrors: this.archiveMetrics.archiveErrors,
      replayRequests: this.archiveMetrics.replayRequests,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check for newly triggered alerts
   */
  checkAlerts() {
    const newAlerts = [];
    const capacityUsage = this.segments.size / this.maxSegments;

    // ARCHIVE_CAPACITY_HIGH
    if (capacityUsage > 0.9 && capacityUsage < 1) {
      const alert = Object.freeze({
        type: 'ARCHIVE_CAPACITY_HIGH',
        severity: 'WARNING',
        value: capacityUsage,
        threshold: 0.9,
        message: `Archive capacity at ${(capacityUsage * 100).toFixed(1)}% (${this.segments.size}/${this.maxSegments} segments)`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // ARCHIVE_FULL
    if (capacityUsage >= 1) {
      const alert = Object.freeze({
        type: 'ARCHIVE_FULL',
        severity: 'CRITICAL',
        value: this.segments.size,
        threshold: this.maxSegments,
        message: `Archive is FULL: ${this.segments.size}/${this.maxSegments} segments`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // RETENTION_BREACH_DETECTED
    const cutoff = Date.now() - this.retentionMs;
    for (const segment of this.segments.values()) {
      if (new Date(segment.segmentTimestamp).getTime() < cutoff) {
        const alert = Object.freeze({
          type: 'RETENTION_BREACH_DETECTED',
          severity: 'WARNING',
          value: segment.entriesCount,
          threshold: this.retentionMs,
          message: `Segment ${segment.segmentId} is older than retention period`,
          timestamp: new Date().toISOString(),
          isAuthoritative: false
        });
        newAlerts.push(alert);
        this.alerts.push(alert);
        break; // Only one alert per check
      }
    }

    // COMPRESSION_DISABLED
    if (!this.compressionEnabled && this.archiveMetrics.totalEntriesArchived > 10000) {
      const alert = Object.freeze({
        type: 'COMPRESSION_DISABLED',
        severity: 'INFO',
        value: this.archiveMetrics.totalEntriesArchived,
        threshold: 10000,
        message: `Compression is disabled but archive has ${this.archiveMetrics.totalEntriesArchived} entries`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // Cap alert history
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    return newAlerts;
  }

  /**
   * Get all historical alerts
   */
  getAllAlerts() {
    return [...this.alerts]; // Copy
  }

  /**
   * INVARIANT: Archive never authoritative
   */
  isAuthoritative() {
    return false;
  }

  /**
   * Get archive summary
   */
  getSummary() {
    return {
      isAuthoritative: false,
      archiveMetrics: this.getArchiveMetrics(),
      segmentCount: this.segments.size,
      alerts: {
        total: this.alerts.length,
        active: this.checkAlerts()
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset all state (for tests)
   */
  reset() {
    this.segments.clear();
    this.temporalIndex = [];
    this.archiveMetrics = {
      segmentsStored: 0,
      segmentsEvicted: 0,
      totalEntriesArchived: 0,
      compressionRatioSum: 0,
      lastArchiveTimestamp: null,
      archiveErrors: 0,
      replayRequests: 0,
      createdAt: new Date().toISOString()
    };
    this.alerts = [];
  }

  /**
   * INTERNAL: Insert into sorted temporal index
   */
  _insertIntoTemporalIndex(ts, segmentId) {
    let lo = 0, hi = this.temporalIndex.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.temporalIndex[mid].ts <= ts) lo = mid + 1;
      else hi = mid;
    }
    this.temporalIndex.splice(lo, 0, { ts, segmentId });
  }

  /**
   * INTERNAL: Compute latency percentiles
   */
  _computeLatencyStats(latencies) {
    if (!latencies || latencies.length === 0) return null;

    const sorted = [...latencies].sort((a, b) => a - b);
    const pct = (p) => sorted[Math.floor(p * (sorted.length - 1))];
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      p50: pct(0.50),
      p95: pct(0.95),
      p99: pct(0.99),
      avg: parseFloat((sum / sorted.length).toFixed(2)),
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }
}

module.exports = BatchArchiveManager;
