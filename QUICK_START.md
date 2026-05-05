# ⚡ Quick Start - Frontend React

## 3 commandes pour démarrer

### 1. Backend (Terminal 1)
```bash
cd backend
npm run dev
# ✅ API sur http://localhost:5000/api/v1
```

### 2. Frontend (Terminal 2)
```bash
cd frontend
npm run dev
# ✅ App sur http://localhost:3000
```

### 3. Dans le navigateur
```
http://localhost:3000
```

---

## 🎯 Test rapide

1. **Créer un compte** : Cliquer sur "S'inscrire"
2. **Connexion** : Email + Password
3. **Feed** : Voir les posts de l'API
4. **Détail** : Cliquer "Voir plus" sur un post
5. **Commentaires** : Ajouter un commentaire

---

## 📝 Architecture résumée

```
frontend/
├── src/
│   ├── api/client.js           ← API intégrée
│   ├── contexts/AuthContext    ← Auth state global
│   ├── components/ui/*         ← Boutons, inputs, etc.
│   ├── pages/*                 ← Login, Feed, PostDetail
│   └── App.jsx                 ← Routing
└── package.json                ← Dépendances
```

---

## 🔐 Auth Flow

```
Register/Login → Token stocké → API auto-refresh → Feed
```

- Tokens : `localStorage`
- Refresh : Auto (quand `401`)
- Logout : Efface tokens

---

## 📡 API usage

```javascript
import { api } from './api/client'

// Auth
await api.auth.login(email, password)
await api.auth.logout()

// Posts
const posts = await api.posts.list({ page: 1 })
const post = await api.posts.get(postId)

// Comments
const comments = await api.comments.getByPost(postId)
```

---

## 🎨 Composants

```jsx
<Button variant="primary" />
<Input label="Email" type="email" />
<Card>Contenu</Card>
<Avatar name="John" />
<Loader />
```

---

## 🚨 Si erreurs

| Erreur | Solution |
|--------|----------|
| `Cannot find module 'react'` | `npm install` |
| `localhost:5000 refused` | Backend doit tourner |
| `localStorage undefined` | Navigateur bug, F5 |
| `401 Unauthorized` | Token expiré, rélogin |

---

## 📦 Build production

```bash
npm run build
# → dossier `dist/` prêt à servir
```

---

**C'est tout ! 🚀 Bon développement !**
