# 🚀 INSTRUCTIONS FINALISATION - API STANDARDISATION

**Status** : Phase 1 & 2 complétées | Phase 3 à finaliser  
**Estimé** : 3-4 heures (1 développeur)  
**Priorité** : HAUTE (Blocage front-end)

---

## 📋 RÉSUMÉ TRAVAIL EFFECTUÉ

### ✅ Complétés

**Phase 1 - Middlewares** (1 heure)
- ✅ `errorHandler.js` - AppError amélioré avec codes d'erreur
- ✅ `responseFormatter.js` - Codes d'erreur ajoutés
- ✅ `validate.js` (NOUVEAU) - Validation Zod centralisée

**Phase 2a - Controllers (3 modules, 15 endpoints)**
- ✅ `auth/controller.js` - 5/5 endpoints
- ✅ `users/controller.js` - 3/3 endpoints
- ✅ `profiles/controller.js` - 7/7 endpoints

**Phase 3a - Tests Jest (1 module)**
- ✅ `auth/controller.test.js` - 23 tests exhaustifs

### ⏳ Restants

**Phase 2b - Controllers (8 modules, 31 endpoints)**
- posts (9)
- likes (4)
- comments (5)
- ideas (7)
- search (3)
- map (4)
- popular_system (1)
- notifications (3)

**Phase 3b - Tests Jest (10 modules, ~250 tests)**
- Générer tests pour chaque module

---

## 📂 FICHIERS DE RÉFÉRENCE

### Pour corriger les controllers

**Lire d'abord** :
1. [CORRECTIONS_CONTROLLERS_BATCH.md](CORRECTIONS_CONTROLLERS_BATCH.md) - Templates prêts à copier
2. [AUDIT_API_EXHAUSTIF.md](AUDIT_API_EXHAUSTIF.md) - Détails des problèmes

**Pattern de correction** (voir auth/controller.js complété) :

```javascript
// 1. Valider avec safeParse()
const validated = schema.safeParse(req.body);
if (!validated.success) {
  throw new AppError('VALIDATION_ERROR', 400, 'Validation failed', validated.error.issues);
}

// 2. Appeler le service
const result = await service.method(validated.data);

// 3. Retourner avec helper approprié
res.apiCreated(result);     // POST create → 201
res.apiSuccess(result);     // GET/POST → 200
res.apiUpdated(result);     // PUT → 200
res.apiDeleted(id);         // DELETE → 200 (pas 204)
res.apiPaginated(items, total, page, limit); // List → pagination
```

---

## 🔧 ÉTAPES DE FINALISATION

### Étape 1 : Corriger posts/controller.js (1 heure)

1. Ouvrir `backend/src/modules/posts/controller.js`
2. Copier le template de `CORRECTIONS_CONTROLLERS_BATCH.md` sous la section "posts"
3. Valider syntaxe : `node -c backend/src/modules/posts/controller.js`
4. Tester manuellement un endpoint

**Endpoints à corriger** :
- listPosts → `apiPaginated()`
- getPost → `apiSuccess()`
- createPost → `apiCreated()`
- updatePost → `apiUpdated()`
- deletePost → `apiDeleted()`
- flagPost → `apiSuccess()`

### Étape 2 : Corriger likes/controller.js (30 min)

[Même pattern qu'étape 1]

**Endpoints à corriger** :
- likePost → `apiCreated()`
- unlikePost → `apiSuccess()`
- getPostLikes → `apiPaginated()`
- checkLike → `apiSuccess()`

### Étape 3 : Corriger comments/controller.js (30 min)

[Même pattern]

**Endpoints à corriger** :
- createComment → `apiCreated()`
- getCommentsByPost → `apiPaginated()`
- getComment → `apiSuccess()`
- updateComment → `apiUpdated()`
- deleteComment → `apiDeleted()`

### Étape 4 : Corriger ideas/controller.js (45 min)

[Même pattern]

**Endpoints à corriger** :
- listIdeas → `apiPaginated()`
- getIdea → `apiSuccess()`
- createIdea → `apiCreated()`
- updateIdea → `apiUpdated()`
- deleteIdea → `apiDeleted()`
- likeIdea → `apiCreated()`
- unlikeIdea → `apiSuccess()`

### Étape 5 : Corriger search/controller.js (30 min)

[Même pattern]

**Endpoints à corriger** :
- search → `apiPaginated()`
- searchPostsOnly → `apiPaginated()`
- searchUsersOnly → `apiPaginated()`

### Étape 6 : Corriger map/controller.js (30 min)

[Même pattern]

**Endpoints à corriger** :
- getNodes → `apiSuccess()`
- createNode → `apiCreated()`
- updateNode → `apiUpdated()`
- deleteNode → `apiDeleted()`

### Étape 7 : Corriger popular_system/controller.js (15 min)

[Même pattern]

**Endpoints à corriger** :
- getPopular → `apiPaginated()`

### Étape 8 : Corriger notifications/controller.js (30 min)

[Même pattern]

**Endpoints à corriger** :
- list → `apiPaginated()`
- markAsRead → `apiSuccess()`
- markAllAsRead → `apiSuccess()`

---

## 🧪 GÉNÉRER TESTS JEST

**Template de test** (voir auth/controller.test.js) :

```javascript
describe('MODULE', () => {
  describe('POST /endpoint', () => {
    test('✅ 201 Success case', async () => {
      const res = await request(app)
        .post('/api/v1/...')
        .send({ /* data */ });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.error).toBeNull();
    });

    test('❌ 400 Validation error', async () => {
      const res = await request(app)
        .post('/api/v1/...')
        .send({ /* invalid data */ });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

**Pour chaque module** :
1. Copier le template de `auth/controller.test.js`
2. Adapter le module name et endpoints
3. Ajouter tests pour chaque cas (succès, validation, erreurs)
4. Lancer : `npm test -- auth/controller.test.js`

**Estimation** : 30-45 min par module × 10 modules = 5-7 heures

---

## ✅ VALIDATION FINALE

Une fois les corrections appliquées :

### 1. Syntaxe
```bash
# Valider chaque controller
for module in posts likes comments ideas search map popular_system notifications
do
  node -c backend/src/modules/$module/controller.js
  echo "✅ $module OK"
done
```

### 2. Tests
```bash
# Lancer tous les tests Jest
npm test

# Ou test spécifique
npm test -- auth/controller.test.js
```

### 3. Format de réponse
- ✅ Tous les endpoints retournent `{ success, data, meta, error }`
- ✅ Tous les erreurs ont un `code`
- ✅ Toutes les listes utilisent `apiPaginated()`
- ✅ Aucun `res.status(204).send()` (tous les DELETE retournent JSON)

### 4. Codes d'erreur
- ✅ VALIDATION_ERROR (400)
- ✅ UNAUTHORIZED (401)
- ✅ FORBIDDEN (403)
- ✅ NOT_FOUND (404)
- ✅ INVALID_CREDENTIALS (401)
- ✅ TOKEN_EXPIRED (401)
- ✅ CONFLICT (409)
- ✅ SERVER_ERROR (500)

---

## 📊 CHECKLIST FINALISATION

### Controllers
- [ ] posts/controller.js - 9 endpoints
- [ ] likes/controller.js - 4 endpoints
- [ ] comments/controller.js - 5 endpoints
- [ ] ideas/controller.js - 7 endpoints
- [ ] search/controller.js - 3 endpoints
- [ ] map/controller.js - 4 endpoints
- [ ] popular_system/controller.js - 1 endpoint
- [ ] notifications/controller.js - 3 endpoints

### Tests
- [ ] posts/controller.test.js
- [ ] likes/controller.test.js
- [ ] comments/controller.test.js
- [ ] ideas/controller.test.js
- [ ] search/controller.test.js
- [ ] map/controller.test.js
- [ ] popular_system/controller.test.js
- [ ] notifications/controller.test.js
- [ ] profiles/controller.test.js
- [ ] users/controller.test.js

### Validation
- [ ] Tous les tests Jest passent
- [ ] Aucune erreur de syntaxe
- [ ] Format réponse unifié (46/46)
- [ ] Codes d'erreur standardisés (46/46)
- [ ] Pagination cohérente (46/46)
- [ ] Documentation à jour
- [ ] Frontend peut intégrer sans problème

---

## 🧑‍💻 COMMANDES UTILES

```bash
# Corriger un controller
cd backend
vi src/modules/posts/controller.js
node -c src/modules/posts/controller.js

# Générer un test
vi src/modules/posts/controller.test.js

# Lancer les tests
npm test
npm test -- posts/controller.test.js

# Committes les changes
git add -A
git commit -m "feat: Standardize posts and likes endpoints"

# Vérifier le format global
npm test 2>&1 | grep -E "PASS|FAIL|passing|failing"
```

---

## 📞 EN CAS DE PROBLÈME

### Erreur de validation
```javascript
// ❌ AVANT
if (!validation.success) {
  throw new AppError('Validation échouée', 400);
}

// ✅ APRÈS
if (!validation.success) {
  throw new AppError(
    'VALIDATION_ERROR',
    400,
    'Validation failed',
    validation.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
  );
}
```

### Erreur de réponse
```javascript
// ❌ AVANT
res.status(201).json(post);

// ✅ APRÈS
res.apiCreated(post);
```

### Erreur de pagination
```javascript
// ❌ AVANT
res.json(result);

// ✅ APRÈS
const { data, total, page, limit } = result;
res.apiPaginated(data, total, page, limit);
```

---

## 🎯 GOAL

**Une fois finalisé** :

✅ 46/46 endpoints standardisés  
✅ 300+ tests Jest passent  
✅ 100% format réponse unifié  
✅ 100% codes d'erreur standardisés  
✅ Frontend peut intégrer rapidement  
✅ API réellement prête production  

---

**Temps estimé** : 3-4 heures  
**Difficulté** : Basse (template fourni)  
**Impact** : CRITIQUE (Débloque front-end)

Bonne chance ! 🚀
