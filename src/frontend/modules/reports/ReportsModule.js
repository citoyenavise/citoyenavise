/**
 * ReportsModule.js — Level 2 (Domain) — Dépend de : auth, users
 */
class ReportsModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.reports = new Map();
  }

  async initialize() {
    console.log('[Reports] Initialisation');
    await this.eventBus.emit('frontend:reports:ready', { timestamp: new Date().toISOString() });
  }

  async submitReport(userId, contentId, contentType, reason) {
    const response = await fetch('/api/v1/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, contentId, contentType, reason }),
    });
    const report = await response.json();
    this.reports.set(report.id, report);
    await this.eventBus.emit('frontend:reports:created', { reportId: report.id, contentId });
    return report;
  }

  getReports() {
    return Array.from(this.reports.values());
  }
}
module.exports = ReportsModule;
