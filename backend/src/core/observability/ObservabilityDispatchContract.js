/**
 * ObservabilityDispatchContract.js - Unified observability dispatcher
 * PHASE 3B: Optimization - Centralize all observability emissions
 *
 * Responsibility: Single entry point for all telemetry
 * - No direct logging from engines
 * - All metrics/traces/events through unified dispatcher
 * - Enforce mandatory telemetry fields (traceId, requestId, moduleId, timestamp)
 * - Normalize telemetry structure
 * - Reduce duplicate observability logic across engines
 */

class ObservabilityDispatchContract {
  constructor(logger, metricsCollector, traceCollector, eventCollector) {
    if (!logger || !metricsCollector || !traceCollector || !eventCollector) {
      throw new Error('All collectors required: logger, metrics, trace, events');
    }

    this.logger = logger;
    this.metricsCollector = metricsCollector;
    this.traceCollector = traceCollector;
    this.eventCollector = eventCollector;

    // Dispatch metrics
    this.dispatchMetrics = {
      logsDispatched: 0,
      metricsDispatched: 0,
      tracesDispatched: 0,
      eventsDispatched: 0,
      enforcementErrors: 0
    };
  }

  /**
   * Dispatch log entry with mandatory fields
   * Called by all engines instead of direct logging
   */
  dispatchLog(logData) {
    const normalizedLog = this._normalizeLog(logData);

    try {
      this.logger.emit('log_emitted', {
        logLevel: normalizedLog.level,
        message: normalizedLog.message,
        traceId: normalizedLog.traceId,
        requestId: normalizedLog.requestId,
        moduleId: normalizedLog.moduleId,
        timestamp: normalizedLog.timestamp,
        context: normalizedLog.context || {}
      });

      this.dispatchMetrics.logsDispatched++;
      return { success: true, type: 'log' };

    } catch (error) {
      this.dispatchMetrics.enforcementErrors++;
      return { success: false, type: 'log', error: error.message };
    }
  }

  /**
   * Dispatch metric with mandatory fields
   * Called by all engines instead of direct metric recording
   */
  dispatchMetric(metricData) {
    const normalizedMetric = this._normalizeMetric(metricData);

    try {
      this.metricsCollector.emit('metric_recorded', {
        metricId: normalizedMetric.metricId,
        metricType: normalizedMetric.metricType,
        value: normalizedMetric.value,
        unit: normalizedMetric.unit,
        moduleId: normalizedMetric.moduleId,
        traceId: normalizedMetric.traceId,
        timestamp: normalizedMetric.timestamp,
        labels: normalizedMetric.labels || {}
      });

      this.dispatchMetrics.metricsDispatched++;
      return { success: true, type: 'metric' };

    } catch (error) {
      this.dispatchMetrics.enforcementErrors++;
      return { success: false, type: 'metric', error: error.message };
    }
  }

  /**
   * Dispatch trace event
   * Called by all engines for distributed tracing
   */
  dispatchTrace(traceData) {
    const normalizedTrace = this._normalizeTrace(traceData);

    try {
      if (normalizedTrace.action === 'start') {
        this.traceCollector.emit('trace_started', {
          traceId: normalizedTrace.traceId,
          rootSpanId: normalizedTrace.spanId,
          operationName: normalizedTrace.operationName,
          startTime: normalizedTrace.timestamp,
          entryModule: normalizedTrace.moduleId
        });
      } else if (normalizedTrace.action === 'end') {
        this.traceCollector.emit('trace_completed', {
          traceId: normalizedTrace.traceId,
          status: normalizedTrace.status || 'COMPLETED',
          startTime: normalizedTrace.startTime,
          endTime: normalizedTrace.timestamp,
          duration_ms: normalizedTrace.duration_ms,
          spanCount: normalizedTrace.spanCount || 0,
          moduleCount: normalizedTrace.moduleCount || 0
        });
      } else if (normalizedTrace.action === 'span') {
        this.traceCollector.addSpan(
          normalizedTrace.traceId,
          normalizedTrace.spanName,
          normalizedTrace.duration_ms,
          normalizedTrace.status || 'completed',
          normalizedTrace.tags || {}
        );
      }

      this.dispatchMetrics.tracesDispatched++;
      return { success: true, type: 'trace' };

    } catch (error) {
      this.dispatchMetrics.enforcementErrors++;
      return { success: false, type: 'trace', error: error.message };
    }
  }

  /**
   * Dispatch event
   * Called by all engines for event-based observability
   */
  dispatchEvent(eventData) {
    const normalizedEvent = this._normalizeEvent(eventData);

    try {
      this.eventCollector.emit('observability_event', {
        eventId: normalizedEvent.eventId,
        eventType: normalizedEvent.eventType,
        category: normalizedEvent.category || 'INFRASTRUCTURE',
        payload: normalizedEvent.payload,
        sourceModule: normalizedEvent.moduleId,
        traceId: normalizedEvent.traceId,
        requestId: normalizedEvent.requestId,
        timestamp: normalizedEvent.timestamp,
        severity: normalizedEvent.severity || 'INFO'
      });

      this.dispatchMetrics.eventsDispatched++;
      return { success: true, type: 'event' };

    } catch (error) {
      this.dispatchMetrics.enforcementErrors++;
      return { success: false, type: 'event', error: error.message };
    }
  }

  /**
   * Normalize log data — enforce mandatory fields
   */
  _normalizeLog(logData) {
    const normalized = {
      level: logData.level || 'INFO',
      message: logData.message || '',
      traceId: logData.traceId || 'no-trace',
      requestId: logData.requestId || 'no-request',
      moduleId: logData.moduleId || 'unknown-module',
      timestamp: logData.timestamp || new Date().toISOString(),
      context: logData.context
    };

    // Validate level
    const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
    if (!validLevels.includes(normalized.level)) {
      normalized.level = 'INFO';
    }

    return normalized;
  }

  /**
   * Normalize metric data — enforce mandatory fields
   */
  _normalizeMetric(metricData) {
    return {
      metricId: metricData.metricId || metricData.name || 'unknown-metric',
      metricType: metricData.metricType || 'GAUGE',
      value: metricData.value || 0,
      unit: metricData.unit || 'count',
      moduleId: metricData.moduleId || 'unknown-module',
      traceId: metricData.traceId || 'no-trace',
      timestamp: metricData.timestamp || new Date().toISOString(),
      labels: metricData.labels
    };
  }

  /**
   * Normalize trace data — enforce mandatory fields
   */
  _normalizeTrace(traceData) {
    return {
      action: traceData.action || 'span',
      traceId: traceData.traceId || `trace_${Date.now()}`,
      spanId: traceData.spanId || `span_${Date.now()}`,
      spanName: traceData.spanName || traceData.operationName || 'unknown-operation',
      operationName: traceData.operationName || 'unknown-operation',
      moduleId: traceData.moduleId || 'unknown-module',
      timestamp: traceData.timestamp || new Date().toISOString(),
      startTime: traceData.startTime,
      duration_ms: traceData.duration_ms || 0,
      status: traceData.status,
      spanCount: traceData.spanCount,
      moduleCount: traceData.moduleCount,
      tags: traceData.tags
    };
  }

  /**
   * Normalize event data — enforce mandatory fields
   */
  _normalizeEvent(eventData) {
    return {
      eventId: eventData.eventId || `event_${Date.now()}`,
      eventType: eventData.eventType || eventData.type || 'unknown-event',
      category: eventData.category,
      payload: eventData.payload || {},
      moduleId: eventData.moduleId || 'unknown-module',
      traceId: eventData.traceId || 'no-trace',
      requestId: eventData.requestId || 'no-request',
      timestamp: eventData.timestamp || new Date().toISOString(),
      severity: eventData.severity || 'INFO'
    };
  }

  /**
   * Batch dispatch multiple telemetry items
   * For efficiency in high-throughput scenarios
   */
  dispatchBatch(items) {
    const results = [];

    for (const item of items) {
      let result;
      if (item.type === 'log') {
        result = this.dispatchLog(item);
      } else if (item.type === 'metric') {
        result = this.dispatchMetric(item);
      } else if (item.type === 'trace') {
        result = this.dispatchTrace(item);
      } else if (item.type === 'event') {
        result = this.dispatchEvent(item);
      } else {
        result = { success: false, error: 'unknown_type' };
      }
      results.push(result);
    }

    return {
      total: items.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Get dispatch metrics
   */
  getMetrics() {
    return {
      ...this.dispatchMetrics,
      totalDispatched: Object.values(this.dispatchMetrics).slice(0, 4).reduce((a, b) => a + b, 0),
      errorRate: this.dispatchMetrics.totalDispatched > 0
        ? (this.dispatchMetrics.enforcementErrors / this.dispatchMetrics.totalDispatched * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.dispatchMetrics = {
      logsDispatched: 0,
      metricsDispatched: 0,
      tracesDispatched: 0,
      eventsDispatched: 0,
      enforcementErrors: 0
    };
    return { reset: true };
  }

  /**
   * Validate dispatcher state
   */
  validate() {
    const state = {
      logger: !!this.logger,
      metricsCollector: !!this.metricsCollector,
      traceCollector: !!this.traceCollector,
      eventCollector: !!this.eventCollector,
      allValid: true
    };

    state.allValid = Object.values(state).slice(0, 4).every(v => v === true);
    return state;
  }
}

module.exports = ObservabilityDispatchContract;
