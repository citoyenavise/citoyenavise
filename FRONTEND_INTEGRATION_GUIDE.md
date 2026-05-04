# 🔌 Guide d'intégration Frontend - Citoyen Avisé

Utiliser l'API Citoyen Avisé dans votre frontend (React, Vue, etc.)

---

## Installation et Configuration

### 1️⃣ Copier le client API

Copier `API_CLIENT.js` dans votre projet frontend :

```
src/
├── api/
│   └── client.js          ← Copier API_CLIENT.js ici
├── hooks/
│   └── useApi.js          ← Hook personnalisé (optionnel)
└── App.jsx
```

### 2️⃣ Variables d'environnement

Créer `.env` :

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
# En production:
# REACT_APP_API_URL=https://api.citoyenavise.org/api/v1
```

### 3️⃣ Initialiser dans votre app

```javascript
// App.jsx
import { api } from './api/client'

// Vérifier l'authentification au démarrage
useEffect(() => {
  if (api.auth.isAuthenticated()) {
    // Charger l'utilisateur courant
    api.auth.me()
      .then(user => setCurrentUser(user))
      .catch(() => api.auth.logout_local())
  }
}, [])
```

---

## Exemples d'utilisation

### 🔐 Authentification

#### Enregistrement

```javascript
import { api } from './api/client'

async function handleRegister(email, password, username) {
  try {
    const user = await api.auth.register(email, password, username)
    console.log('Bienvenue!', user.username)
    // Rediriger vers /feed
  } catch (error) {
    console.error(error.code, error.message)
    // VALIDATION_ERROR, CONFLICT, etc.
  }
}
```

#### Connexion

```javascript
async function handleLogin(email, password) {
  try {
    const { user, accessToken } = await api.auth.login(email, password)
    console.log('Connecté en tant que', user.username)
    // Token stocké automatiquement dans localStorage
  } catch (error) {
    if (error.status === 401) {
      console.error('Email ou mot de passe incorrect')
    }
  }
}
```

#### Vérifier l'authentification

```javascript
if (api.auth.isAuthenticated()) {
  // Afficher bouton logout
} else {
  // Afficher bouton login/register
}
```

#### Déconnexion

```javascript
async function handleLogout() {
  await api.auth.logout()
  // Rediriger vers /login
}
```

---

### 📝 Posts

#### Lister les posts

```javascript
import { useState, useEffect } from 'react'
import { api } from './api/client'

export function PostList() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await api.posts.list({
          page,
          limit: 20,
          sort: 'latest',
          category: 'gouvernement'
        })
        setPosts(data)
      } catch (error) {
        console.error('Erreur:', error.message)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [page])

  if (loading) return <div>Chargement...</div>

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      <Pagination 
        page={page}
        onPageChange={setPage}
      />
    </div>
  )
}
```

#### Créer un post

```javascript
async function handleCreatePost(title, content, type, category) {
  try {
    const newPost = await api.posts.create({
      title,
      content,
      type,       // 'idea', 'proposal', 'question', 'discussion'
      category    // 'gouvernement', 'environnement', etc.
    })
    console.log('Post créé:', newPost.id)
    // Rafraîchir la liste
  } catch (error) {
    console.error(error.message)
  }
}
```

#### Récupérer un post

```javascript
async function loadPost(postId) {
  const post = await api.posts.get(postId)
  return post
}
```

#### Mettre à jour un post

```javascript
async function handleUpdatePost(postId, changes) {
  const updated = await api.posts.update(postId, {
    title: changes.title,
    content: changes.content
  })
  return updated
}
```

#### Supprimer un post

```javascript
async function handleDeletePost(postId) {
  await api.posts.delete(postId)
  // Rediriger ou rafraîchir la liste
}
```

---

### ❤️ Likes

#### Liker un post

```javascript
async function handleLikePost(postId) {
  try {
    await api.likes.like(postId)
    setIsLiked(true)
    setLikeCount(count => count + 1)
  } catch (error) {
    if (error.status === 401) {
      // Rediriger vers login
    }
  }
}
```

#### Retirer un like

```javascript
async function handleUnlikePost(postId) {
  await api.likes.unlike(postId)
  setIsLiked(false)
  setLikeCount(count => Math.max(0, count - 1))
}
```

#### Vérifier si l'utilisateur a aimé

```javascript
useEffect(() => {
  const checkLike = async () => {
    const isLiked = await api.likes.check(postId)
    setIsLiked(isLiked)
  }
  
  if (api.auth.isAuthenticated()) {
    checkLike()
  }
}, [postId])
```

---

### 💬 Commentaires

#### Lister les commentaires

```javascript
async function loadComments(postId) {
  const comments = await api.comments.getByPost(postId, {
    page: 1,
    limit: 20,
    sort: 'newest'
  })
  return comments
}
```

#### Créer un commentaire

```javascript
async function handleAddComment(postId, content) {
  const newComment = await api.comments.create(postId, content)
  return newComment
}
```

#### Mettre à jour un commentaire

```javascript
async function handleEditComment(commentId, newContent) {
  const updated = await api.comments.update(commentId, newContent)
  return updated
}
```

#### Supprimer un commentaire

```javascript
async function handleDeleteComment(commentId) {
  await api.comments.delete(commentId)
}
```

---

### 👤 Profils

#### Récupérer un profil

```javascript
async function loadProfile(userId) {
  const profile = await api.profiles.get(userId)
  return profile
}
```

#### Mettre à jour son profil

```javascript
async function handleUpdateProfile(userId, changes) {
  const updated = await api.profiles.update(userId, {
    bio: changes.bio,
    location: changes.location,
    avatarUrl: changes.avatarUrl
  })
  return updated
}
```

#### Lister les posts d'un utilisateur

```javascript
async function loadUserPosts(userId) {
  const posts = await api.profiles.getPosts(userId, {
    page: 1,
    limit: 10
  })
  return posts
}
```

#### Suivre un utilisateur

```javascript
async function handleFollowUser(userId) {
  await api.profiles.follow(userId)
  setIsFollowing(true)
  setFollowerCount(count => count + 1)
}
```

#### Arrêter de suivre

```javascript
async function handleUnfollowUser(userId) {
  await api.profiles.unfollow(userId)
  setIsFollowing(false)
  setFollowerCount(count => Math.max(0, count - 1))
}
```

---

### 🌟 Popular

#### Posts populaires

```javascript
async function loadPopularPosts() {
  const posts = await api.popular.list({
    range: 'daily',    // 'daily', 'weekly', 'monthly', 'all'
    sort: 'score',     // 'score', 'likes', 'comments'
    page: 1,
    limit: 10
  })
  return posts
}
```

---

### 🔍 Recherche

#### Recherche globale

```javascript
async function handleSearch(query) {
  const results = await api.search.all(query, {
    type: 'all',       // 'all', 'posts', 'users'
    sort: 'relevance', // 'relevance', 'recent', 'popular'
    page: 1,
    limit: 20
  })
  return results
}
```

#### Rechercher des posts

```javascript
async function searchPosts(query) {
  const posts = await api.search.posts(query, {
    category: 'gouvernement',
    sort: 'relevance'
  })
  return posts
}
```

#### Rechercher des utilisateurs

```javascript
async function searchUsers(query) {
  const users = await api.search.users(query)
  return users
}
```

---

## Hooks React personnalisés

### useApi.js

```javascript
import { useState, useEffect } from 'react'
import { api } from './api/client'

/**
 * Hook pour appeler l'API automatiquement au montage
 */
export function useApi(fetcher, dependencies = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const result = await fetcher()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, dependencies)

  return { data, loading, error }
}

// Utilisation:
const { data: posts, loading, error } = useApi(
  () => api.posts.list({ page: 1, limit: 20 }),
  [page]
)
```

### useAuth.js

```javascript
import { useState, useEffect } from 'react'
import { api } from './api/client'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (api.auth.isAuthenticated()) {
          const currentUser = await api.auth.me()
          setUser(currentUser)
        }
      } catch (error) {
        api.auth.logout_local()
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  return { user, loading, isAuthenticated: !!user }
}
```

### usePost.js

```javascript
import { useState } from 'react'
import { api } from './api/client'

export function usePost(postId) {
  const [post, setPost] = useState(null)
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const postData = await api.posts.get(postId)
        setPost(postData)
        setLikes(postData.likesCount)

        if (api.auth.isAuthenticated()) {
          const liked = await api.likes.check(postId)
          setIsLiked(liked)
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [postId])

  const handleLike = async () => {
    if (isLiked) {
      await api.likes.unlike(postId)
      setLikes(l => l - 1)
      setIsLiked(false)
    } else {
      await api.likes.like(postId)
      setLikes(l => l + 1)
      setIsLiked(true)
    }
  }

  return { post, likes, isLiked, loading, handleLike }
}
```

---

## Gestion des erreurs

### Erreurs courantes

```javascript
async function apiCall() {
  try {
    const result = await api.posts.list()
  } catch (error) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        // Afficher les détails de validation
        console.error(error.details)
        break
      case 'UNAUTHORIZED':
        // Token expiré, rediriger vers login
        window.location.href = '/login'
        break
      case 'FORBIDDEN':
        // Accès refusé (permissions)
        alert('Vous n\'avez pas accès à cette ressource')
        break
      case 'NOT_FOUND':
        // Ressource n'existe pas
        alert('Cette ressource n\'existe pas')
        break
      case 'CONFLICT':
        // Email/username déjà existant
        console.error('Cet email est déjà utilisé')
        break
      default:
        console.error('Erreur:', error.message)
    }
  }
}
```

---

## Pagination

### Composant réutilisable

```javascript
export function Pagination({ page, total, limit, onPageChange }) {
  const pages = Math.ceil(total / limit)
  
  return (
    <div className="pagination">
      <button 
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Précédent
      </button>

      <span>{page} / {pages}</span>

      <button
        disabled={page === pages}
        onClick={() => onPageChange(page + 1)}
      >
        Suivant →
      </button>
    </div>
  )
}
```

### Utilisation

```javascript
const { data, loading } = useApi(
  () => api.posts.list({ page, limit: 20 }),
  [page]
)

return (
  <>
    <PostList posts={data} />
    <Pagination 
      page={page}
      total={data?.length || 0}
      limit={20}
      onPageChange={setPage}
    />
  </>
)
```

---

## Conseils de sécurité

### ✅ À faire

```javascript
// ✅ Stocker dans localStorage ou cookies HTTP-only
// Le client API le fait automatiquement

// ✅ Vérifier l'authentification avant afficher des boutons
{api.auth.isAuthenticated() && <button>Créer post</button>}

// ✅ Gérer les erreurs 401 (token expiré)
// Le client API le fait automatiquement avec refresh

// ✅ Valider les données côté client AVANT l'appel API
const { error } = emailSchema.safeParse(email)
if (error) return // Afficher erreur

// ✅ Ne pas exposer les erreurs sensibles
console.log(error.message) // OK
console.log(error.stack)   // ❌ NON
```

### ❌ À éviter

```javascript
// ❌ Stocker le token dans une variable globale
window.token = token // Vulnérable à XSS

// ❌ Afficher les erreurs techniques
alert(error.stack) // Expose l'architecture

// ❌ Faire confiance aux données du client
// Toujours valider côté serveur

// ❌ Utiliser des mots de passe faibles en dev
// Même en dev, utiliser des secrets
```

---

## Configuration avancée

### Proxy API en développement

Si le frontend est sur `http://localhost:3000` et l'API sur `http://localhost:5000`, créer `setupProxy.js` :

```javascript
// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  )
}
```

Puis utiliser `REACT_APP_API_URL=/api/v1` dans `.env`.

### Intercepteurs personnalisés

```javascript
// Ajouter logging
const originalRequest = client.request

client.request = async (endpoint, options) => {
  console.log(`[API] ${options.method || 'GET'} ${endpoint}`)
  const start = performance.now()
  
  try {
    const response = await originalRequest(endpoint, options)
    const duration = performance.now() - start
    console.log(`[API] ✅ ${duration.toFixed(0)}ms`)
    return response
  } catch (error) {
    console.log(`[API] ❌ ${error.code}`)
    throw error
  }
}
```

---

## Troubleshooting

### "401 Unauthorized"

```javascript
// Vérifier que le token est stocké
console.log(api.getAuthToken()) // doit retourner un token

// Vérifier qu'il n'est pas expiré
const decoded = jwt_decode(token)
console.log(decoded.exp) // timestamp expiration

// Forcer un refresh
await api.auth.refresh(api.tokenManager.getRefreshToken())
```

### "CORS error"

Assurez-vous que:
1. `REACT_APP_API_URL` est correct
2. Le backend a CORS activé
3. Le header `Authorization` est autorisé

### "Token manquant"

```javascript
// Vérifier l'authentification
if (!api.auth.isAuthenticated()) {
  // Rediriger vers /login
}
```

---

## Documentation officielle

- **API Docs** : http://localhost:5000/api/docs
- **GitHub** : https://github.com/citoyenavise/backend
- **Support** : infocitoyenavise@gmail.com

---

**Version** : 1.0  
**Dernière mise à jour** : 2026-05-04
