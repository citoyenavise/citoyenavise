# 📚 API DOCUMENTATION — Citoyenavise Backend

**Version** : 1.0.0  
**Date** : 2026-05-07  
**Status** : Production Ready  
**Base URL** : `https://api.citoyenavise.org`  
**Protocol** : HTTPS/TLS 1.3  
**Endpoints** : 40 total  
**Auth** : JWT Bearer Token  

---

## Quick Start Guide

1. [Format de réponse](#format-de-réponse)
2. [Codes d'erreur](#codes-derreur)
3. [Authentification](#authentification)
4. [Endpoints par module](#endpoints-par-module)
5. [Exemples d'appels](#exemples-dappels)

---

## Format de réponse

### ✅ Succès (200, 201)

```json
{
  "success": true,
  "data": { /* contenu */ },
  "meta": {
    "version": "1.0",
    "timestamp": "2026-05-04T10:30:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 128,
      "pages": 7,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "error": null
}
```

### ❌ Erreur (4xx, 5xx)

```json
{
  "success": false,
  "data": null,
  "meta": {
    "version": "1.0",
    "timestamp": "2026-05-04T10:30:00.000Z"
  },
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email invalide",
    "details": { "field": "email" }
  }
}
```

---

## Codes d'erreur

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Données invalides (schéma Zod) |
| `BAD_REQUEST` | 400 | Requête malformée |
| `UNAUTHORIZED` | 401 | Token manquant ou expiré |
| `FORBIDDEN` | 403 | Accès refusé (permissions) |
| `NOT_FOUND` | 404 | Ressource non trouvée |
| `CONFLICT` | 409 | Email/username déjà existant |
| `SERVER_ERROR` | 500 | Erreur serveur |
| `DATABASE_ERROR` | 500 | Erreur base de données |

---

## Authentification

### JWT (Bearer Token)

Tous les endpoints protégés requièrent un header :

```
Authorization: Bearer <accessToken>
```

### Tokens

- **accessToken** : 24h (JWT)
- **refreshToken** : 7j (JWT)
- Stockage recommandé : **localStorage** ou **cookies HTTP-only**

---

## Endpoints par module

### 🔐 AUTH (`/api/v1/auth`)

#### `POST /register` (Public)
Créer un compte

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "username"
}
```

**Règles:**
- Email : format valide, unique
- Password : min 8 chars, 1 majuscule
- Username : 3-50 chars, unique

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "role": "citizen",
      "isVerified": false
    },
    "profile": {
      "userId": "uuid",
      "bio": null,
      "avatarUrl": null
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

#### `POST /login` (Public)
Connexion

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** Même structure que register (sans profile)

---

#### `POST /refresh` (Public)
Renouveler le token d'accès

**Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

#### `POST /logout` (Protected)
Déconnexion

**Response:**
```json
{
  "success": true,
  "data": { "loggedOut": true }
}
```

---

#### `GET /me` (Protected)
Utilisateur courant

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "role": "citizen",
    "isVerified": false,
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

---

### 👥 USERS (`/api/v1/users`)

#### `GET /:id` (Public)
Récupérer un utilisateur

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "username",
    "email": "user@example.com",
    "role": "citizen",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

---

#### `PUT /:id` (Protected)
Mettre à jour l'utilisateur

**Body:**
```json
{
  "email": "newemail@example.com",
  "username": "newusername"
}
```

---

#### `DELETE /:id` (Protected)
Supprimer le compte (soft delete)

---

### 👤 PROFILES (`/api/v1/profiles`)

#### `GET /` (Public)
Lister les profils

**Query:**
```
?page=1&limit=20&sort=latest
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "username": "username",
      "bio": "Ma biographie",
      "avatarUrl": "https://...",
      "location": "Montréal",
      "postsCount": 5,
      "followersCount": 10,
      "followingCount": 20
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 128,
      "pages": 7
    }
  }
}
```

---

#### `GET /:id` (Public)
Récupérer un profil

---

#### `PUT /:id` (Protected)
Mettre à jour le profil

**Body:**
```json
{
  "bio": "Ma nouvelle biographie",
  "location": "Montréal",
  "avatarUrl": "https://..."
}
```

---

#### `GET /:id/posts` (Public)
Posts de l'utilisateur

**Query:**
```
?page=1&limit=10&sort=latest
```

---

#### `GET /:id/followers` (Public)
Lister les followers

---

#### `POST /:id/follow` (Protected)
Suivre un profil

---

#### `DELETE /:id/follow` (Protected)
Arrêter de suivre

---

### 📝 POSTS (`/api/v1/posts`)

#### `GET /` (Public)
Lister les posts (feed)

**Query:**
```
?page=1&limit=20&sort=latest&category=gouvernement&type=idea
```

**Types** : `idea`, `proposal`, `question`, `discussion`  
**Categories** : `élections`, `gouvernement`, `droits`, `services`, `santé`, `éducation`, `environnement`, `économie`, `autres`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "Améliorer les transports publics",
      "content": "Proposition détaillée...",
      "type": "proposal",
      "category": "gouvernement",
      "likesCount": 42,
      "commentsCount": 8,
      "viewsCount": 150,
      "isPinned": false,
      "author": {
        "id": "uuid",
        "username": "username",
        "avatarUrl": "https://..."
      },
      "createdAt": "2026-04-28T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 256
    }
  }
}
```

---

#### `POST /` (Protected)
Créer un post

**Body:**
```json
{
  "title": "Améliorer les transports publics",
  "content": "Proposition détaillée avec arguments...",
  "type": "proposal",
  "category": "gouvernement"
}
```

**Response:** Code 201

---

#### `GET /:id` (Public)
Récupérer un post

---

#### `PUT /:id` (Protected)
Mettre à jour un post

---

#### `DELETE /:id` (Protected)
Supprimer un post (soft delete)

---

#### `POST /:id/flag` (Protected)
Signaler un post abusif

**Body:**
```json
{
  "reason": "spam|inappropriate|misinformation"
}
```

---

### ❤️ LIKES (`/api/v1/likes`)

#### `POST /posts/:postId/like` (Protected)
Liker un post

**Response:**
```json
{
  "success": true,
  "data": {
    "postId": "uuid",
    "userId": "uuid",
    "liked": true
  }
}
```

---

#### `DELETE /posts/:postId/like` (Protected)
Retirer un like

**Response:** 204 No Content

---

#### `GET /posts/:postId/likes` (Public)
Lister les likes d'un post

**Query:**
```
?limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "username",
      "avatarUrl": "https://...",
      "createdAt": "2026-04-28T10:00:00Z"
    }
  ]
}
```

---

#### `GET /posts/:postId/likes/check` (Protected)
Vérifier si utilisateur a aimé

**Response:**
```json
{
  "success": true,
  "data": {
    "isLiked": true
  }
}
```

---

### 💬 COMMENTS (`/api/v1/comments`)

#### `POST /posts/:postId/comments` (Protected)
Créer un commentaire

**Body:**
```json
{
  "content": "Excellent point de vue!"
}
```

**Response:** Code 201

---

#### `GET /posts/:postId/comments` (Public)
Lister les commentaires

**Query:**
```
?page=1&limit=20&sort=newest
```

---

#### `GET /comments/:commentId` (Public)
Récupérer un commentaire

---

#### `PUT /comments/:commentId` (Protected)
Mettre à jour

**Body:**
```json
{
  "content": "Contenu modifié"
}
```

---

#### `DELETE /comments/:commentId` (Protected)
Supprimer

---

### 💡 IDEAS (`/api/v1/ideas`)

#### `GET /` (Public)
Lister les idées

**Query:**
```
?page=1&limit=20&sort=latest&category=environnement
```

---

#### `POST /` (Protected)
Créer une idée

**Body:**
```json
{
  "title": "Réduire les émissions carbone",
  "content": "Plan d'action détaillé...",
  "category": "environnement"
}
```

---

#### `GET /popular` (Public)
Idées les plus populaires

**Query:**
```
?page=1&limit=10
```

---

#### `GET /:id` (Public)
Récupérer une idée

---

#### `PUT /:id` (Protected)
Mettre à jour

---

#### `DELETE /:id` (Protected)
Supprimer

---

#### `POST /:id/like` (Protected)
Liker une idée

---

#### `DELETE /:id/like` (Protected)
Retirer le like

---

### 🌟 POPULAR (`/api/v1/popular`)

#### `GET /` (Public)
Posts populaires avec scoring temporel

**Query:**
```
?range=daily&page=1&limit=10&sort=score
```

**Parameters:**
- `range` : `daily` | `weekly` | `monthly` | `all` (défaut: `daily`)
- `sort` : `score` | `likes` | `comments` (défaut: `score`)
- `page` : numéro de page
- `limit` : items par page (max 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "Post populaire",
      "content": "...",
      "type": "idea",
      "category": "gouvernement",
      "likesCount": 150,
      "commentsCount": 35,
      "viewsCount": 1200,
      "score": 287.5,
      "createdAt": "2026-04-28T10:00:00Z",
      "author": {
        "id": "uuid",
        "username": "username",
        "avatarUrl": "https://..."
      }
    }
  ]
}
```

**Scoring:**
```
score = (likes × 2 + comments × 1.5) × timePenalty
timePenalty = max(0.2, 1 - ageHours / 240)
```

---

### 🔍 SEARCH (`/api/v1/search`)

#### `GET /` (Public)
Recherche globale

**Query:**
```
?q=transport&type=all&sort=relevance&page=1&limit=20
```

**Types** : `posts` | `users` | `all` (défaut: `all`)  
**Sort** : `relevance` | `recent` | `popular` (défaut: `relevance`)

---

#### `GET /posts` (Public)
Rechercher posts uniquement

**Query:**
```
?q=transport&category=gouvernement&sort=relevance
```

---

#### `GET /users` (Public)
Rechercher utilisateurs

**Query:**
```
?q=john
```

---

### 🗺️ MAP (`/api/v1/map`)

#### `GET /nodes` (Public)
Récupérer tous les nœuds (GeoJSON)

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [-73.5673, 45.5017]
        },
        "properties": {
          "id": "uuid",
          "name": "Hôtel de Ville",
          "type": "location"
        }
      }
    ]
  }
}
```

---

#### `POST /nodes` (Admin only)
Créer un nœud

**Body:**
```json
{
  "name": "Lieu d'intérêt",
  "type": "location",
  "lat": 45.5017,
  "lng": -73.5673,
  "description": "Description"
}
```

---

#### `PUT /nodes/:id` (Admin only)
Mettre à jour un nœud

---

#### `DELETE /nodes/:id` (Admin only)
Supprimer un nœud

---

## Exemples d'appels

### JavaScript (Fetch)

```javascript
// Enregistrement
const registerResponse = await fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123',
    username: 'username'
  })
});

const { data } = await registerResponse.json();
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);

// Appel protégé
const postsResponse = await fetch('http://localhost:5000/api/v1/posts', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

const posts = await postsResponse.json();
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1'
});

// Interceptor pour ajouter le token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor pour refresh token
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await api.post('/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', data.data.accessToken);
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);

// Utilisation
const { data } = await api.get('/posts');
```

### React (Hook personnalisé)

```javascript
// useApi.js
import { useState, useEffect } from 'react';

export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
          `http://localhost:5000/api/v1${endpoint}`,
          {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
              ...options.headers
            }
          }
        );

        if (!response.ok) throw new Error('API Error');
        
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}

// Utilisation
function PostsList() {
  const { data: posts, loading, error } = useApi('/posts?page=1&limit=20');

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <ul>
      {posts?.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### cURL

```bash
# Enregistrement
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "username": "username"
  }'

# Lister les posts avec token
curl -X GET http://localhost:5000/api/v1/posts \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 🔄 Flow d'authentification

```
1. Utilisateur clique "S'inscrire"
   ↓
2. POST /auth/register
   ↓
3. Recevoir { accessToken, refreshToken }
   ↓
4. Stocker dans localStorage
   ↓
5. Appels API : ajouter header Authorization: Bearer <accessToken>
   ↓
6. Token expire → recevoir 401
   ↓
7. POST /auth/refresh avec refreshToken
   ↓
8. Recevoir nouveau accessToken
   ↓
9. Retry requête originale
```

---

## 📌 Points clés

- **Tous les endpoints retournent** le format standard (success/data/meta/error)
- **Pagination** : `page` (défaut 1), `limit` (max 50 sauf spécifié)
- **Tri** : `sort` paramètre (défaut varies par endpoint)
- **Auth** : Bearer token dans header `Authorization`
- **CORS** : activé sur `http://localhost:3000` (dev)
- **Rate limiting** : 100 req/15min par IP (global)
- **Documentation interactive** : `/api/docs` (Swagger)

---

**Dernière mise à jour** : 2026-05-04  
**Contacter** : infocitoyenavise@gmail.com
