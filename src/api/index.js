/**
 * API Layer Index
 * Phase 5 — API Gateway and Routing
 */

const APIRouter = require('./APIRouter');
const APIValidator = require('./APIValidator');
const APIContractRegistry = require('./APIContractRegistry.json');

class APILayer {
  constructor(app, eventBus, diContainer) {
    this.app = app;
    this.eventBus = eventBus;
    this.diContainer = diContainer;
    this.router = null;
    this.validator = null;
  }

  async initialize() {
    console.log('[APILayer] Initialisation de la couche API');

    // Initialiser le validateur
    this.validator = new APIValidator(this.eventBus);
    await this.validator.initialize();

    // Initialiser le routeur
    this.router = new APIRouter(this.app, this.eventBus, this.diContainer);
    await this.router.initialize();

    console.log('[APILayer] Couche API complètement initialisée');

    await this.eventBus.emit('api:layer:ready', {
      endpointCount: APIContractRegistry.endpoints.length,
      timestamp: new Date().toISOString(),
    });
  }

  getRouter() {
    return this.router;
  }

  getValidator() {
    return this.validator;
  }

  getMetrics() {
    return {
      router: this.router.getMetrics(),
      validator: this.validator.getMetrics(),
    };
  }

  getRequestLog(filter = {}) {
    return this.router.getRequestLog(filter);
  }

  getContract(endpointId) {
    return this.validator.getContract(endpointId);
  }
}

module.exports = { APILayer, APIRouter, APIValidator, APIContractRegistry };
