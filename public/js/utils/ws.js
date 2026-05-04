/**
 * WebSocket Client — Real-time updates
 * Auto-reconnect + event dispatching
 */

class WebSocketClient {
  constructor(url = null) {
    this.url = url || this.resolveURL();
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.subscriptions = new Set();
    this.messageHandlers = {};
  }

  /**
   * Résoudre l'URL du serveur WebSocket
   */
  resolveURL() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
  }

  /**
   * Se connecter au serveur
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WS] Connected');
          this.reconnectAttempts = 0;
          resolve();

          // Dispatcher event
          const event = new CustomEvent('ws:connected');
          document.dispatchEvent(event);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WS] Disconnected');
          this.handleDisconnect();
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Reconnecter automatiquement
   */
  handleDisconnect() {
    const event = new CustomEvent('ws:disconnected');
    document.dispatchEvent(event);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect().catch(err => {
          console.warn('[WS] Reconnect failed:', err.message);
        });
      }, delay);
    } else {
      console.error('[WS] Max reconnection attempts reached');
      const event = new CustomEvent('ws:reconnect-failed');
      document.dispatchEvent(event);
    }
  }

  /**
   * Traiter les messages du serveur
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('[WS] Message:', message.type);

      // Dispatcher l'event spécifique
      const event = new CustomEvent('ws:message', {
        detail: message,
      });
      document.dispatchEvent(event);

      // Appeler les handlers spécifiques
      if (this.messageHandlers[message.type]) {
        this.messageHandlers[message.type](message);
      }
    } catch (err) {
      console.error('[WS] Parse error:', err);
    }
  }

  /**
   * S'abonner aux mises à jour d'une idée
   */
  subscribe(ideaId, userId = null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Not connected');
      return;
    }

    this.subscriptions.add(ideaId);

    this.ws.send(JSON.stringify({
      type: 'subscribe',
      ideaId,
      userId,
    }));

    console.log('[WS] Subscribed to idea:', ideaId);
  }

  /**
   * Se désabonner
   */
  unsubscribe(ideaId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Not connected');
      return;
    }

    this.subscriptions.delete(ideaId);

    this.ws.send(JSON.stringify({
      type: 'unsubscribe',
      ideaId,
    }));

    console.log('[WS] Unsubscribed from idea:', ideaId);
  }

  /**
   * Envoyer un message au serveur
   */
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Ping pour tester la connexion
   */
  ping() {
    this.send({ type: 'ping' });
  }

  /**
   * Enregistrer un handler pour un type de message
   */
  on(type, handler) {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
    }
    this.messageHandlers[type].push(handler);
  }

  /**
   * Vérifier si connecté
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Fermer la connexion
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Singleton global
const ws = new WebSocketClient();

// Auto-init après chargement de la page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ws.connect().catch(err => {
      console.warn('[WS] Initial connection failed:', err.message);
    });
  });
} else {
  ws.connect().catch(err => {
    console.warn('[WS] Initial connection failed:', err.message);
  });
}
