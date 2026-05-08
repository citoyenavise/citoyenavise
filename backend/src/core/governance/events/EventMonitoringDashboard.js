/**
 * EventMonitoringDashboard
 * PHASE 5.4 — Event Monitoring & Alerting Layer
 * PHASE 5.7 — Simplified + Hardened (direct metrics + alert aggregation + export)
 *
 * Dashboard and reporting interface for governance events.
 * - Aggregate metrics from metricsCollector and alertEngine
 * - Real-time system health assessment
 * - Export in JSON, CSV, Markdown formats
 * - No corrective actions (pure observation)
 */

class EventMonitoringDashboard {
  constructor(metricsCollector, alertEngine) {
    this.metricsCollector = metricsCollector;
    this.alertEngine = alertEngine;
  }

  /**
   * Get comprehensive report with metrics and alerts
   */
  getReport({ sampleRate = 1 } = {}) {
    const metrics = this.metricsCollector ? this.metricsCollector.getMetrics() : {};
    const alerts = this.alertEngine ? this.alertEngine.getHistory() : [];

    return {
      timestamp: new Date().toISOString(),
      metrics,
      alerts,
      summary: {
        totalEvents: metrics.summary?.totalEvents || 0,
        successRate: metrics.summary?.successRate || 'N/A',
        alertsGenerated: this.alertEngine?.metrics?.alertsGenerated || 0,
        criticalAlerts: this.alertEngine?.metrics?.alertsByLevel?.CRITICAL || 0
      }
    };
  }

  /**
   * Export report as JSON
   */
  exportJSON() {
    return JSON.stringify(this.getReport(), null, 2);
  }

  /**
   * Export report as CSV
   */
  exportCSV() {
    const report = this.getReport();
    const { metrics, alerts } = report;

    // Metrics section
    const metricsRows = [];
    if (metrics.byType) {
      for (const [type, count] of Object.entries(metrics.byType)) {
        metricsRows.push(`${type},${count},${metrics.bySeverity?.[type] || 'N/A'}`);
      }
    }

    // Alerts section
    const alertRows = alerts.map(a => `${a.eventId},${a.severity || a.level},${a.timestamp}`);

    const csv = [
      '# Metrics',
      'eventType,count,severity',
      ...metricsRows,
      '',
      '# Alerts',
      'eventId,severity,timestamp',
      ...alertRows
    ].join('\n');

    return csv;
  }

  /**
   * Export report as Markdown
   */
  exportMarkdown() {
    const report = this.getReport();
    const { metrics, alerts, summary } = report;

    let md = '# Event Monitoring Dashboard\n\n';
    md += `**Generated:** ${report.timestamp}\n\n`;

    md += '## Summary\n';
    md += `- **Total Events:** ${summary.totalEvents}\n`;
    md += `- **Success Rate:** ${summary.successRate}\n`;
    md += `- **Alerts Generated:** ${summary.alertsGenerated}\n`;
    md += `- **Critical Alerts:** ${summary.criticalAlerts}\n\n`;

    md += '## Metrics by Type\n';
    md += '| Type | Count |\n|------|-------|\n';
    if (metrics.byType) {
      for (const [type, count] of Object.entries(metrics.byType)) {
        md += `| ${type} | ${count} |\n`;
      }
    }
    md += '\n';

    md += '## Recent Alerts\n';
    md += '| Event ID | Severity | Timestamp |\n|----------|----------|-----------||\n';
    alerts.slice(-10).forEach(a => {
      md += `| ${a.eventId} | ${a.severity || a.level} | ${a.timestamp} |\n`;
    });

    return md;
  }

  /**
   * Get system health status
   */
  getHealthStatus() {
    const metrics = this.metricsCollector ? this.metricsCollector.getMetrics() : {};
    const alerts = this.alertEngine ? this.alertEngine.getMetrics() : {};

    let healthScore = 100;

    // Penalty for failure rate
    if (metrics.summary?.failureRate) {
      const errorRate = parseInt(metrics.summary.failureRate) || 0;
      healthScore -= errorRate;
    }

    // Penalty for critical alerts
    const criticalAlerts = alerts.alertsByLevel?.CRITICAL || 0;
    healthScore -= Math.min(criticalAlerts * 5, 20);

    healthScore = Math.max(0, Math.min(100, healthScore));

    const status = healthScore >= 80 ? 'HEALTHY'
      : healthScore >= 60 ? 'DEGRADED'
      : healthScore >= 40 ? 'CRITICAL'
      : 'FAILING';

    return {
      timestamp: new Date().toISOString(),
      healthScore,
      status,
      metrics,
      alerts
    };
  }
}

module.exports = EventMonitoringDashboard;
