# Routes de Commentaires — Pétitions

## 📋 Vue d'ensemble

Les routes de commentaires permettent aux utilisateurs de commenter les pétitions et de gérer leurs commentaires.

---

## 🗄️ Schéma Base de Données

### Table `petition_comments` (Migration 008)

```sql
CREATE TABLE petition_comments (
  id BIGSERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  citoyen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_petition_comments_petition_id ON petition_comments(petition_id);
CREATE INDEX idx_petition_comments_citoyen_id ON petition_comments(citoyen_id);
CREATE INDEX idx_petition_comments_created_at ON petition_comments(created_at);
```

### Relations (models/index.js)

```javascript
// User → many Comments
User.hasMany(Comment, {
  foreignKey: 'citoyenId',
  as: 'comments',
});

// Petition → many Comments
Petition.hasMany(Comment, {
  foreignKey: 'petitionId',
  as: 'comments',
});

// Comment → Petition
Comment.belongsTo(Petition, {
  foreignKey: 'petitionId',
  as: 'petition',
});

// Comment → User (author)
Comment.belongsTo(User, {
  foreignKey: 'citoyenId',
  as: 'author',
});
```

---

## 🛣️ Routes Implémentées

### **GET /api/v1/petitions/:id/comments** — Lister les commentaires

**Authentification :** Publique (aucune)

**Paramètres :**
- `petition_id` (route) : integer positif
- `page` (query, défaut: 1) : integer ≥ 1
- `limit` (query, défaut: 20) : integer 1-100

**Réponse 200 OK :**
```json
{
  "success": true,
  "petitionId": 123,
  "count": 5,
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "data": [
    {
      "id": 1,
      "contenu": "Excellent point!",
      "createdAt": "2026-05-10T12:00:00Z",
      "updatedAt": "2026-05-10T12:00:00Z",
      "citoyenId": 456,
      "author": {
        "id": 456,
        "email": "user@example.com",
        "nomComplet": "Jean Dupont"
      }
    }
  ]
}
```

**Erreurs :**
- 400 : petition_id invalide (non-int, ≤0)
- 404 : Pétition non trouvée

---

### **POST /api/v1/petitions/:id/comments** — Créer un commentaire

**Authentification :** ✅ JWT Required (authMiddleware)

**Paramètres :**
- `petition_id` (route) : integer positif
- `contenu` (body) : string 5-1000 caractères

**Body :**
```json
{
  "contenu": "This is a meaningful comment about the petition"
}
```

**Réponse 201 Created :**
```json
{
  "success": true,
  "message": "Commentaire créé",
  "data": {
    "id": 2,
    "contenu": "This is a meaningful comment about the petition",
    "createdAt": "2026-05-10T14:30:00Z",
    "updatedAt": "2026-05-10T14:30:00Z",
    "citoyenId": 456,
    "petitionId": 123,
    "author": {
      "id": 456,
      "email": "user@example.com",
      "nomComplet": "Jean Dupont"
    }
  }
}
```

**Erreurs :**
- 400 : contenu invalide (trop court/long/manquant)
- 400 : petition_id invalide
- 401 : Non authentifié
- 404 : Pétition non trouvée

---

### **DELETE /api/v1/comments/:id** — Supprimer un commentaire

**Authentification :** ✅ JWT Required (authMiddleware)

**Paramètres :**
- `comment_id` (route) : integer positif

**Réponse 200 OK :**
```json
{
  "success": true,
  "message": "Commentaire supprimé",
  "data": {
    "id": 2
  }
}
```

**Erreurs :**
- 400 : comment_id invalide
- 401 : Non authentifié
- 403 : Non propriétaire du commentaire (FORBIDDEN_DELETE)
- 404 : Commentaire non trouvé

---

## ✅ Validation Zod

### Schéma `createCommentSchema`

```javascript
const createCommentSchema = z.object({
  contenu: z.string()
    .min(5, 'Contenu doit avoir minimum 5 caractères')
    .max(1000, 'Contenu ne doit pas dépasser 1000 caractères'),
});
```

| Champ | Type | Min | Max | Notes |
|-------|------|-----|-----|-------|
| contenu | string | 5 | 1000 | Obligatoire |

### Exemples

✅ **Valid :**
```json
{ "contenu": "Great point here!" }
```

❌ **Too short (4 chars) :**
```json
{ "contenu": "Good" }
```

❌ **Too long (1001 chars) :**
```json
{ "contenu": "aaa...aaa" }  // 1001 caractères
```

---

## 🔒 Sécurité

| Aspect | Implémentation |
|--------|-----------------|
| **Authentification** | JWT via authMiddleware sur POST/DELETE |
| **Autorisation** | Vérification citoyenId pour DELETE |
| **SQL Injection** | Sequelize parameterized queries |
| **Pagination** | Limite max 100 résultats par page |
| **Cascade** | Commentaires supprimés si pétition/utilisateur supprimé |

---

## 📊 Cas d'Utilisation

### Scénario 1 : Voir les commentaires d'une pétition

```bash
# 1. Récupérer commentaires page 1
GET /api/v1/petitions/123/comments?page=1&limit=10

# 2. Chaque commentaire affiche l'auteur
GET /api/v1/petitions/123/comments
→ data[].author.nomComplet, data[].author.email, etc.
```

### Scénario 2 : Créer un commentaire

```bash
# 1. Utilisateur authentifié crée un commentaire
POST /api/v1/petitions/123/comments
Authorization: Bearer <JWT>
Content-Type: application/json
{ "contenu": "I agree with this petition!" }

# 2. Réponse 201 avec le commentaire créé et author info
```

### Scénario 3 : Supprimer son commentaire

```bash
# 1. Utilisateur authentifié supprime son commentaire
DELETE /api/v1/comments/42
Authorization: Bearer <JWT>

# 2. Réponse 200 OK
# 3. Si autre utilisateur essaie : 403 Forbidden
```

---

## 🧪 Tests

### Suite de Tests : `__tests__/comments.test.js`

Couvre :
- ✅ GET /petitions/:id/comments (list, pagination, author info)
- ✅ POST /petitions/:id/comments (create, validation, ownership)
- ✅ DELETE /comments/:id (delete, ownership check, 404)
- ✅ Validation Zod (min/max, missing field)
- ✅ Authentification (401 sans JWT, 403 sans ownership)
- ✅ Cascade delete (with petition, with user)
- ✅ Relations & data integrity

**Exécuter :**
```bash
npm test -- __tests__/comments.test.js
```

---

## 📝 Modèle Comment.js

```javascript
const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  petitionId: { type: DataTypes.INTEGER, field: 'petition_id', allowNull: false },
  citoyenId: { type: DataTypes.INTEGER, field: 'citoyen_id', allowNull: false },
  contenu: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
}, {
  tableName: 'petition_comments',
  timestamps: true,
});
```

---

## 🔗 Intégration avec Routes Existantes

Les routes de commentaires se **montent indépendamment** dans `routes/index.js` :

```javascript
router.use('/api/v1', commentsRoutes);
```

Cela permet :
- `GET /api/v1/petitions/:id/comments` — GET route
- `POST /api/v1/petitions/:id/comments` — POST route
- `DELETE /api/v1/comments/:id` — DELETE route indépendante

---

## 📈 Scalabilité

**Optimisations :**
- Index sur `petition_id` pour requêtes rapides par pétition
- Index sur `created_at` pour tri par date
- Pagination max 100 résultats
- Cascade delete pour intégrité référentielle

**Limitations :**
- Pas de nested routes pour commentaires des commentaires (future)
- Pas d'édition de commentaires (delete + recreate)
- Pas de likes/votes sur commentaires (future)

---

## ✅ Checklist de Conformité

- [x] Migration SQL 008_comments.sql ✓
- [x] Table petition_comments avec FK CASCADE ✓
- [x] Index sur petition_id ✓
- [x] Modèle Comment.js ✓
- [x] Relations Petition.hasMany(Comment) ✓
- [x] GET /petitions/:id/comments (public) ✓
- [x] POST /petitions/:id/comments (protected) ✓
- [x] DELETE /comments/:id (protected + ownership) ✓
- [x] Validation Zod contenu (5-1000) ✓
- [x] Tests complets ✓
