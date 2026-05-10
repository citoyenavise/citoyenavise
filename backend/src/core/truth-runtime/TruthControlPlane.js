// PHASE 9.1 — Truth Runtime Engine: Control Plane
// Non-corrective operational reactions

const CONTROL_ACTIONS = {
  ALERT_OPERATORS: 'ALERT_OPERATORS',
  THROTTLE_OPERATIONS: 'THROTTLE_OPERATIONS',
  ISOLATE_REGION: 'ISOLATE_REGION',
  REROUTE_TRAFFIC: 'REROUTE_TRAFFIC',
  FAILOVER: 'FAILOVER',
  NO_ACTION: 'NO_ACTION',
};

const POLICY_NAMES = {
  DEGRADED: 'DEGRADED_STATE_POLICY',
  BROKEN: 'BROKEN_STATE_POLICY',
  COLLAPSED: 'COLLAPSED_STATE_POLICY',
  REGIONAL_DIVERGENCE: 'REGIONAL_DIVERGENCE_POLICY',
};

class TruthControlPlane {
  constructor(options = {}) {
    this.policies = new Map();
    this.actions = [];
    this.throttleRate = 1.0; // 100% normal rate

    // Thresholds
    this.degradedThreshold = options.degradedThreshold || 0.05; // ε₁
    this.brokenThreshold = options.brokenThreshold || 0.2; // ε₂
    this.collapsedThreshold = options.collapsedThreshold || 0.5; // ε₃
    this.regionalDivergenceThreshold = options.regionalDivergenceThreshold || 0.1;

    // Metrics
    this.metrics = {
      actionsTriggered: 0,
      policyExecutions: 0,
      throttleEvents: 0,
      isolationEvents: 0,
      rerouteEvents: 0,
      alertEvents: 0,
    };

    // Setup default policies
    this._setupDefaultPolicies();
  }

  _setupDefaultPolicies() {
    // Policy 1: DEGRADED State
    this.definePolicy(
      POLICY_NAMES.DEGRADED,
      (divergence) => divergence > this.degradedThreshold && divergence <= this.brokenThreshold,
      (state) => ({
        action: CONTROL_ACTIONS.ALERT_OPERATORS,
        severity: 'INFO',
        message: `System in DEGRADED state: divergence=${(state.divergence * 100).toFixed(1)}%`,
      })
    );

    // Policy 2: BROKEN State
    this.definePolicy(
      POLICY_NAMES.BROKEN,
      (divergence) => divergence > this.brokenThreshold && divergence <= this.collapsedThreshold,
      (state) => ({
        action: CONTROL_ACTIONS.THROTTLE_OPERATIONS,
        rate: 0.5,
        severity: 'WARNING',
        message: `System in BROKEN state: throttling to 50%`,
      })
    );

    // Policy 3: COLLAPSED State
    this.definePolicy(
      POLICY_NAMES.COLLAPSED,
      (divergence) => divergence > this.collapsedThreshold,
      (state) => ({
        action: CONTROL_ACTIONS.ISOLATE_REGION,
        severity: 'CRITICAL',
        message: `System COLLAPSED: isolating diverged regions`,
      })
    );

    // Policy 4: Regional Divergence
    this.definePolicy(
      POLICY_NAMES.REGIONAL_DIVERGENCE,
      (divergence, driftField) => {
        if (!driftField) return false;
        const consistency = 1.0 - this._computeRegionalSpread(driftField);
        return consistency < (1.0 - this.regionalDivergenceThreshold);
      },
      (state, driftField) => ({
        action: CONTROL_ACTIONS.REROUTE_TRAFFIC,
        severity: 'WARNING',
        message: `Regional divergence detected: rerouting traffic`,
      })
    );
  }

  definePolicy(name, condition, actionGenerator) {
    if (typeof condition !== 'function' || typeof actionGenerator !== 'function') {
      throw new Error('Condition and actionGenerator must be functions');
    }

    this.policies.set(name, {
      name,
      condition,
      actionGenerator,
    });
  }

  executeControlActions(divergence, driftField) {
    if (typeof divergence !== 'number' || divergence < 0 || divergence > 1) {
      throw new Error('Divergence must be number in [0, 1]');
    }

    const executedActions = [];
    const state = { divergence, driftField };

    // Evaluate each policy
    for (const [policyName, policy] of this.policies) {
      try {
        const conditionMet = policy.condition(divergence, driftField);

        if (conditionMet) {
          const action = policy.actionGenerator(state, driftField);
          executedActions.push({
            policy: policyName,
            action: action.action,
            timestamp: new Date().toISOString(),
            severity: action.severity,
            message: action.message,
            executed: true,
          });

          this._executeAction(action);
          this.metrics.policyExecutions++;
        }
      } catch (e) {
        // Policy error, don't break control plane
      }
    }

    this.metrics.actionsTriggered += executedActions.length;
    this.actions = executedActions;

    return Object.freeze({
      executedActions,
      timestamp: new Date().toISOString(),
    });
  }

  _executeAction(action) {
    switch (action.action) {
      case CONTROL_ACTIONS.ALERT_OPERATORS:
        this.metrics.alertEvents++;
        break;
      case CONTROL_ACTIONS.THROTTLE_OPERATIONS:
        this.throttleRate = action.rate || 0.5;
        this.metrics.throttleEvents++;
        break;
      case CONTROL_ACTIONS.ISOLATE_REGION:
        this.metrics.isolationEvents++;
        break;
      case CONTROL_ACTIONS.REROUTE_TRAFFIC:
        this.metrics.rerouteEvents++;
        break;
    }
  }

  throttleNewOperations(rate) {
    if (typeof rate !== 'number' || rate < 0 || rate > 1) {
      throw new Error('Throttle rate must be number in [0, 1]');
    }

    this.throttleRate = rate;
    this.metrics.throttleEvents++;

    return Object.freeze({
      action: CONTROL_ACTIONS.THROTTLE_OPERATIONS,
      rate,
      timestamp: new Date().toISOString(),
    });
  }

  isolateRegion(region) {
    if (!region || typeof region !== 'string') {
      throw new Error('Region must be string');
    }

    this.metrics.isolationEvents++;

    return Object.freeze({
      action: CONTROL_ACTIONS.ISOLATE_REGION,
      region,
      timestamp: new Date().toISOString(),
    });
  }

  rerouteTraffic(fromRegion, toRegion) {
    if (!fromRegion || !toRegion || typeof fromRegion !== 'string' || typeof toRegion !== 'string') {
      throw new Error('From and to regions must be strings');
    }

    this.metrics.rerouteEvents++;

    return Object.freeze({
      action: CONTROL_ACTIONS.REROUTE_TRAFFIC,
      from: fromRegion,
      to: toRegion,
      timestamp: new Date().toISOString(),
    });
  }

  alertOperators(severity) {
    if (!severity || typeof severity !== 'string') {
      throw new Error('Severity must be string');
    }

    this.metrics.alertEvents++;

    return Object.freeze({
      action: CONTROL_ACTIONS.ALERT_OPERATORS,
      severity,
      timestamp: new Date().toISOString(),
    });
  }

  getThrottleRate() {
    return this.throttleRate;
  }

  getLastActions() {
    return Object.freeze(this.actions.slice());
  }

  getMetrics() {
    return Object.freeze({
      ...this.metrics,
      currentThrottleRate: this.throttleRate,
    });
  }

  reset() {
    this.actions = [];
    this.throttleRate = 1.0;
    this.metrics = {
      actionsTriggered: 0,
      policyExecutions: 0,
      throttleEvents: 0,
      isolationEvents: 0,
      rerouteEvents: 0,
      alertEvents: 0,
    };
  }

  _computeRegionalSpread(driftField) {
    if (!driftField.getGlobalDriftField) {
      return 0;
    }

    const field = driftField.getGlobalDriftField();
    const divergences = Object.values(field).map((r) => r.divergence);

    if (divergences.length === 0) {
      return 0;
    }

    const max = Math.max(...divergences);
    const min = Math.min(...divergences);

    return max - min;
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = {
  TruthControlPlane,
  CONTROL_ACTIONS,
  POLICY_NAMES,
};
