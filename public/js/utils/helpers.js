/**
 * Helper utilities
 */

/**
 * Formater date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Aujourd'hui à ${date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (isYesterday) {
    return `Hier à ${date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString('fr-CA', { year: '2-digit', month: 'short', day: 'numeric' });
}

/**
 * Vérifier si utilisateur est authentifié
 */
function isAuthenticated() {
  return !!localStorage.getItem('ca_token');
}

/**
 * Obtenir l'ID utilisateur
 */
function getCurrentUserId() {
  const user = store.getUser();
  return user?.id;
}

/**
 * Afficher toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
  // Créer element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  // Ajouter au DOM
  document.body.appendChild(toast);

  // Animer entrée
  setTimeout(() => toast.classList.add('visible'), 10);

  // Supprimer après délai
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Afficher modal de confirmation
 */
function showConfirm(message) {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <p>${message}</p>
        <div class="modal-buttons">
          <button class="btn btn-secondary btn-sm" id="modal-cancel">Annuler</button>
          <button class="btn btn-danger btn-sm" id="modal-confirm">Confirmer</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#modal-cancel').addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });

    modal.querySelector('#modal-confirm').addEventListener('click', () => {
      modal.remove();
      resolve(true);
    });
  });
}

/**
 * Vérifier si l'utilisateur actuel est le propriétaire
 */
function isOwner(userId) {
  return getCurrentUserId() === userId;
}

/**
 * Raccourcir texte
 */
function truncate(text, length = 100) {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Capitaliser première lettre
 */
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Valider email
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Créer initiales d'un nom
 */
function getInitials(name) {
  return name
    .split(' ')
    .map(n => n.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

/**
 * Obtenir couleur aléatoire
 */
function getRandomColor() {
  const colors = ['#C1272D', '#2A7D32', '#1976D2', '#7B1FA2', '#F57C00', '#0097A7'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Router simple
 */
function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Obtenir paramètres URL
 */
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * Configurer l'API URL (pour debug/override)
 */
function setApiUrl(url) {
  if (api && api.setBaseURL) {
    api.setBaseURL(url);
    localStorage.setItem('API_URL', url);
    console.log(`[Config] API URL changée à: ${url}`);
  }
}

/**
 * Voir l'API URL actuellement utilisée
 */
function getApiUrl() {
  if (api && api.getBaseURL) {
    return api.getBaseURL();
  }
  return 'N/A';
}

/**
 * Afficher la configuration complète (pour debug)
 */
function showConfig() {
  console.group('🔧 Configuration');
  console.log('API URL:', getApiUrl());
  console.log('Hostname:', window.location.hostname);
  console.log('Protocol:', window.location.protocol);
  console.log('Authenticated:', !!localStorage.getItem('ca_token'));
  console.log('User:', store.getUser()?.username || 'Anonymous');
  console.groupEnd();
}
