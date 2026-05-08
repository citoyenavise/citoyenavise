/**
 * EventStreamProcessor
 * PHASE 5.2 — Event-Driven Governance Backbone
 *
 * Stability layer for event processing.
 * Handles:
 * - Deduplication
 * - Throttling
 * - Batching
 * - Retry queue
 * - Replay buffer
 */

class EventStreamProcessor {
  constructor(options = {}) {
    this.seenEventIds = new Set();
    this.deduplicationWindow_ms = options.deduplicationWindow_ms || 5000;
    this.throttleWindow_ms = options.throttleWindow_ms || 1000;
    this.batchSize = options.batchSize || 10;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryBackoff_ms = options.retryBackoff_ms || 1000;

    this.eventBuffer = [];
    this.retryQueue = [];
    this.replayBuffer = [];
    this.maxReplaySize = options.maxReplaySize || 500;

    this.lastThrottleTime = new Map();
    this.metrics = {
      eventsProcessed: 0,
      eventsDuplicate: 0,
      eventsThrottled: 0,
      eventsBatched: 0,
      retryAttempts: 0,
      replaySize: 0
    };
  }

  /**
   * Process event through stability checks
   */
  async process(event) {
    if (!event) throw new Error('event required');

    // Step 1: Deduplication
    if (this._isDuplicate(event)) {
      this.metrics.eventsDuplicate += 1;
      return { processed: false, reason: 'duplicate' };
    }

    // Step 2: Throttling
    if (this._isThrottled(event)) {
      this.metrics.eventsThrottled += 1;
      return { processed: false, reason: 'throttled' };
    }

    // Step 3: Add to replay buffer
    this._addToReplayBuffer(event);

    // Step 4: Mark as seen
    this._markEventSeen(event);

    // Step 5: Buffer or process
    this.eventBuffer.push(event);
    this.metrics.eventsProcessed += 1;

    return { processed: true, eventId: event.id };
  }

  /**
   * Process batch of events
   */
  async processBatch(events) {
    const results = [];
    for (const event of events) {
      const result = await this.process(event);
      results.push(result);
    }
    return results;
  }

  /**
   * Get buffered events (optionally flush)
   */
  getBuffer(flush = false) {
    const buffer = [...this.eventBuffer];
    if (flush) {
      this.eventBuffer = [];
    }
    return buffer;
  }

  /**
   * Flush event buffer in batches
   */
  flushInBatches() {
    const batches = [];
    for (let i = 0; i < this.eventBuffer.length; i += this.batchSize) {
      batches.push(this.eventBuffer.slice(i, i + this.batchSize));
    }
    this.metrics.eventsBatched += batches.length;
    return batches;
  }

  /**
   * Add event to retry queue
   */
  queueForRetry(event, attempt = 1) {
    if (attempt > this.retryAttempts) {
      return { queued: false, reason: 'max_retries_exceeded' };
    }

    this.retryQueue.push({
      event,
      attempt,
      nextRetry: Date.now() + this.retryBackoff_ms * attempt
    });

    this.metrics.retryAttempts += 1;
    return { queued: true, attempt };
  }

  /**
   * Process retry queue
   */
  processRetryQueue() {
    const now = Date.now();
    const ready = [];
    const remaining = [];

    for (const item of this.retryQueue) {
      if (item.nextRetry <= now) {
        ready.push(item);
      } else {
        remaining.push(item);
      }
    }

    this.retryQueue = remaining;
    return ready;
  }

  /**
   * Get replay buffer (last N events)
   */
  getReplayBuffer(n = null) {
    if (n === null) return [...this.replayBuffer];
    return this.replayBuffer.slice(-n);
  }

  /**
   * Replay events
   */
  replay(n = 10) {
    return this.getReplayBuffer(n);
  }

  /**
   * Clear all buffers
   */
  clearBuffers() {
    this.eventBuffer = [];
    this.retryQueue = [];
    this.replayBuffer = [];
    this.seenEventIds.clear();
    this.lastThrottleTime.clear();
    return { cleared: true };
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      bufferSize: this.eventBuffer.length,
      retryQueueSize: this.retryQueue.length,
      replaySize: this.replayBuffer.length
    };
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      config: {
        deduplicationWindow_ms: this.deduplicationWindow_ms,
        throttleWindow_ms: this.throttleWindow_ms,
        batchSize: this.batchSize,
        retryAttempts: this.retryAttempts
      }
    };
  }

  /**
   * Reset
   */
  reset() {
    this.clearBuffers();
    this.metrics = {
      eventsProcessed: 0,
      eventsDuplicate: 0,
      eventsThrottled: 0,
      eventsBatched: 0,
      retryAttempts: 0,
      replaySize: 0
    };
    return { reset: true };
  }

  /**
   * Private: Check if event is duplicate
   */
  _isDuplicate(event) {
    return this.seenEventIds.has(event.id);
  }

  /**
   * Private: Check if event is throttled
   */
  _isThrottled(event) {
    const key = `${event.type}:${event.source}`;
    const lastTime = this.lastThrottleTime.get(key) || 0;
    const now = Date.now();

    if (now - lastTime < this.throttleWindow_ms) {
      return true; // Still throttled
    }

    // Not throttled — update mark for next check
    this.lastThrottleTime.set(key, now);
    return false;
  }

  /**
   * Private: Mark event as seen
   */
  _markEventSeen(event) {
    this.seenEventIds.add(event.id);

    // Clean up old entries periodically (simple cleanup)
    if (this.seenEventIds.size > 10000) {
      this.seenEventIds.clear();
    }
  }

  /**
   * Private: Add to replay buffer
   */
  _addToReplayBuffer(event) {
    this.replayBuffer.push(event);
    if (this.replayBuffer.length > this.maxReplaySize) {
      this.replayBuffer.shift();
    }
    this.metrics.replaySize = this.replayBuffer.length;
  }
}

module.exports = EventStreamProcessor;
