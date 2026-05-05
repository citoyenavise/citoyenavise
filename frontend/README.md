# Citoyen Avisé - Frontend

Frontend React moderne pour la plateforme Citoyen Avisé.

## 🚀 Installation

### 1. Prérequis
- Node.js 18+
- npm ou yarn

### 2. Installer les dépendances
```bash
cd frontend
npm install
```

### 3. Variables d'environnement
Créer un fichier `.env` à la racine du dossier `frontend/` :

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Citoyen Avisé
```

**En production** :
```env
VITE_API_URL=https://api.citoyenavise.org/api/v1
```

## 📦 Développement

Démarrer le serveur dev (port 3000) :
```bash
npm run dev
```

L'app est accessible sur `http://localhost:3000`

## 🏗️ Structure

```
src/
├── api/
│   └── client.js              # Client API intégré
├── components/
│   ├── ui/                    # Composants de base
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Avatar.jsx
│   │   └── Loader.jsx
│   ├── Header.jsx             # Navigation globale
│   └── ProtectedRoute.jsx     # Routes protégées
├── contexts/
│   └── AuthContext.jsx        # Gestion d'authentification
├── hooks/
│   └── useAuth.js             # Hook d'authentification
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Feed.jsx
│   ├── PostDetail.jsx
│   └── Notifications.jsx
├── App.jsx                    # Routing principal
└── main.jsx                   # Point d'entrée
```

## 🎨 Tailwind CSS

Le projet utilise Tailwind CSS pour les styles. Les couleurs principales sont définies dans `tailwind.config.js`.

### Couleurs
- `primary`: #2563eb (bleu)
- `secondary`: #64748b (gris)
- `success`: #16a34a (vert)
- `error`: #dc2626 (rouge)
- `warning`: #ea580c (orange)

## 🔐 Authentification

L'authentification est gérée par `AuthContext`.

### Usage

```jsx
import { useAuth } from './hooks/useAuth'

export function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <p>Bienvenue, {user.username}</p>
  }
  
  return <p>Non connecté</p>
}
```

## 📡 API Client

L'API client `api` est accessible partout.

```jsx
import { api } from './api/client'

// Authentification
await api.auth.login(email, password)
await api.auth.logout()

// Posts
const posts = await api.posts.list({ page: 1, limit: 10 })
const post = await api.posts.get(postId)

// Commentaires
const comments = await api.comments.getByPost(postId)
```

Voir [FRONTEND_INTEGRATION_GUIDE.md](../FRONTEND_INTEGRATION_GUIDE.md) pour la doc complète.

## 🧪 Build et déploiement

### Build de production
```bash
npm run build
```

Génère un dossier `dist/` prêt à être servé.

### Prévisualiser le build
```bash
npm run preview
```

## 📋 Checkliste de déploiement

- [ ] Variables d'environnement configurées pour la production
- [ ] Build testé localement (`npm run build`)
- [ ] Tests passés
- [ ] Application testée en accès protégé et public
- [ ] Performance vérifiée
- [ ] Sécurité vérifiée (pas de tokens en clair, XSS protection)
- [ ] Redirection vers HTTPS en production
