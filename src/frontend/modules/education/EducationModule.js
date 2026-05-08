/**
 * EducationModule.js
 * Composant pour ressources éducatives et guides civiques
 * Level 1 (Standalone) — Pas de dépendances inter-modules
 */

class EducationModule {
  constructor(diContainer, eventBus) {
    this.diContainer = diContainer;
    this.eventBus = eventBus;
    this.content = new Map();
    this.quizzes = new Map();
  }

  async initialize() {
    console.log('[Education] Initialisation du module éducation');

    // Charger le contenu éducatif
    try {
      const response = await fetch('/api/v1/education');
      const data = await response.json();

      for (const item of data.content || []) {
        this.content.set(item.id, item);
      }
      for (const quiz of data.quizzes || []) {
        this.quizzes.set(quiz.id, quiz);
      }

      console.log(`[Education] ${this.content.size} contenus et ${this.quizzes.size} quiz chargés`);

      await this.eventBus.emit('frontend:education:ready', {
        contentCount: this.content.size,
        quizCount: this.quizzes.size,
      });
    } catch (error) {
      console.error('[Education] Erreur d\'initialisation:', error);
      throw error;
    }
  }

  async viewContent(contentId) {
    console.log(`[Education] Affichage du contenu ${contentId}`);

    try {
      const content = this.content.get(contentId);
      if (!content) {
        throw new Error(`Contenu non trouvé: ${contentId}`);
      }

      await this.eventBus.emit('frontend:education:content_viewed', {
        contentId,
        title: content.title,
        timestamp: new Date().toISOString(),
      });

      return content;
    } catch (error) {
      console.error('[Education] Erreur:', error);
      throw error;
    }
  }

  async completeQuiz(quizId, answers) {
    console.log(`[Education] Complétion du quiz ${quizId}`);

    try {
      const quiz = this.quizzes.get(quizId);
      if (!quiz) {
        throw new Error(`Quiz non trouvé: ${quizId}`);
      }

      // Soumettre les réponses
      const response = await fetch(`/api/v1/education/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      const result = await response.json();

      await this.eventBus.emit('frontend:education:quiz_completed', {
        quizId,
        score: result.score,
        totalPoints: quiz.totalPoints,
      });

      return result;
    } catch (error) {
      console.error('[Education] Erreur complétion quiz:', error);
      throw error;
    }
  }

  getContent(contentId) {
    return this.content.get(contentId);
  }

  getAllContent() {
    return Array.from(this.content.values());
  }

  getQuiz(quizId) {
    return this.quizzes.get(quizId);
  }

  getAllQuizzes() {
    return Array.from(this.quizzes.values());
  }
}

module.exports = EducationModule;
