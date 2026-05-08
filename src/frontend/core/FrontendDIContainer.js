/**
 * FrontendDIContainer.js
 * Phase 4 — Injection de dépendances pour le frontend
 * Enregistre et résout les dépendances des modules UI
 */

class FrontendDIContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.factoryFunctions = new Map();
    this.dependencies = new Map();
  }

  register(serviceId, definition) {
    if (definition.singleton === false) {
      // Factory - crée une nouvelle instance à chaque fois
      this.factoryFunctions.set(serviceId, definition.factory);
    } else {
      // Singleton - réutilise la même instance
      this.services.set(serviceId, definition);
    }

    if (definition.dependencies) {
      this.dependencies.set(serviceId, definition.dependencies);
    }

    console.log(`[DI] Service enregistré: ${serviceId}`);
  }

  resolve(serviceId, context = {}) {
    // Vérifier les singletons
    if (this.singletons.has(serviceId)) {
      return this.singletons.get(serviceId);
    }

    // Vérifier les services enregistrés
    if (this.services.has(serviceId)) {
      const definition = this.services.get(serviceId);
      const instance = this.createInstance(definition, context);

      // Mettre en cache comme singleton
      this.singletons.set(serviceId, instance);
      return instance;
    }

    // Vérifier les factories
    if (this.factoryFunctions.has(serviceId)) {
      const factory = this.factoryFunctions.get(serviceId);
      return factory(this, context);
    }

    throw new Error(`Service non enregistré: ${serviceId}`);
  }

  createInstance(definition, context) {
    if (definition.factory) {
      return definition.factory(this, context);
    }

    if (definition.component) {
      return new definition.component(this, context);
    }

    if (definition.value !== undefined) {
      return definition.value;
    }

    throw new Error(`Impossible de créer instance pour ${definition}`);
  }

  getDependencies(serviceId) {
    return this.dependencies.get(serviceId) || [];
  }

  validateDependencies() {
    const errors = [];

    for (const [serviceId, deps] of this.dependencies.entries()) {
      for (const dep of deps) {
        if (!this.services.has(dep) && !this.factoryFunctions.has(dep)) {
          errors.push(`Service ${serviceId}: dépendance '${dep}' introuvable`);
        }
      }
    }

    return errors;
  }

  clear() {
    this.singletons.clear();
  }

  getStatistics() {
    return {
      totalServices: this.services.size + this.factoryFunctions.size,
      singletons: this.singletons.size,
      factories: this.factoryFunctions.size,
      dependencies: this.dependencies.size,
    };
  }
}

module.exports = FrontendDIContainer;
