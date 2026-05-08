/**
 * GovernanceEvent
 * PHASE 5.7 v2 — EVENT MODEL FINAL
 *
 * Événement immuable avec identifiants complets pour traçabilité et déduplication.
 * - eventId: fingerprint global (transport dedup via hash)
 * - traceId: source unique au producer (end-to-end tracking, obligatoire)
 * - ttl: lifecycle event (validité temporelle, obligatoire)
 * - fingerprint: anti-loop detection
 *
 * RÈGLE: Immutabilité totale après création
 */

const crypto = require('crypto');

class GovernanceEvent {
  /**
   * Créer un événement de gouvernance
   * @param {string} type - VIOLATION | HEALING | RECOVERY | HEALTH
   * @param {string} severity - CRITICAL | HIGH | MEDIUM | LOW | INFO
   * @param {string} source - Origine de l'événement
   * @param {object} payload - Données event-spécifiques
   * @param {string} traceId - Identifiant de traçabilité (source unique, obligatoire)
   * @param {number} ttlMs - Time-to-live en ms (default 5 min)
   */
  constructor(type, severity, source, payload, traceId, ttlMs = 5 * 60 * 1000) {
    // Validation obligatoire
    if (!type) throw new Error('type required');
    if (!severity) throw new Error('severity required');
    if (!traceId) throw new Error('traceId required (source unique)');

    // Identifiants immuables
    this.eventId = this._generateEventId(type, severity, source, payload);
    this.traceId = traceId;
    this.fingerprint = this.eventId;

    // Métadonnées
    this.type = type;
    this.severity = severity;
    this.source = source;
    this.payload = payload;
    this.timestamp = Date.now();
    this.createdAt = Date.now();
    this.ttlMs = ttlMs;

    // Marquer comme immuable (RÈGLE: zéro mutation après création)
    Object.freeze(this);
  }

  /**
   * Générer eventId = hash(type|severity|source|payload)
   * Déterministe: même événement = même eventId
   * Utilisé pour dedup au niveau transport
   */
  _generateEventId(type, severity, source, payload) {
    const str = `${type}|${severity}|${source}|${JSON.stringify(payload || {})}`;
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Vérifier si l'événement a expiré (TTL)
   * Appelé uniquement par HardenedEventBus (première étape du pipeline)
   */
  isExpired() {
    return Date.now() - this.createdAt > this.ttlMs;
  }

  /**
   * Clé d'idempotency métier = eventId + traceId
   * Utilisée par orchestrateurs pour éviter double-exécution
   */
  getIdempotencyKey() {
    return `${this.eventId}|${this.traceId}`;
  }

  /**
   * Sérialisation pour audit trail
   */
  toJSON() {
    return {
      eventId: this.eventId,
      traceId: this.traceId,
      type: this.type,
      severity: this.severity,
      source: this.source,
      payload: this.payload,
      timestamp: this.timestamp,
      ttlMs: this.ttlMs,
      createdAt: this.createdAt,
      fingerprint: this.fingerprint
    };
  }

  /**
   * Factory methods pour créer événements typés
   */
  static violation(payload, options = {}) {
    const { severity = 'MEDIUM', source = 'validator', traceId = require('crypto').randomUUID(), ttl = 5 * 60 * 1000 } = options;
    return new GovernanceEvent('VIOLATION', severity, source, payload, traceId, ttl);
  }

  static healing(payload, options = {}) {
    const { severity = 'LOW', source = 'self-healing', traceId = require('crypto').randomUUID(), ttl = 5 * 60 * 1000 } = options;
    return new GovernanceEvent('HEALING', severity, source, payload, traceId, ttl);
  }

  static recovery(payload, options = {}) {
    const { severity = 'CRITICAL', source = 'recovery', traceId = require('crypto').randomUUID(), ttl = 5 * 60 * 1000 } = options;
    return new GovernanceEvent('RECOVERY', severity, source, payload, traceId, ttl);
  }
}

module.exports = GovernanceEvent;
