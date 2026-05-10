/**
 * PHASE 10.2 — CausalAnomalyEngine
 * Detect causal relationship breakdowns and ruptures
 */

class CausalAnomalyEngine {
  constructor(observations, consensusData, options = {}) {
    this.observations = observations || [];
    this.consensusData = consensusData || {};

    this.maxChainDepth = options.maxChainDepth || 1000;
    this.hashAlgorithm = options.hashAlgorithm || 'sha256';

    this.metrics = {
      verificationsPerformed: 0,
      causalRupturesDetected: 0,
      eventOrderViolationsFound: 0,
      retrocausalEventsDetected: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Detect causal ruptures (events without causes)
  detectCausalRuptures(observations = this.observations) {
    const ruptures = [];

    for (const obs of observations) {
      if (!obs.success) continue;

      const event = obs.observation;
      const eventId = event.id || `event_${obs.index}`;
      const causes = event.properties?.causes || [];

      if (causes.length === 0) {
        ruptures.push({
          eventId,
          timestamp: event.timestamp,
          missingCause: true,
          detail: 'Event lacks causal dependency'
        });
      }
    }

    this.metrics.verificationsPerformed++;
    this.metrics.causalRupturesDetected += ruptures.length;

    return Object.freeze({
      causalRuptures: ruptures,
      count: ruptures.length,
      density: (ruptures.length / (observations.length || 1)) * 100,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Identify event ordering violations
  identifyEventOrderViolations(observations = this.observations) {
    const violations = [];
    const sortedObs = [...observations]
      .filter((o) => o.success)
      .sort((a, b) => {
        const tsA = new Date(a.observation.timestamp).getTime();
        const tsB = new Date(b.observation.timestamp).getTime();
        return tsA - tsB;
      });

    for (let i = 1; i < sortedObs.length; i++) {
      const current = sortedObs[i].observation;
      const previous = sortedObs[i - 1].observation;

      const currentTs = new Date(current.timestamp).getTime();
      const prevTs = new Date(previous.timestamp).getTime();

      const causes = current.properties?.causes || [];

      for (const cause of causes) {
        const causeTsStr = cause.timestamp || previous.timestamp;
        const causeTs = new Date(causeTsStr).getTime();

        if (causeTs > currentTs) {
          violations.push({
            event: current.id || `event_${i}`,
            cause: cause.id || cause,
            eventTs: currentTs,
            causeTs: causeTs,
            wrongOrder: true,
            detail: 'Effect occurred before alleged cause'
          });
        }
      }
    }

    this.metrics.verificationsPerformed++;
    this.metrics.eventOrderViolationsFound += violations.length;

    return Object.freeze({
      eventOrderViolations: violations,
      count: violations.length,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Flag retroactive causality (impossible causality)
  flagRetrocausalEvents(observations = this.observations) {
    const retroEvents = [];

    for (const obs of observations) {
      if (!obs.success) continue;

      const event = obs.observation;
      const eventId = event.id || `event_${obs.index}`;
      const eventTs = new Date(event.timestamp).getTime();
      const causes = event.properties?.causes || [];

      const causesAfterEvent = causes.filter((cause) => {
        const causeTs = new Date(cause.timestamp || event.timestamp).getTime();
        return causeTs > eventTs;
      });

      if (causesAfterEvent.length > 0) {
        retroEvents.push({
          eventId,
          timestamp: event.timestamp,
          impossibleCausality: true,
          retroactiveCauses: causesAfterEvent.length,
          detail: 'Event claimed to be caused by future events'
        });
      }
    }

    this.metrics.verificationsPerformed++;
    this.metrics.retrocausalEventsDetected += retroEvents.length;

    return Object.freeze({
      retrocausalEvents: retroEvents,
      count: retroEvents.length,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Compute causality coherence score
  computeCausalityCoherence(observations = this.observations) {
    const validObs = observations.filter((o) => o.success);

    if (validObs.length === 0) {
      return Object.freeze({
        coherence: 1.0,
        consistent: true,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    let violationCount = 0;
    let totalDependencies = 0;

    for (const obs of validObs) {
      const event = obs.observation;
      const causes = event.properties?.causes || [];
      totalDependencies += causes.length;

      const eventTs = new Date(event.timestamp).getTime();

      for (const cause of causes) {
        const causeTs = new Date(cause.timestamp || event.timestamp).getTime();
        if (causeTs >= eventTs) {
          violationCount++;
        }
      }
    }

    const coherence =
      totalDependencies === 0
        ? 1.0
        : 1.0 - violationCount / totalDependencies;

    this.metrics.verificationsPerformed++;

    return Object.freeze({
      coherence: Math.max(0, Math.min(1, coherence)),
      violations: violationCount,
      totalDependencies: totalDependencies,
      consistent: coherence > 0.9,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Measure causal graph structure
  measureCausalGraph(observations = this.observations) {
    const validObs = observations.filter((o) => o.success);
    const nodes = new Set();
    const edges = [];

    for (const obs of validObs) {
      const event = obs.observation;
      const eventId = event.id || `event_${obs.index}`;
      nodes.add(eventId);

      const causes = event.properties?.causes || [];
      for (const cause of causes) {
        const causeId = cause.id || cause;
        edges.push({ from: causeId, to: eventId });
        nodes.add(causeId);
      }
    }

    const avgInDegree = edges.length / (nodes.size || 1);

    return Object.freeze({
      nodeCount: nodes.size,
      edgeCount: edges.length,
      density: edges.length / (nodes.size * (nodes.size - 1) || 1),
      avgInDegree: avgInDegree,
      averageChainLength: Math.max(
        1,
        Math.log(nodes.size || 1) / Math.log(avgInDegree || 1)
      ),
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Get all causal anomalies
  getCausalAnomalies(observations = this.observations) {
    const ruptures = this.detectCausalRuptures(observations);
    const violations = this.identifyEventOrderViolations(observations);
    const retroCausal = this.flagRetrocausalEvents(observations);
    const coherence = this.computeCausalityCoherence(observations);

    const totalAnomalies =
      ruptures.count + violations.count + retroCausal.count;

    return Object.freeze({
      totalAnomalies,
      causalRuptures: ruptures.count,
      eventOrderViolations: violations.count,
      retrocausalEvents: retroCausal.count,
      coherenceScore: coherence.coherence,
      healthy: totalAnomalies === 0 && coherence.coherence > 0.9,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Get metrics
  getMetrics() {
    return Object.freeze({
      ...this.metrics,
      isAuthoritative: false
    });
  }
}

// Freeze class
Object.freeze(CausalAnomalyEngine);
Object.freeze(CausalAnomalyEngine.prototype);

module.exports = {
  CausalAnomalyEngine
};
