/**
 * EventMetricsCollector
 * PHASE 5.4 — Event Monitoring & Alerting Layer
 *
 * Non-intrusive metrics collection on validated events.
 * Subscribes to all events and collects metrics without modifying bus behavior.
 *
 * Responsibilities:
 * - Count events by type and severity
 * - Measure publication, rejection, and failure rates
 * - Track event latencies
 * - Maintain time-series metrics buffer
 * - Expose metrics for reporting
 */

class EventMetricsCollector {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.bufferSize = options.bufferSize || 10000;
    this.metrics = {
      total: 0,
      byType: {},
      bySeverity: {},
      byStatus: {},
      latencies: [],
      errors: [],
      timestamps: []
    };

    this.eventBuffer = [];
    this.startTime = Date.now();
    this.collectionInterval = null;

    // Severity statistics
    this.severityOrder = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    // Initialize severity counters
    this.severityOrder.forEach(sev => {
      this.metrics.bySeverity[sev] = 0;
    });
  }

  /**
   * Record event (called by EventBus subscriber)
   * PHASE 5.6: Support real latency measurement via startTime
   * PHASE 5.7: Validate inputs, clamp latency, normalize severity
   */
  recordEvent(event, status = 'published', startTime = null) {
    if (!this.enabled) return;

    // PHASE 5.7: Guard against null/invalid events
    if (!event || !event.type) return;

    // PHASE 5.6: Real latency measurement (PHASE 5.7: clamp to [0, ∞))
    const processingTime = startTime ? Math.max(0, Date.now() - startTime) : 0;

    // PHASE 5.7: Normalize unknown severity values to 'INFO'
    const knownSeverities = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const severity = knownSeverities.includes(event.severity) ? event.severity : 'INFO';

    const record = {
      eventId: event.id,
      eventType: event.type,
      severity,
      source: event.source,
      status, // published, rejected, failed, migrated, audited
      timestamp: new Date().toISOString(),
      traceId: event.traceId,
      processingTime
    };

    // Add to buffer
    this.eventBuffer.push(record);
    if (this.eventBuffer.length > this.bufferSize) {
      this.eventBuffer.shift();
    }

    // Update aggregates
    this.metrics.total += 1;
    this.metrics.byType[event.type] = (this.metrics.byType[event.type] || 0) + 1;
    this.metrics.bySeverity[severity] += 1;
    this.metrics.byStatus[status] = (this.metrics.byStatus[status] || 0) + 1;
    this.metrics.timestamps.push(new Date());

    // PHASE 5.7: Cap timestamps array to prevent unbounded growth
    if (this.metrics.timestamps.length > 10000) {
      this.metrics.timestamps.shift();
    }

    if (processingTime > 0) {
      this.metrics.latencies.push(processingTime);
      // Cap latencies array to prevent unbounded growth
      if (this.metrics.latencies.length > 10000) {
        this.metrics.latencies.shift();
      }
    }
  }

  /**
   * Record error event
   */
  recordError(error, eventType = 'unknown') {
    if (!this.enabled) return;

    const errorRecord = {
      timestamp: new Date().toISOString(),
      eventType,
      error: error.message || String(error),
      stack: error.stack
    };

    this.metrics.errors.push(errorRecord);
    if (this.metrics.errors.length > 1000) {
      this.metrics.errors.shift();
    }
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgLatency = this.metrics.latencies.length > 0
      ? this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length
      : 0;

    const published = this.metrics.byStatus['published'] || 0;
    const rejected = this.metrics.byStatus['rejected'] || 0;
    const failed = this.metrics.byStatus['failed'] || 0;
    const total = published + rejected + failed;

    return {
      timestamp: new Date().toISOString(),
      uptime_ms: uptime,
      summary: {
        totalEvents: this.metrics.total,
        published: published,
        rejected: rejected,
        failed: failed,
        successRate: total > 0 ? Math.round((published / total) * 100) + '%' : 'N/A',
        rejectionRate: total > 0 ? Math.round((rejected / total) * 100) + '%' : 'N/A',
        failureRate: total > 0 ? Math.round((failed / total) * 100) + '%' : 'N/A'
      },
      byType: { ...this.metrics.byType },
      bySeverity: { ...this.metrics.bySeverity },
      performance: {
        avgLatency_ms: Math.round(avgLatency * 100) / 100,
        maxLatency_ms: Math.max(...this.metrics.latencies, 0),
        minLatency_ms: Math.min(...this.metrics.latencies, Infinity),
        p95_ms: this._percentile(this.metrics.latencies, 95), // PHASE 5.6
        p99_ms: this._percentile(this.metrics.latencies, 99)  // PHASE 5.6
      },
      errorCount: this.metrics.errors.length,
      bufferSize: this.eventBuffer.length,
      enabled: this.enabled
    };
  }

  /**
   * Get events by type
   */
  getEventsByType(type) {
    return this.eventBuffer.filter(e => e.eventType === type);
  }

  /**
   * Get events by severity
   */
  getEventsBySeverity(severity) {
    return this.eventBuffer.filter(e => e.severity === severity);
  }

  /**
   * Get events by status
   */
  getEventsByStatus(status) {
    return this.eventBuffer.filter(e => e.status === status);
  }

  /**
   * Get events in time range
   */
  getEventsByTimeRange(startTime, endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    return this.eventBuffer.filter(e => {
      const time = new Date(e.timestamp).getTime();
      return time >= start && time <= end;
    });
  }

  /**
   * Get recent events
   */
  getRecentEvents(n = 50) {
    return this.eventBuffer.slice(-n);
  }

  /**
   * Get error history
   */
  getErrors(n = 50) {
    return this.metrics.errors.slice(-n);
  }

  /**
   * Get severity distribution
   */
  getSeverityDistribution() {
    const dist = {};
    this.severityOrder.forEach(sev => {
      dist[sev] = this.metrics.bySeverity[sev] || 0;
    });
    return dist;
  }

  /**
   * Get type distribution
   */
  getTypeDistribution() {
    return { ...this.metrics.byType };
  }

  /**
   * Calculate metrics trends
   */
  getTrends(windowSize = 100) {
    const recent = this.eventBuffer.slice(-windowSize);

    const typeCount = {};
    const severityCount = {};
    const statusCount = {};

    for (const event of recent) {
      typeCount[event.eventType] = (typeCount[event.eventType] || 0) + 1;
      severityCount[event.severity] = (severityCount[event.severity] || 0) + 1;
      statusCount[event.status] = (statusCount[event.status] || 0) + 1;
    }

    return {
      window: windowSize,
      eventCount: recent.length,
      byType: typeCount,
      bySeverity: severityCount,
      byStatus: statusCount
    };
  }

  /**
   * Reset metrics (for testing)
   */
  reset() {
    this.metrics = {
      total: 0,
      byType: {},
      bySeverity: {},
      byStatus: {},
      latencies: [],
      errors: [],
      timestamps: []
    };
    this.eventBuffer = [];
    this.startTime = Date.now();
    this.severityOrder.forEach(sev => {
      this.metrics.bySeverity[sev] = 0;
    });
    return { reset: true };
  }

  /**
   * Enable/disable collection
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    return { enabled: this.enabled };
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      enabled: this.enabled,
      metrics: this.getMetrics()
    };
  }

  /**
   * PHASE 5.6: Calculate percentile from latencies array
   */
  _percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return Math.max(0, sorted[Math.max(0, idx)]);
  }
}

module.exports = EventMetricsCollector;
