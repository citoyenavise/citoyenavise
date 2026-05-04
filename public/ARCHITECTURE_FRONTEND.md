# 🏗️ Architecture Frontend Modulaire

## 📋 Vue d'ensemble

Le frontend a été restructuré en **architecture modulaire** permettant:
- ✅ Développement parallèle des 28 modules
- ✅ Isolation des dépendances
- ✅ Réutilisabilité des composants
- ✅ Maintenance simplifiée

## 🗂️ Structure

```
public/
├── index.html                           # App shell principal

├── src/
│   ├── modules/                         # 28 modules métier
│   │   ├── auth/                        # Module Auth
│   │   │   ├── pages/
│   │   │   │   ├── login.html
│   │   │   │   └── register.html
│   │   │   ├── js/
│   │   │   │   ├── module.js           # Logique du module
│   │   │   │   └── index.js            # Export
│   │   │   ├── css/
│   │   │   │   └── module.css          # Styles du module
│   │   │   └── index.js                # Exports
│   │   │
│   │   ├── profiles/                    # Module Profiles
│   │   ├── posts/                       # Module Posts
│   │   ├── ideas/                       # Module Ideas
│   │   ├── map/                         # Module Map
│   │   ├── [22 autres modules]
│   │   └── ...
│   │
│   ├── shared/                          # Code partagé
│   │   ├── components/
│   │   │   ├── Header.js                # Navigation
│   │   │   ├── Modal.js                 # Modales
│   │   │   ├── Toast.js                 # Notifications
│   │   │   ├── Card.js                  # Cartes
│   │   │   └── ... (12+ composants)
│   │   │
│   │   ├── layouts/
│   │   │   ├── AppLayout.js             # Layout principal
│   │   │   ├── AuthLayout.js            # Layout authentification
│   │   │   └── AdminLayout.js           # Layout admin (future)
│   │   │
│   │   ├── css/
│   │   │   └── components.css           # Styles composants
│   │   │
│   │   └── index.js
│   │
│   ├── core/                            # Services centralisés
│   │   ├── api/
│   │   │   ├── client.js                # HTTP client
│   │   │   ├── auth.js                  # Auth API
│   │   │   ├── users.js                 # Users API
│   │   │   ├── posts.js                 # Posts API
│   │   │   └── ... (modules)
│   │   │
│   │   ├── store/
│   │   │   ├── index.js                 # Store principal
│   │   │   ├── auth.js                  # Auth state
│   │   │   ├── user.js                  # User state
│   │   │   └── notifications.js         # Notifications state
│   │   │
│   │   ├── router/
│   │   │   └── index.js                 # Router SPA
│   │   │
│   │   ├── utils/
│   │   │   ├── helpers.js               # Helpers
│   │   │   ├── formatters.js            # Formatage de données
│   │   │   ├── validators.js            # Validation
│   │   │   └── constants.js             # Constantes
│   │   │
│   │   └── index.js
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── css/
│   │   ├── global.css                   # Styles globaux
│   │   ├── variables.css                # Variables CSS
│   │   ├── responsive.css               # Responsive
│   │   └── animations.css               # Animations
│   │
│   ├── app.js                           # Entry point
│   └── index.js
│
└── pages/                               # Pages HTML (old - à migrer)
    ├── index.html
    ├── login.html
    └── ...
```

## 🔄 Pattern de module

Chaque module suit ce pattern standardisé:

```
modules/mon_module/
├── pages/
│   ├── index.html                       # Pages HTML
│   └── autre.html
├── js/
│   ├── module.js                        # Logique métier
│   └── index.js                         # Exports
├── css/
│   └── module.css                       # Styles spécifiques
└── index.js                             # Export du module
```

## 🎯 Modules MVP (6 modules - À migrer)

### 1. **auth** - Authentification
- Pages: login.html, register.html
- État: ✅ Framework créé, À migrer

### 2. **profiles** - Profils citoyens
- État: ✅ Framework créé, À migrer

### 3. **posts** - Publications civiques
- État: ✅ Framework créé, À migrer

### 4. **ideas** - Idées civiques
- État: ✅ Framework créé, À migrer

### 5. **map** - Carte interactive
- État: ✅ Framework créé, À migrer

### 6. **users** - Gestion utilisateurs
- État: ✅ Framework créé, À migrer

## 📦 Modules Phase 2+ (22 modules - Templates)

- notifications, likes, popular_system, search, admin, moderation, groups, friends, follow, etc.

## 🔌 Couche Core API

### API Client
```javascript
const { api } = require('../../core');

// Requête générique
await api.get('/auth/me');
await api.post('/posts', { title: '...', content: '...' });
await api.put('/profiles/123', { bio: '...' });
await api.delete('/posts/456');
```

### Store (State Management)
```javascript
const { store } = require('../../core');

// Obtenir le state
const user = store.get('auth.user');
const isAuth = store.get('auth.isAuthenticated');

// Définir
store.set('auth.user', userData);
store.setState({ auth: {...} });

// Listeners
const unsubscribe = store.on('auth.isAuthenticated', (value) => {
  console.log('Auth status changed:', value);
});
```

### Router
```javascript
const { router } = require('../../core');

// Enregistrer route
router.register('/profiles/:id', (path) => {...});

// Naviguer
router.navigate('/profiles/123');

// Extraire paramètres
const params = router.getParams('/profiles/:id', '/profiles/abc123');
// { id: 'abc123' }
```

### Utils
```javascript
const { helpers, formatters, validators, constants } = require('../../core');

// Helpers
helpers.formatDate(date);
helpers.isAuthenticated();
helpers.showToast('Message');

// Formatters
formatters.formatDate(date);
formatters.formatRelativeTime(date);
formatters.truncate(text, 100);

// Validators
validators.email('test@example.com');
validators.password('Secure123');
validators.validate(data, schema);

// Constants
constants.POST_CATEGORIES
constants.USER_ROLES
constants.PROVINCES
```

## 🛠️ Ajouter un nouveau module

### Étape 1: Créer la structure
```bash
# Déjà créée! 28 dossiers prêts
```

### Étape 2: Créer les pages
```html
<!-- modules/mon_module/pages/index.html -->
<div class="module-container">
  <h1>Mon module</h1>
  <!-- Contenu -->
</div>
```

### Étape 3: Créer la logique
```javascript
// modules/mon_module/js/module.js
const { api, store } = require('../../../core');

const module = {
  async init(path) {
    // Charger les données
    const data = await api.get('/endpoint');
    
    // Mettre à jour le state
    store.set('module.data', data);
    
    // Rendre la page
    this.render(data);
  },

  render(data) {
    // Rendre le contenu
    const content = document.querySelector('#page-content');
    content.innerHTML = '<h1>Mon module</h1>';
  },
};

module.exports = module;
```

### Étape 4: Créer les styles
```css
/* modules/mon_module/css/module.css */
.module-container {
  padding: 2rem;
}
```

### Étape 5: Enregistrer la route
```javascript
// src/app.js
const routes = {
  '/mon-page': () => require('./modules/mon_module/js/module'),
};
```

## 🎨 Composants Shared

### Header
```javascript
const Header = require('../../shared/components/Header');
const header = new Header();
header.mount('#header-container');
```

### Modal
```javascript
const Modal = require('../../shared/components/Modal');
const modal = new Modal({
  title: 'Confirmation',
  content: 'Êtes-vous sûr?',
  actions: [
    { id: 'yes', label: 'Oui', type: 'primary', callback: () => {...} },
    { id: 'no', label: 'Non', type: 'secondary', callback: () => {...} },
  ],
});
modal.show();
```

### Toast
```javascript
const Toast = require('../../shared/components/Toast');
Toast.success('Succès!');
Toast.error('Erreur!');
Toast.info('Information');
Toast.warning('Avertissement');
```

### Card
```javascript
const Card = require('../../shared/components/Card');
const html = Card.render({
  title: 'Mon Card',
  content: '<p>Contenu</p>',
  footer: '<small>Footer</small>',
});
```

## 🔄 Flow d'une requête

```
User clique sur lien
    ↓
app.js: navigate(path)
    ↓
Router: charger le module correspondant
    ↓
Module: init(path)
    ↓
API Client: appel GET/POST/PUT/DELETE
    ↓
Store: mise à jour du state
    ↓
Module: render(data)
    ↓
DOM mis à jour avec nouveau contenu
```

## 📝 Notes d'implémentation

### Imports
- Core: `require('../../core')`
- Shared: `require('../../shared')`
- Autre module: `require('../auth/...')`

### HTTP Requests
```javascript
const { api } = require('../../../core');

// Tous les imports utilisent le token JWT automatiquement
const data = await api.get('/posts');
const created = await api.post('/posts', { title: '...' });
```

### State Management
```javascript
const { store } = require('../../../core');

// Listener sur changement de state
const unsubscribe = store.on('auth.user', (user) => {
  console.log('User changed:', user);
});

// Unsubscribe
unsubscribe();
```

### Erreurs
```javascript
try {
  const data = await api.get('/endpoint');
} catch (error) {
  Toast.error(error.message);
  console.error('Error:', error);
}
```

## ✅ Structure validée

- ✅ 28 modules créés
- ✅ Core services en place
- ✅ Shared components prêts
- ✅ Router implémenté
- ✅ Store centralisé
- ✅ app.js point d'entrée
- ✅ Imports corrigés

## 🚀 Prochaines étapes

1. Migrer le contenu des anciens modules vers la nouvelle structure
2. Tester le routing et les API calls
3. Implémenter les modules Phase 2
4. Configurer un bundler (Webpack/Parcel)
5. Ajouter les tests frontend

---

**Architecture modulaire frontend prête** ✅
