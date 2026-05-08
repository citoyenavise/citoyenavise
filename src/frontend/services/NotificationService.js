/**
 * NotificationService.js
 * Service de notification frontend
 * Affiche les notifications utilisateur et les logs
 */

class NotificationService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.notifications = [];
    this.listeners = new Set();
  }

  async notify(type, message, options = {}) {
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type, // 'success', 'error', 'warning', 'info'
      message,
      timestamp: new Date().toISOString(),
      duration: options.duration || 5000,
      action: options.action,
    };

    this.notifications.push(notification);
    console.log(`[NotificationService] ${type}: ${message}`);

    // Notifier les listeners
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (e) {
        console.error('[NotificationService] Erreur listener:', e);
      }
    });

    // Auto-remove après duration
    if (options.duration) {
      setTimeout(() => {
        const idx = this.notifications.indexOf(notification);
        if (idx > -1) this.notifications.splice(idx, 1);
      }, options.duration);
    }

    await this.eventBus.emit('notification:sent', {
      type,
      message,
    });

    return notification;
  }

  success(message, options) {
    return this.notify('success', message, options);
  }

  error(message, options) {
    return this.notify('error', message, options);
  }

  warning(message, options) {
    return this.notify('warning', message, options);
  }

  info(message, options) {
    return this.notify('info', message, options);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getNotifications() {
    return [...this.notifications];
  }

  clear() {
    this.notifications = [];
  }
}

module.exports = NotificationService;
