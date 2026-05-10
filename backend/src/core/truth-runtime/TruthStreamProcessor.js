// PHASE 9.1 — Truth Runtime Engine: Stream Processor
// Real-time ingestion and divergence computation

class TruthStreamProcessor {
  constructor(divergenceFunctionEngine, options = {}) {
    if (!divergenceFunctionEngine) {
      throw new Error('DivergenceFunctionEngine required');
    }

    this.divergenceEngine = divergenceFunctionEngine;
    this.slidingWindowSize = options.slidingWindowSize || 60; // seconds
    this.updateIntervalMs = options.updateIntervalMs || 100; // 10 Hz

    // Stream state
    this.divergenceHistory = [];
    this.internalStateBuffer = [];
    this.externalObservationBuffer = [];
    this.lastComputedDivergence = null;
    this.lastEmittedTimestamp = null;

    // Subscribers
    this.divergenceSubscribers = [];

    // Metrics
    this.streamMetrics = {
      totalIngestedInternal: 0,
      totalIngestedExternal: 0,
      totalComputations: 0,
      avgProcessingLatencyMs: 0,
      bufferDepth: 0,
      droppedEvents: 0,
      lastUpdateTimestamp: null,
    };

    // Validation
    this.lastInternalTimestamp = null;
    this.lastExternalTimestamp = null;
    this.outOfOrderEvents = 0;
  }

  ingestInternalState(timestamp, internalState) {
    if (!timestamp || !internalState) {
      throw new Error('Timestamp and internalState required');
    }

    // Validate ordering (per stream)
    if (this.lastInternalTimestamp && timestamp <= this.lastInternalTimestamp) {
      this.outOfOrderEvents++;
      return false;
    }

    this.internalStateBuffer.push({
      timestamp,
      state: internalState,
      receivedAt: Date.now(),
    });

    this.streamMetrics.totalIngestedInternal++;
    this.lastInternalTimestamp = timestamp;
    this._pruneOldBuffers();

    return true;
  }

  ingestExternalObservation(timestamp, observation) {
    if (!timestamp || !observation) {
      throw new Error('Timestamp and observation required');
    }

    // Validate ordering (per stream)
    if (this.lastExternalTimestamp && timestamp <= this.lastExternalTimestamp) {
      this.outOfOrderEvents++;
      return false;
    }

    this.externalObservationBuffer.push({
      timestamp,
      observation,
      receivedAt: Date.now(),
    });

    this.streamMetrics.totalIngestedExternal++;
    this.lastExternalTimestamp = timestamp;
    this._pruneOldBuffers();

    return true;
  }

  computeStreamingDivergence() {
    if (this.internalStateBuffer.length === 0 || this.externalObservationBuffer.length === 0) {
      return null;
    }

    const startTime = Date.now();

    // Match latest IS(t) with latest EO(t)
    const latestInternal = this.internalStateBuffer[this.internalStateBuffer.length - 1];
    const latestExternal = this.externalObservationBuffer[this.externalObservationBuffer.length - 1];

    // Use divergenceEngine to compute D(t)
    const divergenceResult = this.divergenceEngine.computeDivergence(
      latestExternal.observation,
      latestInternal.state
    );

    const latencyMs = Date.now() - startTime;

    // Add to history with timestamp
    const divergenceEntry = {
      timestamp: Math.max(latestInternal.timestamp, latestExternal.timestamp),
      divergence: divergenceResult.totalDivergence,
      components: divergenceResult.components,
      latencyMs,
    };

    this.divergenceHistory.push(divergenceEntry);
    this._pruneOldHistory();

    this.lastComputedDivergence = divergenceEntry;
    this.lastEmittedTimestamp = divergenceEntry.timestamp;

    // Update metrics
    this.streamMetrics.totalComputations++;
    this.streamMetrics.avgProcessingLatencyMs =
      (this.streamMetrics.avgProcessingLatencyMs * (this.streamMetrics.totalComputations - 1) + latencyMs) /
      this.streamMetrics.totalComputations;
    this.streamMetrics.bufferDepth = Math.max(
      this.internalStateBuffer.length,
      this.externalObservationBuffer.length
    );
    this.streamMetrics.lastUpdateTimestamp = new Date().toISOString();

    // Emit to subscribers
    this._emitDivergenceUpdate(divergenceEntry);

    return divergenceEntry;
  }

  onDivergenceUpdate(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be function');
    }
    this.divergenceSubscribers.push(callback);
  }

  getDivergenceStream() {
    return Object.freeze({
      history: Object.freeze(this.divergenceHistory.slice()),
      latest: this.lastComputedDivergence ? Object.freeze(this.lastComputedDivergence) : null,
      windowSize: this.slidingWindowSize,
    });
  }

  getStreamMetrics() {
    return Object.freeze({
      ...this.streamMetrics,
      outOfOrderEvents: this.outOfOrderEvents,
    });
  }

  _emitDivergenceUpdate(divergenceEntry) {
    this.divergenceSubscribers.forEach((cb) => {
      try {
        cb(divergenceEntry);
      } catch (e) {
        // Subscriber error, don't break stream
      }
    });
  }

  _pruneOldBuffers() {
    const now = Date.now();
    const windowMs = this.slidingWindowSize * 1000;

    // Keep only recent entries
    this.internalStateBuffer = this.internalStateBuffer.filter((e) => now - e.receivedAt < windowMs);
    this.externalObservationBuffer = this.externalObservationBuffer.filter((e) => now - e.receivedAt < windowMs);
  }

  _pruneOldHistory() {
    if (this.divergenceHistory.length > this.slidingWindowSize * 10) {
      this.divergenceHistory = this.divergenceHistory.slice(-this.slidingWindowSize * 10);
    }
  }

  reset() {
    this.divergenceHistory = [];
    this.internalStateBuffer = [];
    this.externalObservationBuffer = [];
    this.lastComputedDivergence = null;
    this.lastEmittedTimestamp = null;
    this.divergenceSubscribers = [];
    this.lastInternalTimestamp = null;
    this.lastExternalTimestamp = null;
    this.outOfOrderEvents = 0;
    this.streamMetrics = {
      totalIngestedInternal: 0,
      totalIngestedExternal: 0,
      totalComputations: 0,
      avgProcessingLatencyMs: 0,
      bufferDepth: 0,
      droppedEvents: 0,
      lastUpdateTimestamp: null,
    };
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = TruthStreamProcessor;
