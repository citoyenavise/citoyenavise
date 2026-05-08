/**
 * RuntimeTraceCollector.js - Collect distributed traces from runtime
 * PHASE 1.5: Observability Layer
 *
 * Responsibility: Collect traces of operations through all layers
 * - Trace operation flow
 * - Collect timing data
 * - Build causality chains
 * - Generate distributed traces
 * - Support correlation IDs
 */

class RuntimeTraceCollector {
  constructor(constitutionManager) {
    this.constitutionManager = constitutionManager;
    this.traces = [];
    this.activeTraces = new Map();
    this.spanIdCounter = 0;
    this.traceIdCounter = 0;
  }

  /**
   * Start a new trace
   */
  startTrace(operationName, context = {}) {
    const traceId = `trace_${++this.traceIdCounter}`;
    const spanId = `span_${++this.spanIdCounter}`;

    const trace = {
      traceId,
      spanId,
      operationName,
      startTime: Date.now(),
      startTimestamp: new Date().toISOString(),
      context,
      spans: [],
      status: 'active'
    };

    this.traces.push(trace);
    this.activeTraces.set(traceId, trace);

    return traceId;
  }

  /**
   * Add span to trace
   */
  addSpan(traceId, spanName, duration_ms, status = 'completed', tags = {}) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      return { success: false, reason: 'trace_not_found' };
    }

    const span = {
      spanId: `span_${++this.spanIdCounter}`,
      spanName,
      duration_ms,
      status,
      tags,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now()
    };

    trace.spans.push(span);

    return { success: true, spanId: span.spanId };
  }

  /**
   * End trace
   */
  endTrace(traceId, finalStatus = 'completed') {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      return { success: false, reason: 'trace_not_found' };
    }

    trace.endTime = Date.now();
    trace.endTimestamp = new Date().toISOString();
    trace.totalDuration_ms = trace.endTime - trace.startTime;
    trace.status = finalStatus;

    this.activeTraces.delete(traceId);

    // Keep only last 1000 traces
    if (this.traces.length > 1000) {
      this.traces.shift();
    }

    return {
      success: true,
      traceId,
      duration_ms: trace.totalDuration_ms,
      spanCount: trace.spans.length
    };
  }

  /**
   * Get trace by ID
   */
  getTrace(traceId) {
    return this.traces.find(t => t.traceId === traceId) ||
           this.activeTraces.get(traceId);
  }

  /**
   * Get all completed traces
   */
  getCompletedTraces(limit = 100) {
    return this.traces
      .filter(t => t.status === 'completed')
      .slice(-limit);
  }

  /**
   * Get active traces
   */
  getActiveTraces() {
    return Array.from(this.activeTraces.values());
  }

  /**
   * Get traces by operation
   */
  getTracesByOperation(operationName, limit = 50) {
    return this.traces
      .filter(t => t.operationName === operationName)
      .slice(-limit);
  }

  /**
   * Get traces in time range
   */
  getTracesByTimeRange(startTime, endTime, limit = 100) {
    return this.traces
      .filter(t => t.startTime >= startTime && t.startTime <= endTime)
      .slice(0, limit);
  }

  /**
   * Get slow traces
   */
  getSlowTraces(thresholdMs = 1000, limit = 50) {
    return this.traces
      .filter(t => t.totalDuration_ms && t.totalDuration_ms > thresholdMs)
      .sort((a, b) => b.totalDuration_ms - a.totalDuration_ms)
      .slice(0, limit);
  }

  /**
   * Get failed traces
   */
  getFailedTraces(limit = 50) {
    return this.traces
      .filter(t => t.status === 'failed' || t.status === 'error')
      .slice(-limit);
  }

  /**
   * Get trace statistics
   */
  getStatistics() {
    const completed = this.traces.filter(t => t.status === 'completed');
    const failed = this.traces.filter(t => t.status !== 'completed');
    const durations = completed
      .map(t => t.totalDuration_ms || 0)
      .filter(d => d > 0);

    return {
      totalTraces: this.traces.length,
      completedTraces: completed.length,
      failedTraces: failed.length,
      activeTraces: this.activeTraces.size,
      averageDuration_ms: durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
      minDuration_ms: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration_ms: durations.length > 0 ? Math.max(...durations) : 0,
      successRate: completed.length > 0
        ? ((completed.length / (completed.length + failed.length)) * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }

  /**
   * Create causality chain
   */
  createCausalityChain(traces) {
    const chain = [];

    for (const trace of traces) {
      chain.push({
        traceId: trace.traceId,
        operation: trace.operationName,
        duration_ms: trace.totalDuration_ms,
        status: trace.status,
        spanCount: trace.spans.length,
        timestamp: trace.startTimestamp
      });
    }

    return chain;
  }

  /**
   * Get operation flow
   */
  getOperationFlow(traceId) {
    const trace = this.getTrace(traceId);
    if (!trace) {
      return null;
    }

    return {
      traceId,
      operation: trace.operationName,
      startTime: trace.startTimestamp,
      endTime: trace.endTimestamp,
      totalDuration_ms: trace.totalDuration_ms,
      spanCount: trace.spans.length,
      spans: trace.spans.map(s => ({
        name: s.spanName,
        duration_ms: s.duration_ms,
        status: s.status,
        timestamp: s.timestamp
      })),
      status: trace.status
    };
  }

  /**
   * Generate trace report
   */
  generateTraceReport(limit = 10) {
    const stats = this.getStatistics();
    const slowTraces = this.getSlowTraces(1000, limit);
    const failedTraces = this.getFailedTraces(limit);

    return {
      timestamp: new Date().toISOString(),
      statistics: stats,
      slowTraces: slowTraces.map(t => ({
        traceId: t.traceId,
        operation: t.operationName,
        duration_ms: t.totalDuration_ms,
        spanCount: t.spans.length
      })),
      failedTraces: failedTraces.map(t => ({
        traceId: t.traceId,
        operation: t.operationName,
        status: t.status
      }))
    };
  }

  /**
   * Export traces
   */
  exportTraces(filename) {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        traceCount: this.traces.length,
        statistics: this.getStatistics(),
        traces: this.traces.slice(-100) // Last 100 traces
      };

      const fs = require('fs');
      fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');

      return { success: true, filename, traceCount: this.traces.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear traces (keep summary)
   */
  clearTraces() {
    const clearedCount = this.traces.length;
    this.traces = [];
    this.activeTraces.clear();

    return { clearedTraces: clearedCount };
  }

  /**
   * Track security event (PHASE 1.7)
   */
  trackSecurityEvent(eventType, data = {}) {
    const event = {
      id: `sec_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      data,
      traceId: data.traceId || null,
      requestId: data.requestId || null
    };

    // Log to console for immediate visibility
    const severity = data.severity || 'MEDIUM';
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      console.warn(`[SECURITY] ${eventType}: ${data.message || ''}`);
    } else {
      console.log(`[SECURITY] ${eventType}: ${data.message || ''}`);
    }

    return event;
  }

  /**
   * Track access violation (PHASE 1.7)
   */
  trackAccessViolation(requester, capability, reason, severity = 'MEDIUM') {
    return this.trackSecurityEvent('access_violation_blocked', {
      requester,
      capability,
      reason,
      severity,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track capability access granted (PHASE 1.7)
   */
  trackCapabilityAccessGranted(requester, capability, auditRequired = false) {
    return this.trackSecurityEvent('capability_access_granted', {
      requester,
      capability,
      auditRequired,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track module boundary violation (PHASE 1.7)
   */
  trackModuleBoundaryViolation(source, target, reason) {
    return this.trackSecurityEvent('module_boundary_violation_detected', {
      source,
      target,
      reason,
      severity: 'HIGH',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track identity mismatch (PHASE 1.7)
   */
  trackIdentityMismatch(expectedIdentity, actualIdentity, reason) {
    return this.trackSecurityEvent('identity_mismatch_detected', {
      expectedIdentity,
      actualIdentity,
      reason,
      severity: 'HIGH',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = RuntimeTraceCollector;
