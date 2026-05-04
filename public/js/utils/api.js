/**
 * Client API — Citoyen Avisé
 * Wrapper pour communiquer avec le backend
 */

class APIClient {
  constructor(baseURL = null) {
    // Déterminer dynamiquement la baseURL
    if (baseURL) {
      this.baseURL = baseURL;
    } else {
      this.baseURL = this.resolveBaseURL();
    }
  }

  /**
   * Résoudre la baseURL automatiquement
   */
  resolveBaseURL() {
    // 1. Vérifier window.CONFIG (défini dans HTML)
    if (window.CONFIG && window.CONFIG.API_URL) {
      return window.CONFIG.API_URL;
    }

    // 2. Vérifier meta tag
    const metaApi = document.querySelector('meta[name="api-url"]');
    if (metaApi) {
      return metaApi.getAttribute('content');
    }

    // 3. Vérifier localStorage (pour dev)
    const stored = localStorage.getItem('API_URL');
    if (stored) {
      return stored;
    }

    // 4. Déduire du hostname
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const port = isLocalhost ? ':5000' : '';

    return `${protocol}//${hostname}${port}/api/v1`;
  }

  /**
   * Setter pour configurer l'API URL dynamiquement (debug)
   */
  setBaseURL(baseURL) {
    this.baseURL = baseURL;
  }

  /**
   * Getter pour voir quelle URL est utilisée
   */
  getBaseURL() {
    return this.baseURL;
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

        // 401: Auto-logout et redirect
        if (response.status === 401) {
          console.warn('[API] Unauthorized - logging out');
          this.clearToken();
          localStorage.removeItem('ca_refresh_token');
          localStorage.removeItem('ca_user');
          localStorage.removeItem('ca_profile');

          // Dispatch event pour les listeners
          const event = new CustomEvent('unauthorized', { detail: { error: error.message } });
          document.dispatchEvent(event);

          // Redirect si possible
          if (window.location.pathname !== '/login') {
            setTimeout(() => {
              window.location.href = '/login';
            }, 500);
          }
        }

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
    register: (email, password, username) => {
      return this.request('POST', '/auth/register', { email, password, username }).then(res => {
        if (res.accessToken) {
          this.setToken(res.accessToken);
          if (res.refreshToken) {
            localStorage.setItem('ca_refresh_token', res.refreshToken);
          }
        }
        return res;
      });
    },

    login: (email, password) => {
      return this.request('POST', '/auth/login', { email, password }).then(res => {
        if (res.accessToken) {
          this.setToken(res.accessToken);
          if (res.refreshToken) {
            localStorage.setItem('ca_refresh_token', res.refreshToken);
          }
        }
        return res;
      });
    },

    getMe: () =>
      this.request('GET', '/auth/me'),

    refresh: (refreshToken) =>
      this.request('POST', '/auth/refresh', { refreshToken }).then(res => {
        if (res.accessToken) {
          this.setToken(res.accessToken);
        }
        return res;
      }),

    logout: (refreshToken) => {
      if (refreshToken) {
        return this.request('POST', '/auth/logout', { refreshToken }).then(() => {
          this.clearToken();
          localStorage.removeItem('ca_refresh_token');
          localStorage.removeItem('ca_user');
          localStorage.removeItem('ca_profile');
        }).catch(err => {
          console.warn('Logout error:', err.message);
          this.clearToken();
          localStorage.removeItem('ca_refresh_token');
        });
      } else {
        this.clearToken();
        localStorage.removeItem('ca_refresh_token');
        localStorage.removeItem('ca_user');
        localStorage.removeItem('ca_profile');
        return Promise.resolve();
      }
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
   * LIKES
   */
  likes = {
    like: (postId) =>
      this.request('POST', '/likes', { postId }),

    unlike: (postId) =>
      this.request('DELETE', `/likes/${postId}`),

    getPostLikes: (postId, limit = 20) => {
      let query = `?limit=${limit}`;
      return this.request('GET', `/likes/posts/${postId}/likes${query}`);
    },

    checkLike: (postId) =>
      this.request('GET', `/likes/posts/${postId}/likes/check`),
  };

  /**
   * POPULAR SYSTEM
   */
  popular = {
    getIdeas: (limit = 10, category = null, timeframe = '7d') => {
      let query = `?limit=${limit}&timeframe=${timeframe}`;
      if (category) query += `&category=${encodeURIComponent(category)}`;
      return this.request('GET', `/popular/ideas${query}`);
    },

    getPosts: (limit = 10, sort = 'likes') => {
      let query = `?limit=${limit}&sort=${sort}`;
      return this.request('GET', `/popular/posts${query}`);
    },

    getTrending: (limit = 5) =>
      this.request('GET', `/popular/trending?limit=${limit}`),

    getHomepage: () =>
      this.request('GET', '/popular/homepage'),
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
