// Contexte Global de l'Orchestrateur - État partagé système

class OrchestratorContext {
  constructor(initialData = {}) {
    this.data = {
      timestamp: new Date(),
      version: '1.0.0',
      session: {
        id: initialData.sessionId || null,
        userId: initialData.userId || null,
        permissions: initialData.permissions || [],
      },
      state: {
        current: 'IDLE',
        previous: null,
        history: [],
      },
      modules: {},
      flags: initialData.flags || {},
      metadata: {},
      ...initialData,
    };
    this.listeners = [];
    this.frozen = false;
  }

  // Obtenir une valeur du contexte
  get(path) {
    return this.getNestedValue(this.data, path.split('.'));
  }

  // Définir une valeur du contexte
  set(path, value) {
    if (this.frozen) {
      throw new Error('Contexte gelé - modifications impossible');
    }

    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = this.data;

    for (const key of keys) {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
    this.notify('context:updated', { path, value });
  }

  // Obtenir une valeur imbriquée
  getNestedValue(obj, keys) {
    let current = obj;
    for (const key of keys) {
      if (current && typeof current === 'object') {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return current;
  }

  // Fusionner des données
  merge(newData) {
    if (this.frozen) {
      throw new Error('Contexte gelé - modifications impossible');
    }

    this.data = { ...this.data, ...newData };
    this.notify('context:merged', { newData });
  }

  // Geler le contexte (lecture seule)
  freeze() {
    this.frozen = true;
    this.notify('context:frozen');
  }

  // Dégeler le contexte
  unfreeze() {
    this.frozen = false;
    this.notify('context:unfrozen');
  }

  // Réinitialiser le contexte
  reset(initialData = {}) {
    if (this.frozen) {
      throw new Error('Contexte gelé - modifications impossible');
    }

    this.data = {
      timestamp: new Date(),
      version: '1.0.0',
      session: {
        id: initialData.sessionId || null,
        userId: initialData.userId || null,
        permissions: initialData.permissions || [],
      },
      state: {
        current: 'IDLE',
        previous: null,
        history: [],
      },
      modules: {},
      flags: initialData.flags || {},
      metadata: {},
      ...initialData,
    };

    this.notify('context:reset');
  }

  // Valider le contexte
  validate(schema) {
    // Validation basée sur un schéma
    const errors = [];

    for (const [path, rules] of Object.entries(schema)) {
      const value = this.get(path);
      if (rules.required && value === undefined) {
        errors.push(`${path} est requis`);
      }
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${path} doit être de type ${rules.type}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Enregistrer un listener
  on(event, callback) {
    this.listeners.push({ event, callback });
  }

  // Notifier les listeners
  notify(event, data = {}) {
    for (const listener of this.listeners) {
      if (listener.event === event || listener.event === '*') {
        listener.callback({ event, data, timestamp: new Date() });
      }
    }
  }

  // Obtenir le contexte entier
  getAll() {
    return JSON.parse(JSON.stringify(this.data));
  }

  // Obtenir la session
  getSession() {
    return { ...this.data.session };
  }

  // Obtenir l'état
  getState() {
    return { ...this.data.state };
  }

  // Mettre à jour la session
  updateSession(sessionData) {
    this.data.session = { ...this.data.session, ...sessionData };
    this.notify('session:updated', sessionData);
  }

  // Mettre à jour l'état
  updateState(stateData) {
    this.data.state.previous = this.data.state.current;
    this.data.state = { ...this.data.state, ...stateData };
    if (!this.data.state.history) {
      this.data.state.history = [];
    }
    this.data.state.history.push({
      state: this.data.state.previous,
      timestamp: new Date(),
    });
    this.notify('state:updated', stateData);
  }
}

module.exports = OrchestratorContext;
