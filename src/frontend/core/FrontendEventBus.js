/**
 * FrontendEventBus.js
 * Phase 4 — Système d'événements frontend observable et tracé
 * Gère les émissions/réceptions d'événements avec validation, retry et isolation
 */

class FrontendEventBus {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.eventSchemas = new Map();
    this.metrics = {
      eventsEmitted: 0,
      eventsReceived: 0,
      errors: 0,
      retries: 0,
    };
    this.retryConfig = {
      maxRetries: 3,
      timeout: 5000,
    };
    this.traceId = this.generateTraceId();
  }

  registerSchema(eventType, schema) {
    this.eventSchemas.set(eventType, schema);
  }

  validateEvent(eventType, payload) {
    const schema = this.eventSchemas.get(eventType);
    if (!schema) {
      console.warn(`[EventBus] Pas de schéma pour ${eventType}`);
      return { valid: true, errors: [] };
    }

    const errors = [];
    for (const field of schema.requiredFields || []) {
      if (!(field in payload)) {
        errors.push(`Champ requis manquant: ${field}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  on(eventType, handler, options = {}) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const listener = {
      handler,
      timeout: options.timeout || this.retryConfig.timeout,
      isolated: options.isolated !== false,
      retryable: options.retryable !== false,
      createdAt: new Date().toISOString(),
    };

    this.listeners.get(eventType).push(listener);
    console.log(`[EventBus] Listener enregistré pour ${eventType}`);
  }

  off(eventType, handler) {
    if (!this.listeners.has(eventType)) return;

    const listeners = this.listeners.get(eventType);
    const index = listeners.findIndex(l => l.handler === handler);
    if (index > -1) {
      listeners.splice(index, 1);
      console.log(`[EventBus] Listener retiré pour ${eventType}`);
    }
  }

  async emit(eventType, payload, options = {}) {
    const eventId = this.generateEventId();
    const timestamp = new Date().toISOString();

    // Validation du schéma
    const validation = this.validateEvent(eventType, payload);
    if (!validation.valid) {
      console.error(`[EventBus] Validation échouée pour ${eventType}:`, validation.errors);
      this.metrics.errors++;
      return { success: false, errors: validation.errors };
    }

    // Créer l'événement
    const event = {
      id: eventId,
      type: eventType,
      payload,
      timestamp,
      traceId: options.traceId || this.traceId,
      source: options.source || 'frontend',
      version: options.version || '1.0.0',
    };

    // Enregistrer dans l'historique
    this.eventHistory.push(event);
    this.metrics.eventsEmitted++;

    console.log(`[EventBus] Événement émis: ${eventType} (${eventId})`, event);

    // Notifier les listeners
    if (this.listeners.has(eventType)) {
      const listeners = this.listeners.get(eventType);
      const promises = listeners.map(listener =>
        this.executeListener(listener, event)
      );

      const results = await Promise.allSettled(promises);
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;

      console.log(
        `[EventBus] ${eventType} livré à ${successes}/${listeners.length} listeners`
      );

      if (failures > 0) {
        this.metrics.errors += failures;
      }

      return { success: true, delivered: successes, failed: failures };
    }

    return { success: true, delivered: 0 };
  }

  async executeListener(listener, event) {
    if (!listener.isolated) {
      // Exécution synchrone
      return listener.handler(event);
    }

    // Exécution isolée avec timeout et retry
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = listener.retryable ? this.retryConfig.maxRetries : 1;

      const executeWithRetry = async () => {
        try {
          const timeoutPromise = new Promise((_, rej) =>
            setTimeout(() => rej(new Error('Timeout')), listener.timeout)
          );
          const resultPromise = Promise.resolve(listener.handler(event));
          const result = await Promise.race([resultPromise, timeoutPromise]);
          resolve(result);
        } catch (error) {
          attempts++;
          if (attempts < maxAttempts && listener.retryable) {
            this.metrics.retries++;
            console.log(`[EventBus] Retry ${attempts}/${maxAttempts} pour listener`);
            await new Promise(r => setTimeout(r, 100 * attempts)); // Backoff
            executeWithRetry();
          } else {
            console.error('[EventBus] Listener échoué:', error.message);
            this.metrics.errors++;
            reject(error);
          }
        }
      };

      executeWithRetry();
    });
  }

  getEventHistory(filter = {}) {
    let history = this.eventHistory;

    if (filter.eventType) {
      history = history.filter(e => e.type === filter.eventType);
    }
    if (filter.sinceTimestamp) {
      history = history.filter(e => new Date(e.timestamp) >= new Date(filter.sinceTimestamp));
    }
    if (filter.limit) {
      history = history.slice(-filter.limit);
    }

    return history;
  }

  getMetrics() {
    return {
      ...this.metrics,
      listenerCount: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
      eventTypesRegistered: this.listeners.size,
      historySize: this.eventHistory.length,
    };
  }

  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clear() {
    this.eventHistory = [];
    this.metrics = {
      eventsEmitted: 0,
      eventsReceived: 0,
      errors: 0,
      retries: 0,
    };
  }
}

module.exports = FrontendEventBus;
