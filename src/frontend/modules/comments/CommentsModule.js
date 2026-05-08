/**
 * CommentsModule.js — Level 3 (Derived) — Dépend de : auth, users, posts, ideas
 */
class CommentsModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.comments = new Map();
    this.commentCounts = new Map();
  }

  async initialize() {
    console.log('[Comments] Initialisation');
    this.eventBus.on('post:created', (event) => {
      this.commentCounts.set(`post:${event.payload.postId}`, 0);
    });
    await this.eventBus.emit('frontend:comments:ready', { timestamp: new Date().toISOString() });
  }

  async addComment(userId, contentType, contentId, text) {
    const response = await fetch(`/api/v1/comments/${contentType}/${contentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text }),
    });
    const comment = await response.json();
    this.comments.set(comment.id, comment);
    const key = `${contentType}:${contentId}`;
    this.commentCounts.set(key, (this.commentCounts.get(key) || 0) + 1);
    await this.eventBus.emit('frontend:comments:added', { commentId: comment.id, contentId });
    return comment;
  }

  getCommentCount(contentType, contentId) {
    return this.commentCounts.get(`${contentType}:${contentId}`) || 0;
  }
}
module.exports = CommentsModule;
