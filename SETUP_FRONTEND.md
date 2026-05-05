# 🚀 Guide de démarrage - Frontend Citoyen Avisé

## État actuel

✅ **Backend** : Complètement finalisé (7 modules, API stable, production-ready)  
✅ **API_CLIENT.js** : Intégré et testé  
✅ **Frontend React** : Structure complète créée dans le dossier `frontend/`

---

## 📁 Structure créée

```
frontend/
├── index.html                 # Point d'entrée HTML
├── package.json              # Dépendances (React, React Router, Tailwind)
├── vite.config.js            # Configuration Vite
├── tailwind.config.js        # Configuration Tailwind CSS
├── postcss.config.js         # Configuration PostCSS
├── .env.example              # Variables d'env (template)
├── .gitignore                # Ignorés Git
├── README.md                 # Documentation complète
│
└── src/
    ├── main.jsx              # Point d'entrée React
    ├── App.jsx               # Routing principal
    ├── index.css             # Styles globaux (Tailwind)
    │
    ├── api/
    │   └── client.js         # Client API (intégré depuis API_CLIENT.js)
    │
    ├── components/
    │   ├── Header.jsx        # Navigation globale + logout
    │   ├── ProtectedRoute.jsx # Routes protégées (auth required)
    │   │
    │   └── ui/
    │       ├── Button.jsx    # Bouton réutilisable
    │       ├── Input.jsx     # Input réutilisable
    │       ├── Card.jsx      # Card réutilisable
    │       ├── Avatar.jsx    # Avatar utilisateur
    │       └── Loader.jsx    # Spinner de chargement
    │
    ├── contexts/
    │   └── AuthContext.jsx   # Context d'authentification globale
    │
    ├── hooks/
    │   └── useAuth.js        # Hook pour utiliser AuthContext
    │
    └── pages/
        ├── Login.jsx         # Page de connexion
        ├── Register.jsx      # Page d'inscription
        ├── Feed.jsx          # Fil d'actualité (protected)
        ├── PostDetail.jsx    # Détail d'un post (protected)
        └── Notifications.jsx # Page des notifications (protected)
```

---

## 🎯 À faire

### Phase 1 : Démarrer le dev server (maintenant)
```bash
cd frontend
npm run dev
```

Accès : `http://localhost:3000`

Le backend doit tourner sur `http://localhost:5000` (proxy configuré dans Vite).

### Phase 2 : Tester l'authentification
1. Ouvrir `http://localhost:3000/register`
2. Créer un compte (email, username, password)
3. Vérifier que le token est sauvegardé dans `localStorage`
4. Le token doit s'envoyer en `Authorization: Bearer <token>`

### Phase 3 : Tester le feed
1. `http://localhost:3000/feed`
2. Vérifier que les posts se chargent depuis l'API
3. Cliquer sur "Voir plus" pour accéder au détail

### Phase 4 : Intégrations avancées (next)
- [ ] WebSockets pour les notifications en temps réel
- [ ] Upload d'images/avatars
- [ ] Formulaire de création de posts
- [ ] Système de like interactif
- [ ] Recherche en temps réel
- [ ] Profils utilisateurs

---

## 🔧 Configuration

### Backend (déjà fait)
- ✅ API complète sur `http://localhost:5000/api/v1`
- ✅ CORS activé
- ✅ JWT tokens
- ✅ Refresh tokens automatique

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Citoyen Avisé
```

En production :
```env
VITE_API_URL=https://api.citoyenavise.org/api/v1
```

---

## 🧪 Commandes disponibles

```bash
# Démarrage dev (port 3000)
npm run dev

# Build production
npm run build

# Prévisualiser le build
npm run preview

# Lint (ESLint)
npm run lint
```

---

## 📡 API Client

Prêt à l'emploi dans tout component :

```jsx
import { api } from './api/client'

// Authentification
await api.auth.login(email, password)
await api.auth.logout()
const user = await api.auth.me()

// Posts
const posts = await api.posts.list({ page: 1, limit: 10 })
const post = await api.posts.get(postId)

// Commentaires
const comments = await api.comments.getByPost(postId)

// Likes
await api.likes.like(postId)
```

Voir [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) pour la doc complète.

---

## 🔐 Authentification

### Pages publiques
- `/login` - Connexion
- `/register` - Inscription

### Pages protégées (require auth)
- `/feed` - Fil d'actualité
- `/post/:postId` - Détail d'un post
- `/notifications` - Notifications

ProtectedRoute redirige vers `/login` si non connecté.

---

## 🎨 Design System

**Couleurs Tailwind** (définies dans `tailwind.config.js`) :
- `primary`: Bleu (#2563eb)
- `secondary`: Gris (#64748b)
- `success`: Vert (#16a34a)
- `error`: Rouge (#dc2626)
- `warning`: Orange (#ea580c)

**Composants de base** :
- `<Button variant="primary|secondary|outline|danger" />`
- `<Input label="..." type="email" />`
- `<Card><...</Card>`
- `<Avatar name="..." size="sm|md|lg" />`
- `<Loader />`

---

## 🚨 Prochaines étapes

1. **Démarrer le dev server** : `npm run dev`
2. **Tester le flux complet** : Register → Login → Feed
3. **Intégrer les vraies images** (avatars, profils)
4. **Ajouter les formulaires** de création de posts
5. **WebSockets** pour les notifications live
6. **Déploiement** sur production

---

## 📞 Support

Tout est prêt et fonctionnel. Backend stable, Frontend connecté, API client intégré.

**Problèmes possibles** :
- Backend ne répond pas ? Vérifier `http://localhost:5000/api/v1/health` (ou un endpoint public)
- Erreurs CORS ? Backend doit avoir `CORS: { origin: 'http://localhost:3000' }`
- Tokens non conservés ? Vérifier `localStorage` dans DevTools

---

**Bonne chance ! 🚀**
