/**
 * EventRouter
 * PHASE 5.2 — Event-Driven Governance Backbone
 *
 * Routes governance events to appropriate handlers based on type and severity.
 * Severity routing:
 * - LOW/MEDIUM → SelfHealingOrchestrator
 * - HIGH → AutonomousGovernanceOrchestrator
 * - CRITICAL → RecoveryOrchestrator
 * - HEALTH → DegradationMonitor
 */

class EventRouter {
  constructor(options = {}) {
    this.handlers = new Map();
    this.metrics = {
      eventsRouted: 0,
      routingErrors: 0,
      eventsByRoute: {}
    };
  }

  /**
   * Register a handler for event type/severity combination
   */
  registerHandler(type, severity, handler) {
    if (!type || !handler) throw new Error('type and handler required');

    const key = severity ? `${type}:${severity}` : type;
    this.handlers.set(key, handler);

    return () => this.unregisterHandler(type, severity);
  }

  /**
   * Unregister a handler
   */
  unregisterHandler(type, severity) {
    const key = severity ? `${type}:${severity}` : type;
    return this.handlers.delete(key);
  }

  /**
   * Route an event to appropriate handler
   */
  async route(event) {
    if (!event) throw new Error('event required');

    try {
      // Try specific handler (type:severity)
      let handler = this._getHandler(event.type, event.severity);

      // Fall back to type-only handler
      if (!handler) {
        handler = this._getHandler(event.type, null);
      }

      // Fall back to default handler
      if (!handler) {
        handler = this._getDefaultHandler(event);
      }

      if (handler) {
        await handler(event);
        this._recordRoute(event.type, event.severity);
        return { routed: true, type: event.type, severity: event.severity };
      }

      // No handler found
      this._recordRoute(event.type, 'unhandled');
      return { routed: false, reason: 'no_handler', type: event.type };
    } catch (error) {
      this.metrics.routingErrors += 1;
      throw error;
    }
  }

  /**
   * Route multiple events
   */
  async routeMultiple(events) {
    const results = [];
    for (const event of events) {
      try {
        const result = await this.route(event);
        results.push(result);
      } catch (error) {
        results.push({ routed: false, error: error.message });
      }
    }
    return results;
  }

  /**
   * Set up default routing (convenience)
   */
  setupDefaultRouting(handlers = {}) {
    const {
      selfHealingOrchestrator,
      autonomousGovernanceOrchestrator,
      recoveryOrchestrator,
      degradationMonitor
    } = handlers;

    // LOW/MEDIUM violations → SelfHealing
    if (selfHealingOrchestrator) {
      this.registerHandler('VIOLATION', 'LOW', event =>
        selfHealingOrchestrator.runHealingCycle([event.payload])
      );
      this.registerHandler('VIOLATION', 'MEDIUM', event =>
        selfHealingOrchestrator.runHealingCycle([event.payload])
      );
    }

    // HIGH violations → CAAGS
    if (autonomousGovernanceOrchestrator) {
      this.registerHandler('VIOLATION', 'HIGH', event =>
        autonomousGovernanceOrchestrator._logTick({
          eventBridge: 'high_violation',
          event: event.id
        })
      );
    }

    // CRITICAL violations → Recovery
    if (recoveryOrchestrator) {
      this.registerHandler('VIOLATION', 'CRITICAL', event =>
        recoveryOrchestrator.executeRecovery(
          new Error(event.payload.message || 'CRITICAL_VIOLATION'),
          { violation: event.payload, source: 'event-router' }
        )
      );
      this.registerHandler('RECOVERY', null, event =>
        recoveryOrchestrator.executeRecovery(
          new Error(event.payload.reason || 'RECOVERY_REQUIRED'),
          { action: event.payload, source: 'event-router' }
        )
      );
    }

    // HEALTH events → DegradationMonitor
    if (degradationMonitor) {
      this.registerHandler('HEALTH', null, event =>
        degradationMonitor.recordHealthState(event.payload)
      );
    }

    // HEALING events → SelfHealing logging
    if (selfHealingOrchestrator) {
      this.registerHandler('HEALING', null, event =>
        selfHealingOrchestrator.auditTrail.logCorrectionOutcome(
          event.payload.correctionId,
          event.payload.applied,
          { reason: event.payload.reason }
        )
      );
    }

    return { setupComplete: true };
  }

  /**
   * Get routing metrics
   */
  getMetrics() {
    return {
      eventsRouted: this.metrics.eventsRouted,
      routingErrors: this.metrics.routingErrors,
      eventsByRoute: { ...this.metrics.eventsByRoute },
      handlersRegistered: this.handlers.size
    };
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      handlersRegistered: Array.from(this.handlers.keys())
    };
  }

  /**
   * Reset
   */
  reset() {
    this.handlers.clear();
    this.metrics = {
      eventsRouted: 0,
      routingErrors: 0,
      eventsByRoute: {}
    };
    return { reset: true };
  }

  /**
   * Private: Get handler
   */
  _getHandler(type, severity) {
    const key = severity ? `${type}:${severity}` : type;
    return this.handlers.get(key);
  }

  /**
   * Private: Get default handler based on severity
   */
  _getDefaultHandler(event) {
    const levelMap = {
      'INFO': null,
      'LOW': null,
      'MEDIUM': null,
      'HIGH': null,
      'CRITICAL': null
    };

    return levelMap[event.severity];
  }

  /**
   * Private: Record route decision
   */
  _recordRoute(type, severity) {
    this.metrics.eventsRouted += 1;
    const key = severity ? `${type}:${severity}` : type;
    this.metrics.eventsByRoute[key] = (this.metrics.eventsByRoute[key] || 0) + 1;
  }
}

module.exports = EventRouter;
