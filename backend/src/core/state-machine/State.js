// État de la Machine à États

class State {
  constructor(id, config = {}) {
    this.id = id;
    this.type = config.type || 'normal'; // normal, initial, final
    this.onEnter = config.onEnter || [];
    this.onExit = config.onExit || [];
    this.metadata = config.metadata || {};
    this.timeout = config.timeout || null;
    this.allowedTransitions = config.allowedTransitions || [];
  }

  // Exécuter les callbacks d'entrée
  async enter(context = {}) {
    for (const callback of this.onEnter) {
      await callback(context);
    }
  }

  // Exécuter les callbacks de sortie
  async exit(context = {}) {
    for (const callback of this.onExit) {
      await callback(context);
    }
  }

  // Vérifier si une transition est autorisée
  canTransitionTo(eventName) {
    return this.allowedTransitions.includes(eventName);
  }

  // Obtenir les informations de l'état
  getInfo() {
    return {
      id: this.id,
      type: this.type,
      metadata: this.metadata,
      timeout: this.timeout,
      allowedTransitions: this.allowedTransitions,
    };
  }
}

module.exports = State;
