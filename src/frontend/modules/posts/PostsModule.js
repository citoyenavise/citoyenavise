/**
 * PostsModule.js
 * Composants pour créer et afficher les publications
 * Level 2 (Domain) — Dépend de : auth, users
 */

class PostsModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.posts = new Map();
    this.userPosts = new Map();
  }

  async initialize() {
    console.log('[Posts] Initialisation du module posts');

    // S'abonner aux événements utilisateur
    this.eventBus.on('user:created', async (event) => {
      console.log('[Posts] Nouvel utilisateur détecté:', event.payload.userId);
    });

    await this.eventBus.emit('frontend:posts:ready', {
      timestamp: new Date().toISOString(),
    });
  }

  async createPost(userId, content, metadata = {}) {
    try {
      const response = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content, ...metadata }),
      });

      const post = await response.json();
      this.posts.set(post.id, post);

      if (!this.userPosts.has(userId)) {
        this.userPosts.set(userId, []);
      }
      this.userPosts.get(userId).push(post.id);

      console.log(`[Posts] Post créé: ${post.id}`);

      await this.eventBus.emit('frontend:posts:created', {
        postId: post.id,
        userId,
        contentLength: content.length,
      });

      return post;
    } catch (error) {
      console.error('[Posts] Erreur création post:', error);
      throw error;
    }
  }

  async getPost(postId) {
    try {
      if (this.posts.has(postId)) {
        return this.posts.get(postId);
      }

      const response = await fetch(`/api/v1/posts/${postId}`);
      const post = await response.json();
      this.posts.set(postId, post);

      return post;
    } catch (error) {
      console.error('[Posts] Erreur chargement post:', error);
      throw error;
    }
  }

  async getFeedPosts(userId, limit = 20) {
    try {
      const response = await fetch(`/api/v1/posts?userId=${userId}&limit=${limit}`);
      const { posts } = await response.json();

      for (const post of posts) {
        this.posts.set(post.id, post);
      }

      return posts;
    } catch (error) {
      console.error('[Posts] Erreur chargement feed:', error);
      throw error;
    }
  }

  getUserPosts(userId) {
    const postIds = this.userPosts.get(userId) || [];
    return postIds.map(id => this.posts.get(id)).filter(Boolean);
  }

  getPost(postId) {
    return this.posts.get(postId);
  }
}

module.exports = PostsModule;
