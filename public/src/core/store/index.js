/**
 * Store d'état simple — Gestion de l'utilisateur et sessions
 */

class Store {
  constructor() {
    this.state = {
      user: null,
      profile: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
    this.listeners = [];

    // Restaurer l'état au démarrage
    this.restore();
  }

  /**
   * Restaurer état depuis localStorage
   */
  restore() {
    try {
      const token = localStorage.getItem('ca_token');
      const userJson = localStorage.getItem('ca_user');
      const profileJson = localStorage.getItem('ca_profile');

      if (token && userJson && profileJson) {
        this.state.user = JSON.parse(userJson);
        this.state.profile = JSON.parse(profileJson);
        this.state.isAuthenticated = true;
      }
    } catch (err) {
      console.error('[Store] Restore error', err);
      this.clear();
    }
  }

  /**
   * Obtenir état
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Obtenir utilisateur
   */
  getUser() {
    return this.state.user;
  }

  /**
   * Obtenir profil
   */
  getProfile() {
    return this.state.profile;
  }

  /**
   * Définir utilisateur + profil (après login/register)
   */
  setUser(user, profile) {
    this.state.user = user;
    this.state.profile = profile;
    this.state.isAuthenticated = true;
    this.state.error = null;

    // Sauvegarder
    localStorage.setItem('ca_user', JSON.stringify(user));
    localStorage.setItem('ca_profile', JSON.stringify(profile));

    this.notify();
  }

  /**
   * Mettre à jour profil
   */
  updateProfile(profileData) {
    this.state.profile = { ...this.state.profile, ...profileData };
    localStorage.setItem('ca_profile', JSON.stringify(this.state.profile));
    this.notify();
  }

  /**
   * Définir erreur
   */
  setError(error) {
    this.state.error = error;
    this.notify();
  }

  /**
   * Définir loading
   */
  setLoading(loading) {
    this.state.loading = loading;
    this.notify();
  }

  /**
   * Effacer tout (logout)
   */
  clear() {
    this.state = {
      user: null,
      profile: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
    localStorage.removeItem('ca_token');
    localStorage.removeItem('ca_user');
    localStorage.removeItem('ca_profile');
    this.notify();
  }

  /**
   * Ajouter listener
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifier listeners
   */
  notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}

// Export singleton
const store = new Store();
