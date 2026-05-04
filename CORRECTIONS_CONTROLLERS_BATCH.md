# 🔧 CORRECTIONS CONTROLLERS - BATCH APPLIQUÉES

## ✅ Contrôleurs corrigés

### 1. ✅ auth/controller.js
**Status** : CORRIGÉ  
**Changes** : 
- Tous les endpoints utilisent `res.api*()` helpers
- Validation via safeParse
- Codes d'erreur standardisés (VALIDATION_ERROR, INVALID_CREDENTIALS, TOKEN_EXPIRED, NOT_FOUND)

### 2. ✅ users/controller.js
**Status** : CORRIGÉ
**Changes** :
- getUser → `res.apiSuccess()`
- updateUser → `res.apiUpdated()`
- deleteUser → `res.apiDeleted()` (pas 204)

### 3. ✅ profiles/controller.js
**Status** : CORRIGÉ
**Changes** :
- listProfiles → `res.apiPaginated()`
- getProfile → `res.apiSuccess()`
- updateProfile → `res.apiUpdated()`
- getProfilePosts → `res.apiPaginated()`
- getFollowers → `res.apiPaginated()`
- followProfile → `res.apiCreated()`
- unfollowProfile → `res.apiSuccess()`

### 4. ⏳ posts/controller.js
**À faire** :
```javascript
// Template
async function listPosts(req, res) {
  const validated = listSchema.safeParse(req.query);
  if (!validated.success) throw new AppError('VALIDATION_ERROR', 400, 'Invalid params', validated.error.issues);
  const result = await postsService.listPosts(validated.data);
  const { data, total, page, limit } = result;
  res.apiPaginated(data, total, page, limit);
}

async function createPost(req, res) {
  const validated = createPostSchema.safeParse(req.body);
  if (!validated.success) throw new AppError('VALIDATION_ERROR', 400, 'Validation failed', validated.error.issues);
  const post = await postsService.createPost(req.user.userId, validated.data);
  res.apiCreated(post);
}

async function updatePost(req, res) {
  const validated = updatePostSchema.safeParse(req.body);
  if (!validated.success) throw new AppError('VALIDATION_ERROR', 400, 'Validation failed', validated.error.issues);
  const post = await postsService.updatePost(req.params.id, validated.data, req.user.userId);
  res.apiUpdated(post);
}

async function deletePost(req, res) {
  await postsService.deletePost(req.params.id, req.user.userId);
  res.apiDeleted(req.params.id);
}

async function flagPost(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  if (!['spam', 'inappropriate', 'misinformation'].includes(reason)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid reason');
  }
  await postsService.flagPost(id, reason, req.user.userId);
  res.apiSuccess({ flagged: true });
}
```

### 5. ⏳ likes/controller.js
**À faire** :
```javascript
async function likePost(req, res) {
  const validation = likeSchema.safeParse(req.params);
  if (!validation.success) throw new AppError('VALIDATION_ERROR', 400, 'Invalid post ID', validation.error.issues);
  const { postId } = validation.data;
  const result = await service.likePost(postId, req.user.userId);
  res.apiCreated(result);
}

async function unlikePost(req, res) {
  const validation = unlikeSchema.safeParse(req.params);
  if (!validation.success) throw new AppError('VALIDATION_ERROR', 400, 'Invalid post ID');
  const { postId } = validation.data;
  await service.unlikePost(postId, req.user.userId);
  res.apiSuccess({ unliked: true });
}

async function getPostLikes(req, res) {
  const { postId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const page = parseInt(req.query.page) || 1;
  
  const result = await service.getPostLikes(postId, limit, page);
  const { data, total } = result;
  res.apiPaginated(data, total, page, limit);
}

async function checkLike(req, res) {
  const { postId } = req.params;
  const isLiked = await service.checkLike(postId, req.user.userId);
  res.apiSuccess({ isLiked });
}
```

### 6. ⏳ comments/controller.js
**À faire** :
```javascript
async function createComment(req, res) {
  const { postId } = req.params;
  const validation = createCommentSchema.safeParse({
    postId,
    content: req.body.content,
  });
  if (!validation.success) throw new AppError('VALIDATION_ERROR', 400, 'Validation failed', validation.error.issues);
  const { content } = validation.data;
  const comment = await service.createComment(postId, req.user.userId, content);
  res.apiCreated(comment);
}

async function getCommentsByPost(req, res) {
  const { postId } = req.params;
  const validation = getCommentsSchema.safeParse({
    postId,
    limit: req.query.limit,
    page: req.query.page,
    sort: req.query.sort,
  });
  if (!validation.success) throw new AppError('VALIDATION_ERROR', 400, 'Validation failed');
  
  const result = await service.getCommentsByPost(
    postId,
    validation.data.limit,
    validation.data.page,
    validation.data.sort
  );
  const { data, total, page, limit } = result;
  res.apiPaginated(data, total, page, limit);
}

async function updateComment(req, res) {
  const { commentId } = req.params;
  const validation = updateCommentSchema.safeParse(req.body);
  if (!validation.success) throw new AppError('VALIDATION_ERROR', 400, 'Validation failed');
  const updated = await service.updateComment(commentId, req.user.userId, validation.data.content);
  res.apiUpdated(updated);
}

async function deleteComment(req, res) {
  const { commentId } = req.params;
  await service.deleteComment(commentId, req.user.userId);
  res.apiDeleted(commentId);
}
```

### 7. ⏳ ideas/controller.js
**À faire** :
```javascript
async function listIdeas(req, res) {
  const params = listSchema.safeParse(req.query);
  if (!params.success) throw new AppError('VALIDATION_ERROR', 400, 'Invalid params', params.error.issues);
  const userId = req.user?.userId || null;
  const result = await service.listIdeas({ ...params.data, userId });
  const { data, total, page, limit } = result;
  res.apiPaginated(data, total, page, limit);
}

async function createIdea(req, res) {
  const validated = createIdeaSchema.safeParse(req.body);
  if (!validated.success) throw new AppError('VALIDATION_ERROR', 400, 'Validation failed', validated.error.issues);
  const idea = await service.createIdea({
    ...validated.data,
    userId: req.user.userId,
  });
  res.apiCreated(idea);
}

async function updateIdea(req, res) {
  const validated = createIdeaSchema.partial().safeParse(req.body);
  if (!validated.success) throw new AppError('VALIDATION_ERROR', 400, 'Validation failed');
  const idea = await service.updateIdea(req.params.id, validated.data, req.user.userId);
  if (!idea) throw new AppError('NOT_FOUND', 404, 'Idea not found');
  res.apiUpdated(idea);
}

async function deleteIdea(req, res) {
  await service.deleteIdea(req.params.id, req.user.userId);
  res.apiDeleted(req.params.id);
}

async function likeIdea(req, res) {
  const { id } = req.params;
  await service.likeIdea(id, req.user.userId);
  res.apiCreated({ liked: true });
}

async function unlikeIdea(req, res) {
  const { id } = req.params;
  await service.unlikeIdea(id, req.user.userId);
  res.apiSuccess({ unliked: true });
}
```

### 8. ⏳ search/controller.js
**À faire** :
```javascript
async function search(req, res) {
  const params = searchSchema.safeParse({ ...req.query, ...req.body });
  if (!params.success) throw new AppError('VALIDATION_ERROR', 400, 'Validation failed', params.error.issues);

  let result;
  const filters = {
    category: params.data.category,
    sort: params.data.sort,
    page: params.data.page,
    limit: params.data.limit,
  };

  switch (params.data.type) {
    case 'posts':
      result = await service.searchPosts(params.data.q, filters);
      break;
    case 'users':
      result = await service.searchUsers(params.data.q, filters);
      break;
    case 'all':
    default:
      result = await service.searchAll(params.data.q, filters);
      break;
  }

  const { data, total, page, limit } = result;
  res.apiPaginated(data, total, page, limit);
}
```

### 9. ⏳ map/controller.js
**À faire** :
```javascript
async function getNodes(req, res) {
  const validated = bboxSchema.safeParse(req.query);
  if (!validated.success) throw new AppError('VALIDATION_ERROR', 400, 'Invalid bbox parameters');

  let geojson;
  if (validated.data.bounds) {
    const [west, south, east, north] = validated.data.bounds.split(',').map(Number);
    geojson = await mapService.getNodesInBbox(west, south, east, north, validated.data.limit);
  } else if (validated.data.region) {
    geojson = await mapService.getNodesByRegion(validated.data.region, validated.data.limit);
  } else {
    throw new AppError('VALIDATION_ERROR', 400, 'Bbox or region required');
  }

  res.apiSuccess(geojson);
}

async function createNode(req, res) {
  const validated = createNodeSchema.safeParse(req.body);
  if (!validated.success) throw new AppError('VALIDATION_ERROR', 400, 'Validation failed', validated.error.issues);
  const node = await mapService.createNode(validated.data);
  res.apiCreated(node);
}

async function updateNode(req, res) {
  const { id } = req.params;
  const validated = createNodeSchema.partial().safeParse(req.body);
  if (!validated.success) throw new AppError('VALIDATION_ERROR', 400, 'Validation failed');
  const node = await mapService.updateNode(id, validated.data);
  res.apiUpdated(node);
}

async function deleteNode(req, res) {
  const { id } = req.params;
  await mapService.deleteNode(id);
  res.apiDeleted(id);
}
```

### 10. ⏳ popular_system/controller.js
**À faire** :
```javascript
const PopularController = {
  async getPopular(req, res) {
    const parse = PopularQuerySchema.safeParse(req.query);
    if (!parse.success) {
      throw new AppError('VALIDATION_ERROR', 400, 'Validation failed', parse.error.issues);
    }
    const data = await PopularService.getPopular(parse.data);
    const { items, page, limit, total } = data;
    res.apiPaginated(items, total, page, limit);
  },
};
```

### 11. ⏳ notifications/controller.js
**À faire** :
```javascript
async function list(req, res) {
  const validation = paginationSchema.safeParse(req.query);
  if (!validation.success) throw new AppError('VALIDATION_ERROR', 400, 'Invalid params');

  const { page, limit } = validation.data;
  const result = await service.list(req.user.userId, page, limit);
  const { data, total } = result;
  res.apiPaginated(data, total, page, limit);
}

async function markAsRead(req, res) {
  const validation = markReadSchema.safeParse(req.params);
  if (!validation.success) throw new AppError('VALIDATION_ERROR', 400, 'Invalid ID');

  const { id } = validation.data;
  await service.markAsRead(id, req.user.userId);
  res.apiSuccess({ marked: true });
}

async function markAllAsRead(req, res) {
  await service.markAllAsRead(req.user.userId);
  res.apiSuccess({ allMarked: true });
}
```

---

## 📝 Checklist appliquée

- ✅ auth/controller.js
- ✅ users/controller.js
- ✅ profiles/controller.js
- ⏳ posts/controller.js
- ⏳ likes/controller.js
- ⏳ comments/controller.js
- ⏳ ideas/controller.js
- ⏳ search/controller.js
- ⏳ map/controller.js
- ⏳ popular_system/controller.js
- ⏳ notifications/controller.js

## 🧪 Tests Jest

À générer pour chaque module (voir TESTS_JEST.md)

## 📊 Impact

- ✅ Format réponse unifié
- ✅ Codes d'erreur standardisés
- ✅ Pagination cohérente
- ✅ Validation centralisée
- ✅ Pas de 204 send() (tous les endpoints retournent JSON)
