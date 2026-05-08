/**
 * HardenedEventBus
 * PHASE 5.7 v2 — TRANSPORT DOMAIN (Strict Pipeline)
 *
 * Transport-layer event bus enforcing:
 * - TTL lifecycle (expire stale events)
 * - Idempotency via eventId (no duplicate processing)
 * - Loop detection via traceId (no infinite cycles)
 * - Rate limiting (adaptive backpressure)
 * - Validation + audit trail
 *
 * CRITICAL PIPELINE ORDER (non-negotiable):
 * 1. TTL check (drop if expired, first line of defense)
 * 2. Idempotency (eventId dedup, prevents double-execution)
 * 3. Loop detection (traceId throttle, prevents cycles)
 * 4. Rate limiting (adaptive to load)
 * 5. Validation (schema + sanitize)
 * 6. Audit trail (immutable log)
 * 7. Dispatch (safe to publish)
 *
 * RULE: No business logic in transport. Zero idempotency-metadata handling.
 */

const GovernanceEventBus = require('./GovernanceEventBus');
const EventValidationEngine = require('./EventValidationEngine');
const EventVersionResolver = require('./EventVersionResolver');
const EventAuditTrail = require('./EventAuditTrail');

class HardenedEventBus extends GovernanceEventBus {
  constructor(options = {}) {
    super(options);

    this.validationEngine = new EventValidationEngine(options);
    this.versionResolver = new EventVersionResolver(options);
    this.auditTrail = new EventAuditTrail(options);

    this.rejectedEvents = [];
    this.maxRejectionHistory = 1000;

    // PHASE 5.6: Optional rate limiting
    this.rateLimit = options.rateLimit || null; // events/sec per type (null = disabled)
    this.rateLimitWindow_ms = options.rateLimitWindow_ms || 1000;
    this.publishCounts = new Map(); // type → { count, windowStart }

    // PHASE 5.7: Idempotency & loop detection
    this.processedEventIds = new Map(); // event.id → timestamp
    this.idempotencyWindow_ms = options.idempotencyWindow_ms || 5000;
    this.traceIdCounts = new Map(); // traceId → publishCount
    this.maxPublishesPerTraceId = options.maxPublishesPerTraceId || 10;

    // PHASE 7.0.3: Architecture enforcement guard (optional injection)
    this.enforcementEngine = options.enforcementEngine || null;

    this.metrics = {
      ...this.metrics,
      eventsExpired: 0, // PHASE 5.7: TTL enforcement
      eventsValidated: 0,
      eventsRejected: 0,
      eventsMigrated: 0,
      auditedEvents: 0,
      rateLimited: 0, // PHASE 5.6
      duplicatesRejected: 0, // PHASE 5.7
      loopsDetected: 0 // PHASE 5.7
    };
  }

  /**
   * Hardened publish with strict pipeline (PHASE 5.7 v2)
   * Order is CRITICAL: TTL → Idempotency → Loops → RateLimit → Dispatch
   */
  async publish(event) {
    if (!event) throw new Error('event required');

    // STEP 1 (FIRST): TTL check — drop stale events immediately
    if (event.isExpired && typeof event.isExpired === 'function' && event.isExpired()) {
      this.metrics.eventsExpired = (this.metrics.eventsExpired || 0) + 1;
      return { published: false, reason: 'expired', eventId: event.id, ttlExceeded: true };
    }

    // STEP 2: Idempotency check (transport-level dedup via eventId)
    if (!this._checkIdempotency(event)) {
      const eventId = event.eventId || event.id;
      return { published: false, reason: 'duplicate', eventId };
    }

    // STEP 3: Loop detection via traceId throttle
    if (!this._checkLoopDetection(event)) {
      const eventId = event.eventId || event.id;
      return { published: false, reason: 'loop_detected', eventId };
    }

    // STEP 4: Rate limit (adaptive backpressure)
    if (!this._checkRateLimit(event)) {
      this.metrics.rateLimited += 1;
      const eventId = event.eventId || event.id;
      return { published: false, reason: 'rate_limited', eventId };
    }

    // STEP 4.5 (PHASE 7.0.3): Architecture enforcement pre-publish guard
    if (this.enforcementEngine) {
      const enforceResult = this.enforcementEngine.validateEvent(
        event.type,
        event.source || null,
        event
      );
      if (!enforceResult.valid) {
        this.metrics.eventsRejected += 1;
        return {
          published: false,
          reason: 'architecture_violation',
          action: enforceResult.action,
          eventId: event.eventId || event.id
        };
      }
    }

    try {
      // Step 1: Sanitize (add defaults)
      const sanitized = this.validationEngine.sanitize(event);

      // Step 2: Validate against schema
      const validation = this.validationEngine.validate(sanitized);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.error}`);
      }

      this.metrics.eventsValidated += 1;

      // Step 3: Resolve version
      const versionResolution = this.versionResolver.resolveVersion(sanitized);

      // Step 4: Migrate if needed
      let finalEvent = sanitized;
      if (versionResolution.migrationNeeded) {
        const migration = this.versionResolver.migrate(
          sanitized,
          versionResolution.targetVersion
        );
        if (migration.migrated) {
          finalEvent = migration.event;
          this.metrics.eventsMigrated += 1;
        }
      }

      // Step 5: Append to immutable audit trail
      const auditEntry = this.auditTrail.append(finalEvent);
      this.metrics.auditedEvents += 1;

      // Step 6: Enrich with audit info
      finalEvent.auditTrailId = auditEntry.sequence;
      finalEvent.auditHash = auditEntry.hash;

      // Step 7: Publish to bus (using parent class)
      return super.publish(finalEvent);
    } catch (error) {
      // Log rejection with details
      const rejection = {
        eventId: event.id,
        eventType: event.type,
        error: error.message,
        timestamp: new Date().toISOString(),
        traceId: event.traceId
      };

      this.rejectedEvents.push(rejection);
      if (this.rejectedEvents.length > this.maxRejectionHistory) {
        this.rejectedEvents.shift();
      }

      this.metrics.eventsRejected += 1;

      // RULE: rejection is NOT silent - throw
      throw new Error(
        `Event rejected: ${event.type} - ${error.message}`
      );
    }
  }

  /**
   * Batch publish with validation
   */
  async publishBatch(events) {
    const results = [];

    for (const event of events) {
      try {
        const result = await this.publish(event);
        results.push({
          eventId: event.id,
          status: 'published',
          result
        });
      } catch (error) {
        results.push({
          eventId: event.id,
          status: 'rejected',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Verify audit trail integrity
   */
  verifyIntegrity() {
    return this.auditTrail.verify();
  }

  /**
   * Get audit trail
   */
  getAuditTrail(startIndex = 0, endIndex = null) {
    return this.auditTrail.getRange(startIndex, endIndex);
  }

  /**
   * Replay events from audit trail
   */
  replay(filter = null) {
    return this.auditTrail.replay(filter);
  }

  /**
   * Get rejected events history
   */
  getRejectedEvents(n = 50) {
    return this.rejectedEvents.slice(-n);
  }

  /**
   * Get validation metrics
   */
  getValidationMetrics() {
    return {
      eventBus: super.getMetrics(),
      validation: this.validationEngine.getMetrics(),
      versioning: this.versionResolver.getMetrics(),
      auditTrail: {
        entriesCount: this.auditTrail.getSize(),
        metrics: this.auditTrail.getMetrics()
      },
      bus: {
        eventsValidated: this.metrics.eventsValidated,
        eventsRejected: this.metrics.eventsRejected,
        eventsMigrated: this.metrics.eventsMigrated,
        auditedEvents: this.metrics.auditedEvents
      }
    };
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    const integrity = this.auditTrail.verify();

    return {
      timestamp: new Date().toISOString(),
      busStatus: {
        eventsPublished: this.metrics.eventPublished,
        eventsRejected: this.metrics.eventsRejected,
        rejectionRate: this.metrics.eventPublished > 0
          ? ((this.metrics.eventsRejected / (this.metrics.eventPublished + this.metrics.eventsRejected)) * 100).toFixed(2) + '%'
          : '0%'
      },
      validationStatus: {
        eventsValidated: this.metrics.eventsValidated,
        validationPassRate: this.validationEngine.getMetrics().validationRate + '%'
      },
      versioningStatus: {
        resolutionsAttempted: this.versionResolver.getMetrics().resolutionsAttempted,
        migrationsPerformed: this.metrics.eventsMigrated
      },
      auditStatus: {
        auditTrailSize: this.auditTrail.getSize(),
        integrityVerified: integrity.valid,
        integrityStatus: integrity
      },
      overallCompliance: integrity.valid ? 'compliant' : 'compromised'
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    super.reset();
    this.validationEngine.reset();
    this.versionResolver.reset();
    this.auditTrail.clear();
    this.rejectedEvents = [];
    this.publishCounts.clear(); // PHASE 5.6
    this.processedEventIds.clear(); // PHASE 5.7
    this.traceIdCounts.clear(); // PHASE 5.7
    this.metrics = {
      ...this.metrics,
      eventsExpired: 0, // PHASE 5.7: TTL enforcement
      eventsValidated: 0,
      eventsRejected: 0,
      eventsMigrated: 0,
      auditedEvents: 0,
      rateLimited: 0, // PHASE 5.6
      duplicatesRejected: 0, // PHASE 5.7
      loopsDetected: 0 // PHASE 5.7
    };
    return { reset: true };
  }

  /**
   * PHASE 5.6: Check rate limit before processing
   */
  _checkRateLimit(event) {
    if (!this.rateLimit) return true; // Rate limit disabled

    const now = Date.now();
    const key = event.type;
    const entry = this.publishCounts.get(key) || { count: 0, windowStart: now };

    // New window?
    if (now - entry.windowStart > this.rateLimitWindow_ms) {
      entry.count = 0;
      entry.windowStart = now;
    }

    entry.count += 1;
    this.publishCounts.set(key, entry);

    // Check threshold
    return entry.count <= this.rateLimit;
  }

  /**
   * PHASE 5.7: Check for duplicate event IDs (idempotency)
   * Uses eventId (or fallback to id) for deduplication
   */
  _checkIdempotency(event) {
    const eventId = event.eventId || event.id; // GovernanceEvent uses eventId
    if (!eventId) return true;

    const now = Date.now();

    // Clean expired IDs from window
    for (const [id, ts] of this.processedEventIds) {
      if (now - ts > this.idempotencyWindow_ms) {
        this.processedEventIds.delete(id);
      }
    }

    if (this.processedEventIds.has(eventId)) {
      this.metrics.duplicatesRejected = (this.metrics.duplicatesRejected || 0) + 1;
      return false; // Duplicate detected
    }

    this.processedEventIds.set(eventId, now);
    return true;
  }

  /**
   * PHASE 5.7: Check for event loops via traceId publication count
   */
  _checkLoopDetection(event) {
    if (!event.traceId) return true;

    const count = (this.traceIdCounts.get(event.traceId) || 0) + 1;
    this.traceIdCounts.set(event.traceId, count);

    if (count > this.maxPublishesPerTraceId) {
      this.metrics.loopsDetected = (this.metrics.loopsDetected || 0) + 1;
      return false; // Loop detected
    }

    return true;
  }
}

module.exports = HardenedEventBus;
