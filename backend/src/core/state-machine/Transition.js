// Transition de la Machine à États

class Transition {
  constructor(id, config = {}) {
    this.id = id;
    this.fromState = config.fromState;
    this.toState = config.toState;
    this.event = config.event;
    this.guards = config.guards || [];
    this.sideEffects = config.sideEffects || [];
    this.condition = config.condition || (() => true);
    this.metadata = config.metadata || {};
    this.priority = config.priority || 0;
  }

  // Vérifier si la transition est valide
  isValid(context = {}) {
    if (typeof this.condition === 'function') {
      return this.condition(context);
    }
    return true;
  }

  // Vérifier si toutes les gardes passent
  checkGuards(context = {}) {
    for (const guard of this.guards) {
      if (!guard.check(context)) {
        return {
          passed: false,
          failedGuard: guard.id,
        };
      }
    }
    return { passed: true };
  }

  // Exécuter les side-effects
  async executeSideEffects(context = {}) {
    const results = [];
    for (const sideEffect of this.sideEffects) {
      const result = await sideEffect.execute(context);
      results.push(result);
    }
    return results;
  }

  // Obtenir les informations de la transition
  getInfo() {
    return {
      id: this.id,
      fromState: this.fromState,
      toState: this.toState,
      event: this.event,
      guards: this.guards.map((g) => g.id),
      sideEffects: this.sideEffects.map((s) => s.id),
      priority: this.priority,
      metadata: this.metadata,
    };
  }
}

module.exports = Transition;
