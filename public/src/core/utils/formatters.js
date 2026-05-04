/**
 * Formatters - Formatage de données
 */

module.exports = {
  /**
   * Formater un nombre en monnaie
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  },

  /**
   * Formater un nombre
   */
  formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
  },

  /**
   * Formater une durée relative (ex: "il y a 2 heures")
   */
  formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes}m`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 7) return `il y a ${days}j`;

    return module.exports.formatDate(date);
  },

  /**
   * Formater une date longue
   */
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  /**
   * Formater une date/heure
   */
  formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Tronquer un texte
   */
  truncate(text, length = 100) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  },

  /**
   * Capitaliser première lettre
   */
  capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  },

  /**
   * Slugifier un texte
   */
  slug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  },
};
