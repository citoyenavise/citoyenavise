/**
 * LikesModule.js
 * Système de j'aime pour posts et idées
 * Level 3 (Derived) — Dépend de : auth, users, posts, ideas
 */

class LikesModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.likes = new Map();
    this.likeCounts = new Map();
  }

  async initialize() {
    console.log('[Likes] Initialisation du module likes');

    // S'abonner aux événements posts/idées
    this.eventBus.on('post:created', (event) => {
      this.likeCounts.set(`post:${event.payload.postId}`, 0);
    });

    this.eventBus.on('idea:created', (event) => {
      this.likeCounts.set(`idea:${event.payload.ideaId}`, 0);
    });

    await this.eventBus.emit('frontend:likes:ready', {
      timestamp: new Date().toISOString(),
    });
  }

  async likePost(userId, postId) {
    try {
      const response = await fetch(`/api/v1/likes/post/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const like = await response.json();
      const key = `like:${userId}:post:${postId}`;
      this.likes.set(key, like);

      const countKey = `post:${postId}`;
      this.likeCounts.set(countKey, (this.likeCounts.get(countKey) || 0) + 1);

      console.log(`[Likes] Post ${postId} liké par ${userId}`);

      await this.eventBus.emit('frontend:likes:added', {
        userId,
        postId,
        likeCount: this.likeCounts.get(countKey),
      });

      return like;
    } catch (error) {
      console.error('[Likes] Erreur like post:', error);
      throw error;
    }
  }

  async unlikePost(userId, postId) {
    try {
      await fetch(`/api/v1/likes/post/${postId}`, { method: 'DELETE' });

      const key = `like:${userId}:post:${postId}`;
      this.likes.delete(key);

      const countKey = `post:${postId}`;
      this.likeCounts.set(countKey, Math.max(0, (this.likeCounts.get(countKey) || 0) - 1));

      console.log(`[Likes] Post ${postId} unlike par ${userId}`);

      await this.eventBus.emit('frontend:likes:removed', {
        userId,
        postId,
        likeCount: this.likeCounts.get(countKey),
      });
    } catch (error) {
      console.error('[Likes] Erreur unlike:', error);
      throw error;
    }
  }

  getLikeCount(contentType, contentId) {
    const key = `${contentType}:${contentId}`;
    return this.likeCounts.get(key) || 0;
  }

  isLikedByUser(userId, contentType, contentId) {
    const key = `like:${userId}:${contentType}:${contentId}`;
    return this.likes.has(key);
  }
}

module.exports = LikesModule;
