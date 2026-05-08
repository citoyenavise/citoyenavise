/**
 * PopularSystemModule.js — Level 3 (Derived) — Dépend de : posts, likes, comments
 */
class PopularSystemModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.trending = [];
    this.top = [];
  }

  async initialize() {
    console.log('[PopularSystem] Initialisation');
    this.eventBus.on('like:added', (event) => {
      console.log('[PopularSystem] Like détecté, recalcul trending');
    });
    this.eventBus.on('comment:created', (event) => {
      console.log('[PopularSystem] Commentaire détecté, recalcul trending');
    });
    await this.eventBus.emit('frontend:popular_system:ready', { timestamp: new Date().toISOString() });
  }

  async loadTrending() {
    const response = await fetch('/api/v1/popular/trending');
    const data = await response.json();
    this.trending = data.trending || [];
    return this.trending;
  }

  async loadTopContent() {
    const response = await fetch('/api/v1/popular/top');
    const data = await response.json();
    this.top = data.top || [];
    return this.top;
  }

  getTrending() {
    return this.trending;
  }

  getTop() {
    return this.top;
  }
}
module.exports = PopularSystemModule;
