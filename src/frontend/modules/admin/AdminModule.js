/**
 * AdminModule.js — Level 2 (Domain) — Dépend de : auth
 */
class AdminModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.adminLog = [];
  }

  async initialize() {
    console.log('[Admin] Initialisation');
    this.eventBus.on('auth:success', (event) => {
      if (event.payload.role === 'admin') {
        console.log('[Admin] Admin détecté');
      }
    });
    await this.eventBus.emit('frontend:admin:ready', { timestamp: new Date().toISOString() });
  }

  async banUser(userId, reason) {
    const response = await fetch(`/api/v1/admin/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    await this.eventBus.emit('frontend:admin:action_logged', { action: 'ban_user', userId });
    return response.json();
  }

  async removeContent(contentId, type) {
    const response = await fetch(`/api/v1/admin/content/${contentId}/remove`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
    await this.eventBus.emit('frontend:admin:action_logged', { action: 'remove_content', contentId });
    return response.json();
  }
}
module.exports = AdminModule;
