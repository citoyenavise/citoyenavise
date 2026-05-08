/**
 * ProfilesModule.js — Level 2 (Domain) — Dépend de : auth, users
 */
class ProfilesModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.profiles = new Map();
  }

  async initialize() {
    console.log('[Profiles] Initialisation');
    await this.eventBus.emit('frontend:profiles:ready', { timestamp: new Date().toISOString() });
  }

  async getProfile(userId) {
    const response = await fetch(`/api/v1/profiles/${userId}`);
    const profile = await response.json();
    this.profiles.set(userId, profile);
    return profile;
  }

  async updateProfile(userId, data) {
    const response = await fetch(`/api/v1/profiles/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await response.json();
    this.profiles.set(userId, updated);
    await this.eventBus.emit('frontend:profiles:updated', { userId });
    return updated;
  }
}
module.exports = ProfilesModule;
