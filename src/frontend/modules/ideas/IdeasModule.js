/**
 * IdeasModule.js — Level 2 (Domain) — Dépend de : auth, users
 */
class IdeasModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.ideas = new Map();
  }

  async initialize() {
    console.log('[Ideas] Initialisation du module idées');
    await this.eventBus.emit('frontend:ideas:ready', { timestamp: new Date().toISOString() });
  }

  async createIdea(userId, title, description) {
    const response = await fetch('/api/v1/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, description }),
    });
    const idea = await response.json();
    this.ideas.set(idea.id, idea);
    await this.eventBus.emit('frontend:ideas:created', { ideaId: idea.id, userId });
    return idea;
  }

  async getIdea(ideaId) {
    if (this.ideas.has(ideaId)) return this.ideas.get(ideaId);
    const response = await fetch(`/api/v1/ideas/${ideaId}`);
    const idea = await response.json();
    this.ideas.set(ideaId, idea);
    return idea;
  }

  getIdeas() {
    return Array.from(this.ideas.values());
  }
}
module.exports = IdeasModule;
