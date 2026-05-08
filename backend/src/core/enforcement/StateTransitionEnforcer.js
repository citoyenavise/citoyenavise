/**
 * StateTransitionEnforcer.js - Enforce state machine transitions
 * PHASE 1.4: Enforcement Layer
 *
 * Responsibility: Enforce valid state transitions
 * - Verify state machine transitions
 * - Check guard conditions
 * - Enforce side-effect ordering
 * - Validate state contexts
 */

class StateTransitionEnforcer {
  constructor(constitutionManager) {
    this.constitutionManager = constitutionManager;
    this.constitution = constitutionManager.getConstitution();
    this.stateMachine = this.constitution.state_machine || {};
    this.currentStates = new Map();
  }

  /**
   * Enforce operation
   */
  enforce(operation) {
    // Check state transition operations
    if (operation.type === 'state_transition') {
      return this._enforceStateTransition(operation);
    }

    if (operation.type === 'state_check') {
      return this._enforceStateCheck(operation);
    }

    // Default allow for unknown operations
    return { allowed: true, reason: 'unknown_operation_type' };
  }

  /**
   * Enforce state transition
   */
  _enforceStateTransition(operation) {
    const { from, to, context, sideEffects = [] } = operation;

    // Check if states are defined
    if (!this.stateMachine.states) {
      return {
        allowed: false,
        reason: 'state_machine_not_defined',
        severity: 'CRITICAL',
        message: 'State machine not defined in constitution',
        from,
        to
      };
    }

    const states = this.stateMachine.states;

    // Check if from state exists
    if (!states[from]) {
      return {
        allowed: false,
        reason: 'from_state_invalid',
        severity: 'CRITICAL',
        message: `From state ${from} not defined in state machine`,
        from
      };
    }

    // Check if to state exists
    if (!states[to]) {
      return {
        allowed: false,
        reason: 'to_state_invalid',
        severity: 'CRITICAL',
        message: `To state ${to} not defined in state machine`,
        to
      };
    }

    // Check if transition is allowed
    const fromState = states[from];
    const allowedTransitions = fromState.transitions || [];

    if (!allowedTransitions.includes(to)) {
      return {
        allowed: false,
        reason: 'transition_not_allowed',
        severity: 'HIGH',
        message: `Transition from ${from} to ${to} not allowed`,
        from,
        to,
        allowedTransitions
      };
    }

    // Check guard conditions if defined
    if (fromState.guards) {
      const guardResult = this._checkGuards(fromState.guards, context);
      if (!guardResult.valid) {
        return {
          allowed: false,
          reason: 'guard_condition_failed',
          severity: 'HIGH',
          message: `Guard condition failed: ${guardResult.reason}`,
          from,
          to,
          failedGuard: guardResult.guard
        };
      }
    }

    // Check side-effect ordering
    const toState = states[to];
    if (toState.required_preconditions && sideEffects.length > 0) {
      const orderingResult = this._checkSideEffectOrdering(sideEffects, toState.required_preconditions);
      if (!orderingResult.valid) {
        return {
          allowed: false,
          reason: 'side_effect_ordering_invalid',
          severity: 'HIGH',
          message: `Side-effect ordering invalid: ${orderingResult.reason}`,
          from,
          to,
          issue: orderingResult.issue
        };
      }
    }

    return {
      allowed: true,
      reason: 'transition_valid',
      from,
      to,
      context
    };
  }

  /**
   * Enforce state check
   */
  _enforceStateCheck(operation) {
    const { entity, expectedState } = operation;

    // Check if entity has current state
    const currentState = this.currentStates.get(entity);

    if (!currentState) {
      return {
        allowed: false,
        reason: 'entity_not_found',
        severity: 'MEDIUM',
        message: `Entity ${entity} not tracked`,
        entity
      };
    }

    // Check if current state matches expected
    if (currentState !== expectedState) {
      return {
        allowed: false,
        reason: 'state_mismatch',
        severity: 'HIGH',
        message: `Entity ${entity} is in state ${currentState}, expected ${expectedState}`,
        entity,
        currentState,
        expectedState
      };
    }

    return {
      allowed: true,
      reason: 'state_valid',
      entity,
      currentState
    };
  }

  /**
   * Check guard conditions
   */
  _checkGuards(guards, context = {}) {
    if (!guards || typeof guards !== 'object') {
      return { valid: true };
    }

    for (const [guardName, guardCondition] of Object.entries(guards)) {
      // Check if context has required values for guard
      if (guardCondition.requires) {
        for (const required of guardCondition.requires) {
          if (!(required in context)) {
            return {
              valid: false,
              guard: guardName,
              reason: `Missing required context: ${required}`
            };
          }
        }
      }

      // Check if guard condition is met
      if (guardCondition.check) {
        // In real implementation, would evaluate guard logic
        // For now, assume guards pass if defined
      }
    }

    return { valid: true };
  }

  /**
   * Check side-effect ordering
   */
  _checkSideEffectOrdering(sideEffects, preconditions) {
    if (!preconditions || preconditions.length === 0) {
      return { valid: true };
    }

    // Check that all preconditions are met before side-effects
    for (const precondition of preconditions) {
      // In real implementation, would check precondition state
      // For now, assume ordering is correct if preconditions defined
    }

    return { valid: true };
  }

  /**
   * Record state transition
   */
  recordStateTransition(entity, from, to, context = {}) {
    this.currentStates.set(entity, to);

    return {
      entity,
      from,
      to,
      timestamp: new Date().toISOString(),
      context
    };
  }

  /**
   * Get current state
   */
  getCurrentState(entity) {
    return this.currentStates.get(entity) || null;
  }

  /**
   * Set current state
   */
  setCurrentState(entity, state) {
    this.currentStates.set(entity, state);
    return { entity, state };
  }

  /**
   * Get state machine definition
   */
  getStateMachineDef() {
    return this.stateMachine;
  }

  /**
   * Check if transition is valid (static check)
   */
  async checkStateTransition(fromState, toState, context = {}) {
    if (!this.stateMachine.states) {
      return { valid: false, reason: 'state_machine_not_defined' };
    }

    const states = this.stateMachine.states;

    if (!states[fromState]) {
      return { valid: false, reason: 'from_state_not_found' };
    }

    if (!states[toState]) {
      return { valid: false, reason: 'to_state_not_found' };
    }

    const allowedTransitions = states[fromState].transitions || [];
    if (!allowedTransitions.includes(toState)) {
      return { valid: false, reason: 'transition_not_allowed', allowedTransitions };
    }

    return { valid: true, from: fromState, to: toState };
  }

  /**
   * Get all valid transitions from state
   */
  getValidTransitions(state) {
    if (!this.stateMachine.states) {
      return [];
    }

    const stateObj = this.stateMachine.states[state];
    if (!stateObj) {
      return [];
    }

    return stateObj.transitions || [];
  }
}

module.exports = StateTransitionEnforcer;
