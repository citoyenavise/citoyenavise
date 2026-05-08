/**
 * AnalyticsModule.js
 * Tracking des événements frontend et envoi vers backend
 * Level 1 (Standalone) — Pas de dépendances inter-modules
 */

class AnalyticsModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.pageViewCount = 0;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async initialize() {
    console.log('[Analytics] Initialisation du module analytics');

    // Enregistrer la session
    this.trackEvent('analytics:session_start', {
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'node',
      timestamp: new Date().toISOString(),
    });

    await this.eventBus.emit('frontend:analytics:ready', {
      sessionId: this.sessionId,
    });
  }

  trackEvent(eventType, data) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      data: { ...data, sessionId: this.sessionId },
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);
    console.log(`[Analytics] Événement tracé: ${eventType}`);

    // Envoyer au backend périodiquement
    this.sendAnalytics();
  }

  trackPageView(pageName, properties = {}) {
    this.pageViewCount++;
    console.log(`[Analytics] Page view: ${pageName}`);

    this.trackEvent('analytics:page_view', {
      pageName,
      pageViewCount: this.pageViewCount,
      ...properties,
    });
  }

  trackError(error) {
    console.error('[Analytics] Erreur tracée:', error);

    this.trackEvent('analytics:error', {
      message: error.message,
      stack: error.stack,
      type: error.name,
    });
  }

  async sendAnalytics() {
    if (this.events.length === 0) return;

    try {
      const response = await fetch('/api/v1/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events: this.events,
        }),
      }).catch(() => {
        // Silencieusement ignoré si le backend n'est pas disponible
        console.warn('[Analytics] Backend non disponible, événements en queue');
      });

      if (response && response.ok) {
        console.log('[Analytics] Événements envoyés au backend');
        this.events = [];

        await this.eventBus.emit('frontend:analytics:event_tracked', {
          eventCount: this.events.length,
        });
      }
    } catch (error) {
      console.error('[Analytics] Erreur d\'envoi:', error);
    }
  }

  getMetrics() {
    return {
      sessionId: this.sessionId,
      pageViewCount: this.pageViewCount,
      eventCount: this.events.length,
      startTime: new Date().toISOString(),
    };
  }
}

module.exports = AnalyticsModule;
