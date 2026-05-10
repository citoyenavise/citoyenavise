/**
 * KernelPerformanceProfiler
 * PHASE 8.5 — Global Kernel Runtime Profiling
 *
 * Captures performance metrics across entire kernel.
 *
 * CRITICAL:
 * ✔ deterministic metric collection
 * ✔ hotspot identification
 * ✔ per-component latency tracking
 * ✔ immutable performance history
 */

class KernelPerformanceProfiler {
  constructor(options = {}) {
    // Component metrics: componentId → { latencies[], executions, avgMs, p99Ms }
    this.componentMetrics = new Map();

    // Global metrics: { throughput, avgLatency, errorRate, timestamp }
    this.globalMetrics = [];
    this.maxGlobalHistorySize = options.maxGlobalHistorySize || 1000;

    // Hotspot detection: { componentId, latencyMs, frequency }
    this.hotspots = [];
    this.hotspotThreshold = options.hotspotThreshold || 100; // ms

    // Per-shard metrics: shardId → { executions, avgLatency, loadFactor }
    this.shardMetrics = new Map();

    // Metrics
    this.stats = {
      componentsTracked: 0,
      metricsCollected: 0,
      hotspotsDetected: 0,
      lastProfile: null
    };
  }

  /**
   * Record component execution
   */
  recordExecution(componentId, latencyMs) {
    if (!componentId || typeof latencyMs !== 'number') {
      return { recorded: false, reason: 'INVALID_INPUT' };
    }

    try {
      if (!this.componentMetrics.has(componentId)) {
        this.componentMetrics.set(componentId, {
          componentId,
          latencies: [],
          executions: 0,
          avgMs: 0,
          p99Ms: 0
        });
      }

      const metrics = this.componentMetrics.get(componentId);
      metrics.latencies.push(latencyMs);
      metrics.executions++;

      // Calculate average
      const sum = metrics.latencies.reduce((a, b) => a + b, 0);
      metrics.avgMs = sum / metrics.latencies.length;

      // Calculate p99 (99th percentile)
      if (metrics.latencies.length > 0) {
        const sorted = [...metrics.latencies].sort((a, b) => a - b);
        const p99Index = Math.ceil(sorted.length * 0.99) - 1;
        metrics.p99Ms = sorted[Math.max(0, p99Index)];
      }

      // Detect hotspots
      if (latencyMs > this.hotspotThreshold) {
        this.hotspots.push({
          componentId,
          latencyMs,
          timestamp: Date.now(),
          detectedAt: this.stats.metricsCollected
        });

        if (this.hotspots.length > 100) {
          this.hotspots.shift();
        }

        this.stats.hotspotsDetected++;
      }

      this.stats.metricsCollected++;

      return {
        recorded: true,
        componentId,
        latencyMs,
        avgMs: metrics.avgMs.toFixed(2)
      };
    } catch (err) {
      return {
        recorded: false,
        error: err.message
      };
    }
  }

  /**
   * Record shard execution metrics
   */
  recordShardExecution(shardId, latencyMs, executionCount = 1) {
    if (!shardId) {
      return { recorded: false, reason: 'INVALID_SHARD_ID' };
    }

    try {
      if (!this.shardMetrics.has(shardId)) {
        this.shardMetrics.set(shardId, {
          shardId,
          executions: 0,
          totalLatency: 0,
          avgLatency: 0,
          loadFactor: 0
        });
      }

      const metrics = this.shardMetrics.get(shardId);
      metrics.executions += executionCount;
      metrics.totalLatency += latencyMs;
      metrics.avgLatency = metrics.totalLatency / metrics.executions;

      // Load factor: relative to average across all shards
      metrics.loadFactor = metrics.avgLatency;

      return {
        recorded: true,
        shardId,
        loadFactor: metrics.loadFactor.toFixed(2)
      };
    } catch (err) {
      return {
        recorded: false,
        error: err.message
      };
    }
  }

  /**
   * Capture global metrics snapshot
   */
  captureGlobalMetrics() {
    try {
      const totalExecutions = Array.from(this.componentMetrics.values()).reduce(
        (sum, m) => sum + m.executions,
        0
      );

      let totalLatency = 0;
      let componentCount = 0;

      for (const metrics of this.componentMetrics.values()) {
        totalLatency += metrics.avgMs * metrics.executions;
        componentCount++;
      }

      const avgLatency = totalExecutions > 0 ? totalLatency / totalExecutions : 0;
      const throughput = totalExecutions; // Operations per profiling window

      const snapshot = Object.freeze({
        throughput,
        avgLatency: avgLatency.toFixed(2),
        componentCount,
        hotspotsDetected: this.hotspots.length,
        shardsTracked: this.shardMetrics.size,
        timestamp: Date.now()
      });

      this.globalMetrics.push(snapshot);

      if (this.globalMetrics.length > this.maxGlobalHistorySize) {
        this.globalMetrics.shift();
      }

      this.stats.lastProfile = Date.now();

      return {
        captured: true,
        metrics: snapshot
      };
    } catch (err) {
      return {
        captured: false,
        error: err.message
      };
    }
  }

  /**
   * Get component metrics
   */
  getComponentMetrics(componentId = null) {
    if (componentId) {
      const metrics = this.componentMetrics.get(componentId);
      return metrics ? { available: true, metrics } : { available: false };
    }

    const allMetrics = Array.from(this.componentMetrics.values()).map(m => ({
      componentId: m.componentId,
      executions: m.executions,
      avgMs: m.avgMs.toFixed(2),
      p99Ms: m.p99Ms.toFixed(2)
    }));

    return {
      available: true,
      componentCount: allMetrics.length,
      metrics: allMetrics
    };
  }

  /**
   * Get shard metrics
   */
  getShardMetrics() {
    const metrics = Array.from(this.shardMetrics.values()).map(m => ({
      shardId: m.shardId,
      executions: m.executions,
      avgLatency: m.avgLatency.toFixed(2),
      loadFactor: m.loadFactor.toFixed(2)
    }));

    return {
      available: true,
      shardCount: metrics.length,
      metrics
    };
  }

  /**
   * Get detected hotspots
   */
  getHotspots(limit = 20) {
    return {
      detected: this.hotspots.length > 0,
      hotspotsDetected: this.hotspots.length,
      hotspots: this.hotspots.slice(-limit)
    };
  }

  /**
   * Get global metrics history
   */
  getGlobalMetricsHistory(limit = 50) {
    return {
      available: true,
      historySize: this.globalMetrics.length,
      metrics: this.globalMetrics.slice(-limit)
    };
  }

  /**
   * Identify slowest components
   */
  identifyBottlenecks(limit = 10) {
    const sorted = Array.from(this.componentMetrics.values())
      .sort((a, b) => b.avgMs - a.avgMs)
      .slice(0, limit)
      .map(m => ({
        componentId: m.componentId,
        avgMs: m.avgMs.toFixed(2),
        p99Ms: m.p99Ms.toFixed(2),
        executions: m.executions
      }));

    return {
      bottlenecks: sorted,
      count: sorted.length
    };
  }

  /**
   * Get profiler statistics
   */
  getStats() {
    return {
      ...this.stats,
      componentsTracked: this.componentMetrics.size,
      shardsTracked: this.shardMetrics.size,
      globalMetricsStored: this.globalMetrics.length,
      timestamp: Date.now()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.componentMetrics.clear();
    this.globalMetrics = [];
    this.hotspots = [];
    this.shardMetrics.clear();
    this.stats = {
      componentsTracked: 0,
      metricsCollected: 0,
      hotspotsDetected: 0,
      lastProfile: null
    };
  }
}

module.exports = KernelPerformanceProfiler;
