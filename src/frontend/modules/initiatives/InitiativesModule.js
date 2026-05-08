/**
 * InitiativesModule.js — Level 2 (Domain) — Dépend de : auth, users
 */
class InitiativesModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.initiatives = new Map();
  }

  async initialize() {
    console.log('[Initiatives] Initialisation');
    await this.eventBus.emit('frontend:initiatives:ready', { timestamp: new Date().toISOString() });
  }

  async getInitiatives() {
    const response = await fetch('/api/v1/initiatives');
    const { initiatives } = await response.json();
    for (const init of initiatives) {
      this.initiatives.set(init.id, init);
    }
    return initiatives;
  }

  async joinInitiative(userId, initiativeId) {
    const response = await fetch(`/api/v1/initiatives/${initiativeId}/join`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    await this.eventBus.emit('frontend:initiatives:joined', { userId, initiativeId });
    return response.json();
  }
}
module.exports = InitiativesModule;
