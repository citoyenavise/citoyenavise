/**
 * AnalyticsService.js
 * Service de collecte des métriques frontend
 */

class AnalyticsService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.metrics = new Map();
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  trackMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push(metric);

    console.log(`[AnalyticsService] Métrique: ${name} = ${value}`);
  }

  recordPageLoad(pageName, duration) {
    this.trackMetric('page_load_time', duration, { page: pageName });
  }

  recordAPICall(endpoint, duration, success = true) {
    this.trackMetric('api_call_duration', duration, { endpoint, success });
  }

  recordError(error, context = {}) {
    this.trackMetric('error_count', 1, { error: error.message, ...context });
  }

  getMetrics(name) {
    if (name) {
      return this.metrics.get(name) || [];
    }
    return Object.fromEntries(this.metrics);
  }

  reset() {
    this.metrics.clear();
  }
}

module.exports = AnalyticsService;
