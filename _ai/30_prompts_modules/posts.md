---
name: Prompt — Module Posts & Idées
description: Guide pour implémenter création/affichage/modération de posts
type: reference
---

# Module 3 : Posts & Idées

**Utilise ce prompt quand tu travailles sur création de contenus civiques, feeds, modération**

## 🎯 Vue d'ensemble
- **Responsabilité** : Posts/idées citoyens, filtres, modération basique
- **Tables** : `posts`, `likes`
- **API** : /posts CRUD, /posts/:id/like, /posts?filters
- **Types** : idea, proposal, question, discussion
- **Catégories** : élections, droits, gouvernement, environnement, etc.

## 📚 Fichiers de référence
- _ai/02_architecture_modules.md — Module 3
- database/schema.sql — Tables posts/likes
- _ai/01_contraintes_generales.md — Backend API, Conventions

## 🏗️ Checklist d'implémentation

### Backend Routes
```javascript
// backend/src/routes/posts.js
GET    /api/v1/posts                    → Feed (filtrable, pagé)
POST   /api/v1/posts                    → Créer (auth required)
GET    /api/v1/posts/:id                → Détail post
PUT    /api/v1/posts/:id                → Éditer (owner only)
DELETE /api/v1/posts/:id                → Soft delete (owner or admin)
POST   /api/v1/posts/:id/flag           → Signaler abusif (auth required)
GET    /api/v1/posts/:id/likes          → Qui a aimé (futur)

// Filtres supportés
?category=élections&sort=latest&limit=20&page=1
?type=idea&status=published
?user_id=uuid
?search=mot
```

### Services
```javascript
// postService.js
- createPost(userId, { title, content, type, category }) → post
- getPostById(id) → post avec likes_count
- updatePost(id, data, userId) → vérifie ownership, met à jour
- deletePost(id, userId) → soft delete si owner
- listPosts({ category, type, sort, limit, page, userId }) → paginated posts
- flagPost(postId, reason, userId) → mark as flagged
- getPostsByUser(userId) → posts d'un citoyen
- incrementLikesCount(postId) → dénormalization
```

### Models
```javascript
// POST object
{
  id: "uuid",
  user_id: "uuid",
  title: "Titre du post",
  content: "Contenu HTML ou markdown",
  type: "idea|proposal|question|discussion",
  category: "élections",
  status: "published|flagged|archived|draft",
  likes_count: 42,
  views_count: 150,
  is_pinned: false,
  creator: {
    id: "uuid",
    username: "jean_db",
    avatar_url: "...",
    location: "Montréal, QC"
  },
  created_at: "2026-05-02T10:30:00Z",
  updated_at: "2026-05-02T10:30:00Z"
}
```

### Validation Input
```javascript
const createPostSchema = z.object({
  title: z.string().min(5).max(255),
  content: z.string().min(20).max(5000),
  type: z.enum(['idea', 'proposal', 'question', 'discussion']),
  category: z.enum(['élections', 'droits', 'gouvernement', 'environnement', ...]),
});

const listPostsSchema = z.object({
  category: z.string().optional(),
  type: z.enum([...]).optional(),
  sort: z.enum(['latest', 'popular', 'trending']).default('latest'),
  limit: z.number().min(1).max(100).default(20),
  page: z.number().min(1).default(1),
});
```

### Tests
```javascript
describe('Posts Routes', () => {
  test('GET /api/v1/posts : récupérer feed', async () => {
    // Paginated
    // Filtrable par category, type, sort
    // Inclure user (creator)
  });
  
  test('POST /api/v1/posts : créer post', async () => {
    // Auth required
    // Validation schema
    // Créer post avec status=published
    // Retourner 201 + post
  });
  
  test('PUT /api/v1/posts/:id : éditer', async () => {
    // Owner only
    // Mettre à jour updated_at
    // Soft delete si status=archived
  });
  
  test('DELETE /api/v1/posts/:id : supprimer', async () => {
    // Owner or admin
    // Soft delete (SET deleted_at = NOW())
  });
  
  test('POST /api/v1/posts/:id/flag : signaler', async () => {
    // Auth required
    // Marquer post comme flagged
    // Admin pourra voir les flagged posts
  });
});
```

### DB Query (exemple)
```sql
-- Récupérer posts avec pagination
SELECT 
  p.id, p.title, p.content, p.type, p.category, p.likes_count,
  p.created_at,
  u.id as creator_id, u.username, 
  pr.avatar_url, pr.location
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN profiles pr ON u.id = pr.user_id
WHERE p.status = 'published' AND p.deleted_at IS NULL
  AND (p.category = $1 OR $1 IS NULL)
  AND (p.type = $2 OR $2 IS NULL)
ORDER BY 
  CASE WHEN $3 = 'popular' THEN p.likes_count ELSE p.created_at END DESC
LIMIT $4 OFFSET $5;
```

### Dénormalization (Performance)
```javascript
// ❌ MAUVAIS : Compter les likes à chaque requête
SELECT COUNT(*) FROM likes WHERE post_id = ?

// ✅ BON : Garder counter dans posts.likes_count
// Incrémenter sur chaque like
UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?
```

### Modération (Admin futur)
```javascript
// Admin peut voir les posts flagged
GET /api/v1/admin/posts?status=flagged

// Admin peut supprimer définitivement
DELETE /api/v1/admin/posts/:id?permanent=true

// Admin peut archiver
PATCH /api/v1/admin/posts/:id { status: 'archived' }
```

## 🧪 Exemple minimal

```javascript
// POST /api/v1/posts (Authorization: Bearer token)
{
  "title": "Besoin de transparence électorale",
  "content": "Proposons une plateforme centralisée pour les résultats électoraux...",
  "type": "proposal",
  "category": "élections"
}

// Response 201
{
  "id": "uuid-post",
  "user_id": "uuid-user",
  "title": "Besoin de transparence électorale",
  "type": "proposal",
  "category": "élections",
  "status": "published",
  "likes_count": 0,
  "views_count": 0,
  "creator": {
    "username": "jean_db",
    "avatar_url": null,
    "location": "Montréal, QC"
  },
  "created_at": "2026-05-02T10:30:00Z"
}

// GET /api/v1/posts?category=élections&sort=latest&limit=10
{
  "data": [ /* posts array */ ],
  "meta": {
    "total": 245,
    "page": 1,
    "limit": 10,
    "pages": 25
  }
}
```

## 📋 Livrable attendu
1. backend/src/routes/posts.js — Routes
2. backend/src/controllers/postsController.js — Logique HTTP
3. backend/src/services/postsService.js — Métier
4. backend/tests/posts.test.js — Tests Supertest
5. Migrations DB : posts table + indexes
6. Frontend : pages/posts/index.html, pages/posts/create.html, composants/PostCard.html
7. Mise à jour _ai/40_journal_sessions/
