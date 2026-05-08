/**
 * EventBridge
 * PHASE 5.2 — Event-Driven Governance Backbone
 *
 * Connector layer between legacy CAAGS polling system and event-driven backbone.
 * Enables bidirectional flow:
 * - RuntimeValidationEngine → EventBus.publish() [violations]
 * - EventRouter → CAAGS modules [healing, recovery, monitoring]
 * - AutonomousGovernanceOrchestrator remains active as fallback
 *
 * Dual-mode architecture: polling + event-driven working in parallel
 */

const GovernanceEvent = require('./GovernanceEvent');
const GovernanceEventBus = require('./GovernanceEventBus');
const EventClassifier = require('./EventClassifier');
const EventRouter = require('./EventRouter');
const EventStreamProcessor = require('./EventStreamProcessor');

class EventBridge {
  constructor(options = {}) {
    this.eventBus = new GovernanceEventBus(options);
    this.classifier = new EventClassifier(options);
    this.router = new EventRouter(options);
    this.processor = new EventStreamProcessor(options);

    this.caags = null; // Will be injected
    this.metrics = {
      eventsProcessed: 0,
      violationsReceived: 0,
      healingsTriggered: 0,
      recoveriesTriggered: 0,
      healthUpdates: 0
    };
  }

  /**
   * Connect to CAAGS system
   */
  connectToCAGS(caags) {
    if (!caags) throw new Error('caags required');
    this.caags = caags;
    return { connected: true };
  }

  /**
   * Inject violations from RuntimeValidationEngine
   */
  async injectViolations(violations) {
    if (!Array.isArray(violations)) {
      violations = [violations];
    }

    const results = [];
    for (const violation of violations) {
      try {
        // Classify to GovernanceEvent
        const event = this.classifier.classifyViolation(violation);

        // Process through stability layer
        const processed = await this.processor.process(event);
        if (!processed.processed) {
          results.push({ violation: violation.type, status: processed.reason });
          continue;
        }

        // Publish to event bus
        this.eventBus.publish(event);

        // Route to appropriate handler
        await this.router.route(event);

        this.metrics.violationsReceived += 1;
        results.push({ violation: violation.type, status: 'published' });
      } catch (error) {
        results.push({ violation: violation.type, status: 'error', error: error.message });
      }
    }

    return { injected: results.length, results };
  }

  /**
   * Inject healing actions
   */
  async injectHealing(action) {
    try {
      const event = this.classifier.classifyHealing(action);

      const processed = await this.processor.process(event);
      if (!processed.processed) {
        return { injected: false, reason: processed.reason };
      }

      this.eventBus.publish(event);
      await this.router.route(event);

      this.metrics.healingsTriggered += 1;
      return { injected: true, eventId: event.id };
    } catch (error) {
      return { injected: false, error: error.message };
    }
  }

  /**
   * Inject recovery actions
   */
  async injectRecovery(action) {
    try {
      const event = this.classifier.classifyRecovery(action);

      const processed = await this.processor.process(event);
      if (!processed.processed) {
        return { injected: false, reason: processed.reason };
      }

      this.eventBus.publish(event);
      await this.router.route(event);

      this.metrics.recoveriesTriggered += 1;
      return { injected: true, eventId: event.id };
    } catch (error) {
      return { injected: false, error: error.message };
    }
  }

  /**
   * Inject health state
   */
  async injectHealth(healthState) {
    try {
      const event = this.classifier.classifyHealth(healthState);

      const processed = await this.processor.process(event);
      if (!processed.processed) {
        return { injected: false, reason: processed.reason };
      }

      this.eventBus.publish(event);
      await this.router.route(event);

      this.metrics.healthUpdates += 1;
      return { injected: true, eventId: event.id };
    } catch (error) {
      return { injected: false, error: error.message };
    }
  }

  /**
   * Get all events (for debugging/observability)
   */
  getEvents(type = null, n = 100) {
    if (type) {
      return this.eventBus.getEventsByType(type).slice(-n);
    }
    return this.eventBus.replay(n);
  }

  /**
   * Get event stream status
   */
  getStreamStatus() {
    return {
      timestamp: new Date().toISOString(),
      eventBus: this.eventBus.getStatus(),
      classifier: this.classifier.getMetrics(),
      router: this.router.getStatus(),
      processor: this.processor.getStatus(),
      bridge: {
        metrics: { ...this.metrics },
        caagConnected: !!this.caags
      }
    };
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      bridge: { ...this.metrics },
      eventBus: this.eventBus.getMetrics(),
      classifier: this.classifier.getMetrics(),
      router: this.router.getMetrics(),
      processor: this.processor.getMetrics()
    };
  }

  /**
   * Setup default routing with CAAGS modules
   */
  setupWithCAGS(caags) {
    this.connectToCAGS(caags);

    // Setup router with CAAGS modules
    this.router.setupDefaultRouting({
      selfHealingOrchestrator: caags.healingOrchestrator,
      autonomousGovernanceOrchestrator: caags,
      recoveryOrchestrator: caags.recoveryOrchestrator,
      degradationMonitor: caags.healingOrchestrator?.degradationMonitor
    });

    // Subscribe to all events with CAAGS logging
    this.eventBus.subscribe('*', event => {
      caags._logTick({
        eventBridge: 'event_published',
        eventType: event.type,
        eventId: event.id,
        severity: event.severity
      });
    });

    return { setupComplete: true };
  }

  /**
   * Reset all components
   */
  reset() {
    this.eventBus.reset();
    this.classifier.reset();
    this.router.reset();
    this.processor.reset();
    this.metrics = {
      eventsProcessed: 0,
      violationsReceived: 0,
      healingsTriggered: 0,
      recoveriesTriggered: 0,
      healthUpdates: 0
    };
    return { reset: true };
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      connected: !!this.caags,
      metrics: this.getMetrics(),
      systemStatus: this.getStreamStatus()
    };
  }
}

module.exports = EventBridge;
