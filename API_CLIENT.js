/**
 * Client API Citoyen Avisé
 * Utilisation simple et centralisée de l'API backend
 *
 * Usage:
 * import { api } from './api-client'
 * const posts = await api.posts.list({ page: 1, limit: 20 })
 * const user = await api.auth.me()
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// ============================================
// Gestion des tokens
// ============================================

class TokenManager {
  setAccessToken(token) {
    localStorage.setItem('accessToken', token);
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  setRefreshToken(token) {
    localStorage.setItem('refreshToken', token);
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  clear() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

const tokenManager = new TokenManager();

// ============================================
// Fetch wrapper avec gestion d'erreurs
// ============================================

class ApiClient {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
    this.requestQueue = [];
    this.isRefreshing = false;
  }

  /**
   * Effectuer une requête HTTP
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Ajouter token si disponible
    const token = tokenManager.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Gérer 401 (token expiré)
    if (response.status === 401 && token) {
      // Attendre que le refresh soit fait si déjà en cours
      if (this.isRefreshing) {
        return new Promise((resolve, reject) => {
          this.requestQueue.push({ resolve, reject, options, endpoint });
        });
      }

      this.isRefreshing = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshResponse.ok) {
          // Refresh échoué → logout
          tokenManager.clear();
          throw new Error('Refresh failed');
        }

        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData.data.accessToken;
        tokenManager.setAccessToken(newAccessToken);

        // Retry la requête originale
        headers.Authorization = `Bearer ${newAccessToken}`;
        response = await fetch(url, { ...options, headers });

        // Vider la queue des requêtes en attente
        this.requestQueue.forEach(({ resolve }) => {
          resolve(response.clone());
        });
        this.requestQueue = [];
      } catch (err) {
        this.requestQueue.forEach(({ reject }) => reject(err));
        this.requestQueue = [];
        throw err;
      } finally {
        this.isRefreshing = false;
      }
    }

    // Parser la réponse
    const data = await response.json();

    // Vérifier le statut
    if (!response.ok) {
      const error = new Error(data.error?.message || 'API Error');
      error.code = data.error?.code;
      error.status = response.status;
      error.details = data.error?.details;
      throw error;
    }

    return data;
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// ============================================
// Instance client
// ============================================

const client = new ApiClient(API_BASE);

// ============================================
// API Resources (structuré par module)
// ============================================

export const api = {
  // ========== AUTH ==========
  auth: {
    async register(email, password, username) {
      const response = await client.post('/auth/register', {
        email,
        password,
        username,
      });
      const { accessToken, refreshToken } = response.data;
      tokenManager.setAccessToken(accessToken);
      tokenManager.setRefreshToken(refreshToken);
      return response.data;
    },

    async login(email, password) {
      const response = await client.post('/auth/login', { email, password });
      const { accessToken, refreshToken } = response.data;
      tokenManager.setAccessToken(accessToken);
      tokenManager.setRefreshToken(refreshToken);
      return response.data;
    },

    async refresh(refreshToken) {
      const response = await client.post('/auth/refresh', { refreshToken });
      const { accessToken } = response.data;
      tokenManager.setAccessToken(accessToken);
      return response.data;
    },

    async logout() {
      try {
        await client.post('/auth/logout');
      } finally {
        tokenManager.clear();
      }
    },

    async me() {
      const response = await client.get('/auth/me');
      return response.data;
    },

    isAuthenticated() {
      return !!tokenManager.getAccessToken();
    },

    logout_local() {
      tokenManager.clear();
    },
  },

  // ========== USERS ==========
  users: {
    async get(id) {
      const response = await client.get(`/users/${id}`);
      return response.data;
    },

    async update(id, data) {
      const response = await client.put(`/users/${id}`, data);
      return response.data;
    },

    async delete(id) {
      await client.delete(`/users/${id}`);
    },
  },

  // ========== PROFILES ==========
  profiles: {
    async list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const response = await client.get(`/profiles?${qs}`);
      return response.data;
    },

    async get(id) {
      const response = await client.get(`/profiles/${id}`);
      return response.data;
    },

    async update(id, data) {
      const response = await client.put(`/profiles/${id}`, data);
      return response.data;
    },

    async getPosts(id, params = {}) {
      const qs = new URLSearchParams(params).toString();
      const response = await client.get(`/profiles/${id}/posts?${qs}`);
      return response.data;
    },

    async getFollowers(id) {
      const response = await client.get(`/profiles/${id}/followers`);
      return response.data;
    },

    async follow(id) {
      const response = await client.post(`/profiles/${id}/follow`);
      return response.data;
    },

    async unfollow(id) {
      await client.delete(`/profiles/${id}/follow`);
    },
  },

  // ========== POSTS ==========
  posts: {
    async list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const response = await client.get(`/posts?${qs}`);
      return response.data;
    },

    async get(id) {
      const response = await client.get(`/posts/${id}`);
      return response.data;
    },

    async create(data) {
      const response = await client.post('/posts', data);
      return response.data;
    },

    async update(id, data) {
      const response = await client.put(`/posts/${id}`, data);
      return response.data;
    },

    async delete(id) {
      await client.delete(`/posts/${id}`);
    },

    async flag(id, reason) {
      const response = await client.post(`/posts/${id}/flag`, { reason });
      return response.data;
    },
  },

  // ========== LIKES ==========
  likes: {
    async like(postId) {
      const response = await client.post(`/likes/posts/${postId}/like`);
      return response.data;
    },

    async unlike(postId) {
      await client.delete(`/likes/posts/${postId}/like`);
    },

    async getList(postId, params = {}) {
      const qs = new URLSearchParams(params).toString();
      const response = await client.get(`/likes/posts/${postId}/likes?${qs}`);
      return response.data;
    },

    async check(postId) {
      const response = await client.get(`/likes/posts/${postId}/likes/check`);
      return response.data.isLiked;
    },
  },

  // ========== COMMENTS ==========
  comments: {
    async create(postId, content) {
      const response = await client.post(`/comments/posts/${postId}/comments`, {
        content,
      });
      return response.data;
    },

    async getByPost(postId, params = {}) {
      const qs = new URLSearchParams(params).toString();
      const response = await client.get(
        `/comments/posts/${postId}/comments?${qs}`
      );
      return response.data;
    },

    async get(commentId) {
      const response = await client.get(`/comments/comments/${commentId}`);
      return response.data;
    },

    async update(commentId, content) {
      const response = await client.put(`/comments/comments/${commentId}`, {
        content,
      });
      return response.data;
    },

    async delete(commentId) {
      await client.delete(`/comments/comments/${commentId}`);
    },
  },

  // ========== IDEAS ==========
  ideas: {
    async list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const response = await client.get(`/ideas?${qs}`);
      return response.data;
    },

    async getPopular(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const response = await client.get(`/ideas/popular?${qs}`);
      return response.data;
    },

    async get(id) {
      const response = await client.get(`/ideas/${id}`);
      return response.data;
    },

    async create(data) {
      const response = await client.post('/ideas', data);
      return response.data;
    },

    async update(id, data) {
      const response = await client.put(`/ideas/${id}`, data);
      return response.data;
    },

    async delete(id) {
      await client.delete(`/ideas/${id}`);
    },

    async like(id) {
      const response = await client.post(`/ideas/${id}/like`);
      return response.data;
    },

    async unlike(id) {
      await client.delete(`/ideas/${id}/like`);
    },
  },

  // ========== POPULAR ==========
  popular: {
    async list(params = {}) {
      const qs = new URLSearchParams({
        range: 'daily',
        sort: 'score',
        page: 1,
        limit: 10,
        ...params,
      }).toString();
      const response = await client.get(`/popular?${qs}`);
      return response.data;
    },
  },

  // ========== SEARCH ==========
  search: {
    async all(q, params = {}) {
      const qs = new URLSearchParams({ q, ...params }).toString();
      const response = await client.get(`/search?${qs}`);
      return response.data;
    },

    async posts(q, params = {}) {
      const qs = new URLSearchParams({ q, ...params }).toString();
      const response = await client.get(`/search/posts?${qs}`);
      return response.data;
    },

    async users(q) {
      const response = await client.get(`/search/users?q=${q}`);
      return response.data;
    },
  },

  // ========== MAP ==========
  map: {
    async getNodes() {
      const response = await client.get('/map/nodes');
      return response.data;
    },

    async createNode(data) {
      const response = await client.post('/map/nodes', data);
      return response.data;
    },

    async updateNode(id, data) {
      const response = await client.put(`/map/nodes/${id}`, data);
      return response.data;
    },

    async deleteNode(id) {
      await client.delete(`/map/nodes/${id}`);
    },
  },

  // ========== UTILITAIRES ==========
  setAuthToken(token) {
    tokenManager.setAccessToken(token);
  },

  getAuthToken() {
    return tokenManager.getAccessToken();
  },

  isAuthenticated() {
    return !!tokenManager.getAccessToken();
  },

  logout() {
    tokenManager.clear();
  },
};

// Export du client brut si besoin
export { client, tokenManager };
