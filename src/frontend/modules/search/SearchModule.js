/**
 * SearchModule.js — Level 3 (Derived) — Dépend de : posts, ideas, users
 */
class SearchModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.searchIndex = new Map();
    this.searchResults = [];
  }

  async initialize() {
    console.log('[Search] Initialisation');
    this.eventBus.on('post:created', (event) => {
      this.indexContent('post', event.payload.postId);
    });
    await this.eventBus.emit('frontend:search:ready', { timestamp: new Date().toISOString() });
  }

  async search(query, filters = {}) {
    try {
      const response = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}&filters=${JSON.stringify(filters)}`);
      const data = await response.json();
      this.searchResults = data.results || [];
      await this.eventBus.emit('frontend:search:query_executed', { query, resultCount: this.searchResults.length });
      return this.searchResults;
    } catch (error) {
      console.error('[Search] Erreur:', error);
      throw error;
    }
  }

  async getSuggestions(query) {
    const response = await fetch(`/api/v1/search/suggestions?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.suggestions || [];
  }

  indexContent(contentType, contentId) {
    const key = `${contentType}:${contentId}`;
    this.searchIndex.set(key, { contentType, contentId, indexedAt: new Date().toISOString() });
  }

  getSearchResults() {
    return this.searchResults;
  }
}
module.exports = SearchModule;
