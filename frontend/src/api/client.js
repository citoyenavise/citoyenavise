/**
 * Client API Citoyen Avisé
 * Utilisation simple et centralisée de l'API backend
 *
 * Configuration API:
 * - VITE_API_URL (env): URL absolue (ex: http://backend:3000/api/v1 pour Docker)
 * - Fallback: '/api' (URL relative, le proxy Vite rétablit en /api/v1/)
 * - Development: Utilise proxy Vite (/api/* → http://localhost:3000/api/v1/*)
 * - Production: URL absolue requise
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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

class ApiClient {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
    this.requestQueue = [];
    this.isRefreshing = false;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = tokenManager.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && token) {
      if (this.isRefreshing) {
        return new Promise((resolve, reject) => {
          this.requestQueue.push({
            resolve, reject, options, endpoint,
          });
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
          tokenManager.clear();
          throw new Error('Refresh failed');
        }

        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData.data.accessToken;
        tokenManager.setAccessToken(newAccessToken);

        headers.Authorization = `Bearer ${newAccessToken}`;
        response = await fetch(url, { ...options, headers });

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

    const data = await response.json();

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

const client = new ApiClient(API_BASE);

export const api = {
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
      async requestMagicLink(email) {
      const response = await client.post('/auth/magic-link', { email });
      return response;
    },

    async verifyMagicLink(token) {
      const response = await client.get(`/auth/verify?token=${encodeURIComponent(token)}`);
      const { accessToken, user } = response;
      tokenManager.setAccessToken(accessToken);
      return { accessToken, user };
    },

    async login(email, password) {
      const response = await client.post('/auth/login', { email, password });
      const { accessToken, refreshToken } = response.data;
      tokenManager.setAccessToken(accessToken);
      tokenManager.setRefreshToken(refreshToken);
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
        `/comments/posts/${postId}/comments?${qs}`,
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

  elus: {
    async list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const response = await client.get(`/elus${qs ? `?${qs}` : ''}`);
      return response.data;
    },

    async get(id) {
      const response = await client.get(`/elus/${id}`);
      return response.data;
    },

    async getPetitions(id, params = {}) {
      const qs = new URLSearchParams(params).toString();
      const response = await client.get(`/elus/${id}/petitions${qs ? `?${qs}` : ''}`);
      return response.data;
    },
  },

  petitions: {
    async list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const response = await client.get(`/petitions${qs ? `?${qs}` : ''}`);
      return response.data;
    },

    async get(id) {
      const response = await client.get(`/petitions/${id}`);
      return response.data;
    },

    async create(data) {
      const response = await client.post('/petitions', data);
      return response.data;
    },

    async sign(id) {
      const response = await client.post(`/petitions/${id}/sign`);
      return response.data;
    },
  },

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

export { client, tokenManager };
