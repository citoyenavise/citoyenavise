/**
 * SnapshotOptimizer
 * PHASE 7.5 — Global Archive Optimization & Performance Enhancements
 *
 * Optimizes snapshot performance through:
 * - Incremental snapshots (delta-only, not full copy)
 * - Intelligent TTL adaptation (adjust retention based on access patterns)
 * - Predictive cache hit estimation (Bloom filters for O(1) membership)
 * - Multi-region distribution strategies (LAZY_PUSH, EAGER_PULL, HYBRID)
 *
 * INVARIANT: Optimizer remains observability-only, never authoritative.
 * All operations are read-only on snapshots (no mutation).
 */

const crypto = require('crypto');

class SnapshotOptimizer {
  constructor(baseSnapshotManager, options = {}) {
    this.snapManager = baseSnapshotManager;
    this.optimizedSnapshots = new Map();  // snapshotId → OptimizedSnapshot
    this.deltaIndex = new Map();          // snapshotId → { prevId, delta }
    this.cacheStats = new Map();          // snapshotId → { hits, misses, lastAccess }
    this.bloomFilters = new Map();        // snapshotId → BloomFilter
    this.accessPatterns = [];             // historical access records

    this.maxOptimizations = options.maxOptimizations || 500;
    this.bloomFilterSize = options.bloomFilterSize || 10000;
    this.ttlAdjustmentWindow = options.ttlAdjustmentWindow || 7 * 24 * 60 * 60 * 1000; // 7 days

    this.optimizationMetrics = {
      snapshotsOptimized: 0,
      avgCompressionRatio: 1.0,
      avgLatencyMs: 0,
      cacheHitRate: 0,
      predictedHits: 0,
      ttlAdjustments: 0,
      createdAt: new Date().toISOString()
    };

    this.alerts = [];
  }

  /**
   * Optimize snapshot using specified strategy
   */
  optimizeSnapshot(snapshot, strategy = 'INCREMENTAL') {
    if (!snapshot) {
      return { optimized: false, reason: 'NO_SNAPSHOT' };
    }

    if (this.optimizedSnapshots.size >= this.maxOptimizations) {
      return { optimized: false, reason: 'OPTIMIZATIONS_FULL' };
    }

    const optimizationId = `opt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    let optimized = { ...snapshot, optimizationStrategy: strategy };
    let delta = null;

    switch (strategy) {
      case 'INCREMENTAL':
        delta = this._computeDelta(snapshot);
        optimized.delta = delta;
        optimized.originalSize = snapshot.segmentsData.length;
        optimized.optimizedSize = delta ? delta.length : snapshot.segmentsData.length;
        optimized.compressionRatio = delta ? (delta.length / snapshot.segmentsData.length) : 1.0;
        if (delta) this.deltaIndex.set(snapshot.snapshotId, delta);
        break;

      case 'LAZY':
        optimized.materialized = false;
        optimized.originalSize = snapshot.segmentsData.length;
        optimized.optimizedSize = 0; // defer until accessed
        optimized.compressionRatio = 0;
        break;

      case 'AGGRESSIVE':
        const compressed = this._aggressiveCompress(snapshot);
        optimized.compressedData = compressed.data;
        optimized.originalSize = snapshot.segmentsData.length;
        optimized.optimizedSize = compressed.data.length;
        optimized.compressionRatio = compressed.ratio;
        break;

      default:
        return { optimized: false, reason: 'UNKNOWN_STRATEGY' };
    }

    // Build Bloom filter for membership queries
    const bloomFilter = this._buildBloomFilter(snapshot);
    this.bloomFilters.set(snapshot.snapshotId, bloomFilter);

    // Freeze optimized snapshot
    const frozenOptimized = Object.freeze({
      snapshotId: snapshot.snapshotId,
      optimizationId,
      optimizationStrategy: strategy,
      originalSize: optimized.originalSize,
      optimizedSize: optimized.optimizedSize,
      compressionRatio: optimized.compressionRatio,
      delta: optimized.delta || null,
      materialized: strategy !== 'LAZY',
      bloomFilter: bloomFilter,
      accessStats: Object.freeze({
        hits: 0,
        misses: 0,
        lastAccess: null
      }),
      isAuthoritative: false
    });

    this.optimizedSnapshots.set(snapshot.snapshotId, frozenOptimized);
    this.cacheStats.set(snapshot.snapshotId, { hits: 0, misses: 0, lastAccess: null });
    this.optimizationMetrics.snapshotsOptimized++;
    this.optimizationMetrics.avgCompressionRatio =
      (this.optimizationMetrics.avgCompressionRatio + optimized.compressionRatio) / 2;

    return {
      optimized: true,
      optimizationId,
      snapshotId: snapshot.snapshotId,
      strategy,
      reduction: (1 - optimized.compressionRatio) * 100,
      isAuthoritative: false
    };
  }

  /**
   * Adaptive TTL based on replay frequency
   */
  adaptiveRetention(snapshotId, replayStats = {}) {
    const snapshot = this.snapManager.getSnapshotById(snapshotId);
    if (!snapshot) {
      return { adapted: false, reason: 'SNAPSHOT_NOT_FOUND' };
    }

    const { replaysPerDay = 0, lastReplayTime = null } = replayStats;
    const baseMaxAge = this.snapManager.maxSnapshotAgeMs;
    let newTtl = baseMaxAge;
    let confidence = 0.5;

    // Hot snapshot (replayed frequently)
    if (replaysPerDay > 5) {
      newTtl = baseMaxAge * 2; // extend TTL
      confidence = 0.95;
    }
    // Warm snapshot (occasional replays)
    else if (replaysPerDay > 1) {
      newTtl = baseMaxAge * 1.5;
      confidence = 0.8;
    }
    // Cold snapshot (never/rarely replayed)
    else if (replaysPerDay === 0) {
      newTtl = Math.max(baseMaxAge * 0.5, 6 * 60 * 60 * 1000); // at least 6h
      confidence = 0.7;
    }

    this.optimizationMetrics.ttlAdjustments++;

    return {
      adapted: true,
      snapshotId,
      currentMaxAge: baseMaxAge,
      newMaxAge: newTtl,
      adjustment: newTtl - baseMaxAge,
      confidence,
      reasoning: this._ttlReasoning(replaysPerDay),
      isAuthoritative: false
    };
  }

  /**
   * Predict cache hit probability for query pattern
   */
  predictCacheHit(snapshotId, queryTs) {
    const optimized = this.optimizedSnapshots.get(snapshotId);
    if (!optimized) {
      return { predicted: false, reason: 'NOT_OPTIMIZED' };
    }

    const bloomFilter = this.bloomFilters.get(snapshotId);
    if (!bloomFilter) {
      return { predicted: false, reason: 'NO_BLOOM_FILTER' };
    }

    // Query bloom filter for timestamp membership
    const inFilter = bloomFilter.query(queryTs);
    const stats = this.cacheStats.get(snapshotId);
    const hitRate = stats ? stats.hits / (stats.hits + stats.misses || 1) : 0.5;
    const timeSinceLastAccess = stats && stats.lastAccess
      ? Date.now() - new Date(stats.lastAccess).getTime()
      : Infinity;

    // Confidence based on bloom filter + historical hit rate + recency
    let confidence = hitRate;
    if (timeSinceLastAccess < 60 * 60 * 1000) confidence *= 1.2; // boost if recently accessed
    confidence = Math.min(confidence, 0.99);

    this.accessPatterns.push({
      snapshotId,
      queryTs,
      timestamp: new Date().toISOString(),
      predicted: inFilter,
      confidence
    });

    return {
      predicted: inFilter,
      confidence,
      hitRate,
      timeSinceLastAccess: timeSinceLastAccess === Infinity ? null : timeSinceLastAccess,
      isAuthoritative: false
    };
  }

  /**
   * Plan multi-region distribution strategy
   */
  planDistributionStrategy(regionIds, snapshotSize) {
    if (!regionIds || regionIds.length === 0) {
      return { strategy: 'NONE', cost: 0 };
    }

    const regionCount = regionIds.length;

    // LAZY_PUSH: only push if queried (lowest cost, higher latency)
    const lazyCost = snapshotSize * 0.1; // 10% baseline

    // EAGER_PULL: regions periodically sync (moderate cost, consistent latency)
    const eagerCost = snapshotSize * regionCount * 0.5;

    // HYBRID: threshold-based (balance)
    const hybridCost = snapshotSize * Math.ceil(regionCount / 2);

    // Select based on size and region count
    let strategy;
    let cost;

    if (snapshotSize < 10 * 1024 * 1024 && regionCount <= 2) { // < 10MB, 2 regions
      strategy = 'LAZY_PUSH';
      cost = lazyCost;
    } else if (snapshotSize > 100 * 1024 * 1024 || regionCount > 3) { // > 100MB or >3 regions
      strategy = 'HYBRID';
      cost = hybridCost;
    } else {
      strategy = 'EAGER_PULL';
      cost = eagerCost;
    }

    return {
      strategy,
      cost,
      costPerRegion: cost / regionCount,
      reasoning: `${strategy} optimal for ${regionCount} regions, ${(snapshotSize / 1024 / 1024).toFixed(1)}MB snapshot`,
      isAuthoritative: false
    };
  }

  /**
   * Get optimization metrics
   */
  getOptimizationMetrics() {
    return Object.freeze({
      isAuthoritative: false,
      snapshotsOptimized: this.optimizationMetrics.snapshotsOptimized,
      avgCompressionRatio: this.optimizationMetrics.avgCompressionRatio,
      avgLatencyMs: this.optimizationMetrics.avgLatencyMs,
      cacheHitRate: this._calculateHitRate(),
      predictedHits: this.optimizationMetrics.predictedHits,
      ttlAdjustments: this.optimizationMetrics.ttlAdjustments,
      optimizedCount: this.optimizedSnapshots.size,
      bloomFilterCount: this.bloomFilters.size,
      timestamp: new Date().toISOString(),
      createdAt: this.optimizationMetrics.createdAt
    });
  }

  /**
   * Check for alerts
   */
  checkAlerts() {
    const newAlerts = [];
    const metrics = this.getOptimizationMetrics();

    // COMPRESSION_INEFFECTIVE
    if (metrics.avgCompressionRatio > 0.9) {
      const alert = Object.freeze({
        type: 'COMPRESSION_INEFFECTIVE',
        severity: 'WARNING',
        value: metrics.avgCompressionRatio,
        message: `Compression ratio ${(metrics.avgCompressionRatio * 100).toFixed(1)}% (little benefit)`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // LATENCY_HIGH
    if (metrics.avgLatencyMs > 1000) {
      const alert = Object.freeze({
        type: 'LATENCY_HIGH',
        severity: 'WARNING',
        value: metrics.avgLatencyMs,
        threshold: 1000,
        message: `Average snapshot latency ${metrics.avgLatencyMs}ms > 1000ms`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // CACHE_HIT_RATE_LOW
    if (metrics.cacheHitRate < 0.3 && metrics.cacheHitRate > 0) {
      const alert = Object.freeze({
        type: 'CACHE_HIT_RATE_LOW',
        severity: 'WARNING',
        value: metrics.cacheHitRate,
        threshold: 0.3,
        message: `Cache hit rate ${(metrics.cacheHitRate * 100).toFixed(1)}% < 30%`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // BLOOM_FILTER_SATURATED
    if (this.bloomFilters.size > this.bloomFilterSize * 0.9) {
      const alert = Object.freeze({
        type: 'BLOOM_FILTER_SATURATED',
        severity: 'WARNING',
        value: this.bloomFilters.size,
        threshold: this.bloomFilterSize,
        message: `Bloom filters at ${((this.bloomFilters.size / this.bloomFilterSize) * 100).toFixed(1)}% capacity`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // Cap alert history
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    return newAlerts;
  }

  /**
   * Get all historical alerts
   */
  getAllAlerts() {
    return [...this.alerts];
  }

  /**
   * INVARIANT: never authoritative
   */
  isAuthoritative() {
    return false;
  }

  /**
   * Reset state (tests)
   */
  reset() {
    this.optimizedSnapshots.clear();
    this.deltaIndex.clear();
    this.cacheStats.clear();
    this.bloomFilters.clear();
    this.accessPatterns = [];
    this.optimizationMetrics = {
      snapshotsOptimized: 0,
      avgCompressionRatio: 1.0,
      avgLatencyMs: 0,
      cacheHitRate: 0,
      predictedHits: 0,
      ttlAdjustments: 0,
      createdAt: new Date().toISOString()
    };
    this.alerts = [];
  }

  // ─── INTERNAL METHODS ───

  _computeDelta(snapshot) {
    // Simplified delta: return only segments not in previous snapshot
    const prevSnapshots = Array.from(this.snapManager.snapshots.values())
      .sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt));

    if (prevSnapshots.length < 2) return null;

    const prevSnapshot = prevSnapshots[1]; // second newest
    const prevBatchIds = new Set(prevSnapshot.segmentsData.map(s => s.batchId));
    const delta = snapshot.segmentsData.filter(s => !prevBatchIds.has(s.batchId));

    return delta.length > 0 ? delta : null;
  }

  _aggressiveCompress(snapshot) {
    // Simplified compression: reduce to essential fields + Huffman-like encoding
    const essential = snapshot.segmentsData.map(seg => ({
      b: seg.batchId,
      ts: new Date(seg.segmentTimestamp).getTime(),
      c: seg.entriesCount
    }));

    const json = JSON.stringify(essential);
    const compressed = Buffer.from(json).toString('base64');

    return {
      data: compressed,
      ratio: compressed.length / JSON.stringify(snapshot.segmentsData).length
    };
  }

  _buildBloomFilter(snapshot) {
    // Simplified Bloom filter: use Set for this implementation
    const filter = {
      values: new Set(),
      query: function(value) {
        return this.values.has(value);
      },
      add: function(value) {
        this.values.add(value);
      }
    };

    // Index all segment timestamps
    snapshot.segmentsData.forEach(seg => {
      filter.add(seg.segmentTimestamp);
    });

    return filter;
  }

  _calculateHitRate() {
    if (this.cacheStats.size === 0) return 0;

    let totalHits = 0;
    let totalQueries = 0;

    this.cacheStats.forEach(stats => {
      totalHits += stats.hits;
      totalQueries += stats.hits + stats.misses;
    });

    return totalQueries > 0 ? totalHits / totalQueries : 0;
  }

  _ttlReasoning(replaysPerDay) {
    if (replaysPerDay > 5) return 'Hot snapshot: frequently replayed';
    if (replaysPerDay > 1) return 'Warm snapshot: occasionally replayed';
    return 'Cold snapshot: rarely or never replayed';
  }
}

module.exports = SnapshotOptimizer;
