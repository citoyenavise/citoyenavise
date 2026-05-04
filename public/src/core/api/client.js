/**
 * Client API — Citoyen Avisé
 * Wrapper pour communiquer avec le backend
 */

class APIClient {
  constructor(baseURL = 'http://localhost:5000/api/v1') {
    this.baseURL = baseURL;
  }

  /**
   * Récupérer token du localStorage
   */
  getToken() {
    return localStorage.getItem('ca_token');
  }

  /**
   * Sauvegarder token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem('ca_token', token);
    }
  }

  /**
   * Effacer token
   */
  clearToken() {
    localStorage.removeItem('ca_token');
  }

  /**
   * Request générique
   */
  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Ajouter token si présent
    const token = this.getToken();
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    // Body pour POST/PUT
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      // Vérifier statut
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // Traiter réponse
      if (response.status === 204) {
        return null; // No content
      }

      return await response.json();
    } catch (err) {
      console.error(`[API] ${method} ${endpoint}`, err.message);
      throw err;
    }
  }

  /**
   * AUTH
   */
  auth = {
    register: (email, password, username) =>
      this.request('POST', '/auth/register', { email, password, username }),

    login: (email, password) =>
      this.request('POST', '/auth/login', { email, password }),

    getMe: () =>
      this.request('GET', '/auth/me'),

    logout: () => {
      this.clearToken();
      return Promise.resolve();
    },
  };

  /**
   * USERS
   */
  users = {
    get: (id) =>
      this.request('GET', `/users/${id}`),

    update: (id, data) =>
      this.request('PUT', `/users/${id}`, data),

    delete: (id) =>
      this.request('DELETE', `/users/${id}`),
  };

  /**
   * PROFILES
   */
  profiles = {
    list: (limit = 20, page = 1, search = null, region = null) => {
      let query = `?limit=${limit}&page=${page}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (region) query += `&region=${encodeURIComponent(region)}`;
      return this.request('GET', `/profiles${query}`);
    },

    get: (id) =>
      this.request('GET', `/profiles/${id}`),

    create: (data) =>
      this.request('POST', '/profiles', data),

    update: (id, data) =>
      this.request('PUT', `/profiles/${id}`, data),

    getPosts: (id, limit = 20, page = 1) =>
      this.request('GET', `/profiles/${id}/posts?limit=${limit}&page=${page}`),

    getFollowers: (id, limit = 20, page = 1) =>
      this.request('GET', `/profiles/${id}/followers?limit=${limit}&page=${page}`),

    follow: (id) =>
      this.request('POST', `/profiles/${id}/follow`),

    unfollow: (id) =>
      this.request('DELETE', `/profiles/${id}/follow`),
  };

  /**
   * POSTS
   */
  posts = {
    list: (limit = 20, page = 1, category = null, type = null, sort = 'latest') => {
      let query = `?limit=${limit}&page=${page}&sort=${sort}`;
      if (category) query += `&category=${encodeURIComponent(category)}`;
      if (type) query += `&type=${encodeURIComponent(type)}`;
      return this.request('GET', `/posts${query}`);
    },

    get: (id) =>
      this.request('GET', `/posts/${id}`),

    create: (data) =>
      this.request('POST', '/posts', data),

    update: (id, data) =>
      this.request('PUT', `/posts/${id}`, data),

    delete: (id) =>
      this.request('DELETE', `/posts/${id}`),

    like: (id) =>
      this.request('POST', `/posts/${id}/like`),

    unlike: (id) =>
      this.request('DELETE', `/posts/${id}/like`),

    flag: (id, reason = '') =>
      this.request('POST', `/posts/${id}/flag`, { reason }),
  };

  /**
   * IDEAS
   */
  ideas = {
    list: (limit = 20, page = 1, category = null, sort = 'latest') => {
      let query = `?limit=${limit}&page=${page}&sort=${sort}`;
      if (category) query += `&category=${encodeURIComponent(category)}`;
      return this.request('GET', `/ideas${query}`);
    },

    getPopular: (limit = 5, category = null) => {
      let query = `?limit=${limit}`;
      if (category) query += `&category=${encodeURIComponent(category)}`;
      return this.request('GET', `/ideas/popular${query}`);
    },

    get: (id) =>
      this.request('GET', `/ideas/${id}`),

    create: (data) =>
      this.request('POST', '/ideas', data),

    update: (id, data) =>
      this.request('PUT', `/ideas/${id}`, data),

    delete: (id) =>
      this.request('DELETE', `/ideas/${id}`),

    like: (id) =>
      this.request('POST', `/ideas/${id}/like`),

    unlike: (id) =>
      this.request('DELETE', `/ideas/${id}/like`),
  };

  /**
   * MAP
   */
  map = {
    getNodes: (bounds = null, region = null, limit = 200) => {
      let query = `?limit=${limit}`;
      if (bounds) query += `&bounds=${bounds}`;
      if (region) query += `&region=${region}`;
      return this.request('GET', `/map/nodes${query}`);
    },
  };
}

// Export singleton
const api = new APIClient();
