/**
 * AuthService.js
 * Service partagé d'authentification frontend
 * Gère les tokens, sessions, et interactions avec le backend auth module
 */

class AuthService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.currentUser = null;
    this.token = null;
    this.refreshToken = null;
  }

  async authenticate(email, password) {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.token, data.refreshToken);
        this.currentUser = data.user;

        await this.eventBus.emit('auth:success', {
          userId: data.user.id,
          email: data.user.email,
          role: data.user.role,
        });

        return { success: true, user: data.user };
      }

      throw new Error('Authentication failed');
    } catch (error) {
      console.error('[AuthService] Erreur authentification:', error);
      await this.eventBus.emit('auth:failure', { error: error.message });
      throw error;
    }
  }

  setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    try {
      localStorage?.setItem('auth_token', token);
      if (refreshToken) localStorage?.setItem('refresh_token', refreshToken);
    } catch (e) {
      console.warn('[AuthService] Impossible de stocker les tokens');
    }
  }

  getToken() {
    return this.token;
  }

  async refreshAccessToken() {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        localStorage?.setItem('auth_token', data.token);
        return data.token;
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('[AuthService] Erreur refresh token:', error);
      await this.eventBus.emit('auth:token_expired', {});
      throw error;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.token && !!this.currentUser;
  }

  logout() {
    this.token = null;
    this.refreshToken = null;
    this.currentUser = null;
    try {
      localStorage?.removeItem('auth_token');
      localStorage?.removeItem('refresh_token');
    } catch (e) {
      console.warn('[AuthService] Impossible de nettoyer le storage');
    }
  }
}

module.exports = AuthService;
