/**
 * GovernanceEventBus
 * PHASE 5.2 — Event-Driven Governance Backbone
 *
 * Central event bus for governance system.
 * Manages event publishing, subscriptions, and metrics.
 */

class GovernanceEventBus {
  constructor(options = {}) {
    this.subscribers = new Map();
    this.eventHistory = [];
    this.maxHistorySize = options.maxHistorySize || 1000;
    this.metrics = {
      eventPublished: 0,
      eventsByType: {},
      subscribersActive: 0,
      handlerErrors: 0 // PHASE 5.6: Track handler failures
    };
  }

  /**
   * Publish an event
   */
  publish(event) {
    if (!event) throw new Error('event required');

    // Track metrics
    this.metrics.eventPublished += 1;
    this.metrics.eventsByType[event.type] = (this.metrics.eventsByType[event.type] || 0) + 1;

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify subscribers
    const subscribers = this.subscribers.get(event.type) || [];
    for (const handler of subscribers) {
      try {
        handler(event);
      } catch (error) {
        // PHASE 5.6: Track handler errors (isolation prevents cascade)
        this.metrics.handlerErrors += 1;
        console.error(`Event handler error for ${event.type}:`, error.message);
      }
    }

    // Notify wildcard subscribers
    const wildcardSubscribers = this.subscribers.get('*') || [];
    for (const handler of wildcardSubscribers) {
      try {
        handler(event);
      } catch (error) {
        // PHASE 5.6: Track handler errors
        this.metrics.handlerErrors += 1;
        console.error('Wildcard event handler error:', error.message);
      }
    }

    return { published: true, eventId: event.id };
  }

  /**
   * Subscribe to event type
   */
  subscribe(type, handler) {
    if (!type || !handler) throw new Error('type and handler required');

    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, []);
    }

    const handlers = this.subscribers.get(type);
    handlers.push(handler);
    this.metrics.subscribersActive = this._countSubscribers();

    // Return unsubscribe function
    return () => this.unsubscribe(type, handler);
  }

  /**
   * Unsubscribe from event type
   */
  unsubscribe(type, handler) {
    if (!this.subscribers.has(type)) return false;

    const handlers = this.subscribers.get(type);
    const index = handlers.indexOf(handler);

    if (index === -1) return false;

    handlers.splice(index, 1);
    this.metrics.subscribersActive = this._countSubscribers();

    return true;
  }

  /**
   * Get subscriber count by type
   */
  getSubscriberCount(type) {
    if (type === '*') {
      return this._countSubscribers();
    }
    return (this.subscribers.get(type) || []).length;
  }

  /**
   * Get event metrics
   */
  getMetrics() {
    return {
      eventPublished: this.metrics.eventPublished,
      eventsByType: { ...this.metrics.eventsByType },
      subscribersActive: this.metrics.subscribersActive,
      historySize: this.eventHistory.length
    };
  }

  /**
   * Replay last N events
   */
  replay(n = 10) {
    if (n <= 0) return [];
    return this.eventHistory.slice(-n);
  }

  /**
   * Get all events of a type
   */
  getEventsByType(type) {
    return this.eventHistory.filter(e => e.type === type);
  }

  /**
   * Get events in time range
   */
  getEventsByTimeRange(startTime, endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    return this.eventHistory.filter(e => {
      const time = new Date(e.timestamp).getTime();
      return time >= start && time <= end;
    });
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.eventHistory = [];
    return { cleared: true };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.subscribers.clear();
    this.eventHistory = [];
    this.metrics = {
      eventPublished: 0,
      eventsByType: {},
      subscribersActive: 0
    };
    return { reset: true };
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      historySize: this.eventHistory.length,
      subscribersByType: this._getSubscribersByType()
    };
  }

  /**
   * Private: Count total subscribers
   */
  _countSubscribers() {
    let count = 0;
    for (const [, handlers] of this.subscribers) {
      count += handlers.length;
    }
    return count;
  }

  /**
   * Private: Get subscriber distribution
   */
  _getSubscribersByType() {
    const dist = {};
    for (const [type, handlers] of this.subscribers) {
      dist[type] = handlers.length;
    }
    return dist;
  }
}

module.exports = GovernanceEventBus;
