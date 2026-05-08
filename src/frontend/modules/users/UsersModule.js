/**
 * UsersModule.js
 * Composants pour profils et gestion utilisateurs
 * Level 2 (Domain) — Dépend de : auth
 */

class UsersModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.users = new Map();
    this.currentUser = null;
  }

  async initialize() {
    console.log('[Users] Initialisation du module utilisateurs');

    // S'abonner aux événements auth
    this.eventBus.on('auth:success', async (event) => {
      await this.loadCurrentUser(event.payload.userId);
    });

    await this.eventBus.emit('frontend:users:ready', {
      timestamp: new Date().toISOString(),
    });
  }

  async loadCurrentUser(userId) {
    try {
      const response = await fetch(`/api/v1/users/${userId}`);
      const user = await response.json();
      this.currentUser = user;
      this.users.set(userId, user);

      console.log(`[Users] Utilisateur courant chargé: ${user.id}`);

      await this.eventBus.emit('frontend:users:profile_loaded', {
        userId: user.id,
        username: user.username,
      });

      return user;
    } catch (error) {
      console.error('[Users] Erreur chargement utilisateur:', error);
      throw error;
    }
  }

  async updateUser(userId, data) {
    try {
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const updated = await response.json();
      this.users.set(userId, updated);

      await this.eventBus.emit('frontend:users:updated', {
        userId,
        changes: data,
      });

      return updated;
    } catch (error) {
      console.error('[Users] Erreur mise à jour:', error);
      throw error;
    }
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }
}

module.exports = UsersModule;
