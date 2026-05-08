/**
 * AuthModule.js
 * Composant de gestion d'authentification frontend
 * Level 1 (Standalone) — Pas de dépendances inter-modules
 */

class AuthModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.currentUser = null;
    this.isAuthenticated = false;
    this.token = null;
  }

  async initialize() {
    console.log('[Auth] Initialisation du module authentification');

    // Vérifier si un token est en cache
    const cachedToken = this.getStoredToken();
    if (cachedToken) {
      this.token = cachedToken;
      this.isAuthenticated = true;
      console.log('[Auth] Token retrouvé en cache');
    }

    // Émettre événement de readiness
    await this.eventBus.emit('frontend:auth:ready', {
      isAuthenticated: this.isAuthenticated,
      hasToken: !!this.token,
    });
  }

  async login(email, password) {
    console.log(`[Auth] Tentative de login pour ${email}`);

    try {
      // Émettre événement de tentative
      await this.eventBus.emit('frontend:auth:login_attempt', {
        email,
        timestamp: new Date().toISOString(),
      });

      // Appel backend simulé
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        this.currentUser = data.user;
        this.isAuthenticated = true;

        // Stocker le token
        this.storeToken(this.token);

        console.log(`[Auth] Login réussi pour ${email}`);
        await this.eventBus.emit('frontend:auth:login_success', {
          userId: data.user.id,
          email,
        });

        return { success: true, user: data.user };
      } else {
        console.error('[Auth] Login échoué');
        await this.eventBus.emit('frontend:auth:login_failure', {
          email,
          error: 'Identifiants invalides',
        });
        return { success: false, error: 'Login échoué' };
      }
    } catch (error) {
      console.error('[Auth] Erreur login:', error);
      this.eventBus.metrics.errors++;
      throw error;
    }
  }

  async logout() {
    console.log('[Auth] Logout en cours');

    try {
      // Appel backend
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
      });

      // Nettoyer l'état
      this.token = null;
      this.currentUser = null;
      this.isAuthenticated = false;
      this.clearStoredToken();

      console.log('[Auth] Logout réussi');
      await this.eventBus.emit('frontend:auth:logout', {
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('[Auth] Erreur logout:', error);
      throw error;
    }
  }

  getStoredToken() {
    try {
      return localStorage?.getItem('auth_token');
    } catch {
      return null;
    }
  }

  storeToken(token) {
    try {
      localStorage?.setItem('auth_token', token);
    } catch {
      console.warn('[Auth] Impossible de stocker le token');
    }
  }

  clearStoredToken() {
    try {
      localStorage?.removeItem('auth_token');
    } catch {
      console.warn('[Auth] Impossible de supprimer le token');
    }
  }

  isAuthenticatedUser() {
    return this.isAuthenticated && !!this.token;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getToken() {
    return this.token;
  }
}

module.exports = AuthModule;
