# 🤝 Promise Model (Sequelize)

**Modèle ORM Sequelize pour les promesses électorales**

---

## 📦 Fichiers Créés

```
✅ backend/src/models/Promise.js
   └─ Modèle Sequelize pour les promesses
   
✅ backend/src/routes/promises.js
   └─ Routes API pour les promesses
   
✅ backend/src/models/index.js (updated)
   └─ Import du modèle Promise
   └─ Associations Elu ↔ Promise
   
✅ backend/__tests__/Promise.test.js
   └─ Tests du modèle
```

---

## 🏗️ Modèle Promise

### **Attributs**

```javascript
{
  id: INTEGER (PRIMARY KEY, AUTO_INCREMENT),
  titre: STRING(255) NOT NULL,
  description: TEXT,
  status: ENUM ('engagee', 'en_cours', 'completee', 'abandonnee'),
  deadline: DATE,
  completedAt: DATE,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

### **Validations**

```javascript
titre:
  - allowNull: false (requis)
  - notEmpty: true (non vide)
  - len: [1, 255] (longueur 1-255)

status:
  - isIn: ['engagee', 'en_cours', 'completee', 'abandonnee']
  - defaultValue: 'engagee'
```

### **Associations**

```javascript
Promise.belongsTo(Elu, { as: 'elu' })
Elu.hasMany(Promise, { as: 'promises' })
```

**Usage:**
```javascript
// Get promise with elected official
const promise = await Promise.findByPk(1, {
  include: [{ model: Elu, as: 'elu' }]
});

// Get all promises for an elected official
const promises = await Promise.findAll({
  where: { eluId: 1 },
  include: [{ model: Elu, as: 'elu' }]
});

// Get elu with promises
const elu = await Elu.findByPk(1, {
  include: [{ model: Promise, as: 'promises' }]
});
```

---

## 🔌 API Endpoints

### **GET /api/v1/promises**
List all promises with optional filters

**Query Parameters:**
- `status` — Filter by status (engagee, en_cours, completee, abandonnee)
- `eluId` — Filter by elected official
- `limit` — Results per page (default: 20, max: 100)
- `offset` — Pagination offset (default: 0)

**Request:**
```bash
curl "http://localhost:5000/api/v1/promises?status=en_cours&limit=10"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titre": "Investir dans l'éducation",
      "description": "100M$ pour les écoles",
      "status": "en_cours",
      "deadline": "2027-12-31",
      "completedAt": null,
      "createdAt": "2026-05-10T16:00:00Z",
      "updatedAt": "2026-05-10T16:00:00Z",
      "elu": {
        "id": 1,
        "nom": "Jean Dupont",
        "titre": "Député",
        "region": "Quebec"
      }
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

---

### **GET /api/v1/promises/:id**
Get promise detail

**Request:**
```bash
curl http://localhost:5000/api/v1/promises/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "titre": "Investir dans l'éducation",
    "description": "100M$ pour les écoles",
    "status": "en_cours",
    "deadline": "2027-12-31",
    "completedAt": null,
    "createdAt": "2026-05-10T16:00:00Z",
    "updatedAt": "2026-05-10T16:00:00Z",
    "elu": {
      "id": 1,
      "nom": "Jean Dupont",
      "titre": "Député",
      "region": "Quebec"
    }
  }
}
```

---

### **GET /api/v1/promises/elu/:eluId**
Get all promises for an elected official

**Request:**
```bash
curl "http://localhost:5000/api/v1/promises/elu/1?status=completee"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "titre": "Construire 50 écoles",
      "status": "completee",
      "deadline": "2025-12-31",
      "completedAt": "2025-11-15T00:00:00Z"
    }
  ],
  "count": 1
}
```

---

### **POST /api/v1/elus/:eluId/promises**
Create a new promise (protected - auth required)

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/elus/1/promises \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "titre": "Réduire les impôts de 5%",
    "description": "Réduction d'\''impôt sur le revenu dès le 1er janvier 2027",
    "status": "engagee",
    "deadline": "2027-01-01"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "eluId": 1,
    "titre": "Réduire les impôts de 5%",
    "description": "Réduction d'impôt sur le revenu dès le 1er janvier 2027",
    "status": "engagee",
    "deadline": "2027-01-01",
    "completedAt": null,
    "createdAt": "2026-05-10T16:30:00Z",
    "updatedAt": "2026-05-10T16:30:00Z"
  }
}
```

---

### **PUT /api/v1/promises/:id**
Update a promise (protected - auth required)

**Request:**
```bash
curl -X PUT http://localhost:5000/api/v1/promises/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "titre": "Investir 150M$ dans l'\''éducation (updated)",
    "description": "Augmentation du budget suite à réévaluation",
    "deadline": "2028-12-31"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "titre": "Investir 150M$ dans l'éducation (updated)",
    "status": "en_cours",
    "updatedAt": "2026-05-10T17:00:00Z"
  }
}
```

---

### **PUT /api/v1/promises/:id/status**
Update promise status (protected - auth required)

**Request:**
```bash
curl -X PUT http://localhost:5000/api/v1/promises/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"status": "completee"}'
```

**Valid Status Values:**
- `engagee` — Promesse engagée
- `en_cours` — En cours de réalisation
- `completee` — Complétée avec succès
- `abandonnee` — Abandonnée

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "completee",
    "completedAt": "2026-05-10T17:00:00Z",
    "updatedAt": "2026-05-10T17:00:00Z"
  }
}
```

---

### **DELETE /api/v1/promises/:id**
Delete a promise (protected - auth required)

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/v1/promises/1 \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Promise deleted successfully"
}
```

---

## 💻 Usage Exemples (Node.js/JavaScript)

### **Find All Promises**
```javascript
import { Promise as PromiseModel, Elu } from './models/index.js';

const promises = await PromiseModel.findAll({
  include: [{ model: Elu, as: 'elu' }],
  order: [['deadline', 'ASC']],
  limit: 10
});
```

### **Find Promises by Status**
```javascript
const inProgress = await PromiseModel.findAll({
  where: { status: 'en_cours' },
  include: [{ model: Elu, as: 'elu' }]
});
```

### **Find Promises for an Elected Official**
```javascript
const eluPromises = await PromiseModel.findAll({
  where: { eluId: 1 },
  include: [{ model: Elu, as: 'elu' }],
  order: [['deadline', 'ASC']]
});
```

### **Create a Promise**
```javascript
const newPromise = await PromiseModel.create({
  eluId: 1,
  titre: 'New Promise',
  description: 'Promise details',
  status: 'engagee',
  deadline: new Date('2027-12-31')
});
```

### **Update a Promise**
```javascript
const promise = await PromiseModel.findByPk(1);
promise.titre = 'Updated Title';
promise.status = 'en_cours';
await promise.save();
```

### **Mark as Completed**
```javascript
const promise = await PromiseModel.findByPk(1);
promise.status = 'completee';
promise.completedAt = new Date();
await promise.save();
```

### **Delete a Promise**
```javascript
const promise = await PromiseModel.findByPk(1);
await promise.destroy();
```

---

## 🧪 Tester le Modèle

### **Exécuter les tests**
```bash
npm test -- __tests__/Promise.test.js
```

### **Tests Inclus**
- ✅ Model definition
- ✅ Attribute validation
- ✅ Associations with Elu
- ✅ Status enum values
- ✅ Required fields
- ✅ Timestamps

---

## 📊 Requêtes SQL Utiles

### **Taux de réussite par élu**
```sql
SELECT 
  e.nom,
  COUNT(*) as total,
  COUNT(CASE WHEN p.status = 'completee' THEN 1 END) as completed,
  ROUND(100.0 * COUNT(CASE WHEN p.status = 'completee' THEN 1 END) / COUNT(*), 2) as percentage
FROM promises p
JOIN elus e ON p.elu_id = e.id
GROUP BY e.id
ORDER BY percentage DESC;
```

### **Promesses expirées**
```sql
SELECT p.*, e.nom
FROM promises p
JOIN elus e ON p.elu_id = e.id
WHERE p.deadline < CURRENT_DATE AND p.status != 'completee'
ORDER BY p.deadline;
```

### **Compteur par statut**
```sql
SELECT status, COUNT(*) as count
FROM promises
GROUP BY status;
```

---

## ✅ Checklist

- ✅ Promise model created with Sequelize
- ✅ All attributes defined (titre, description, status, etc.)
- ✅ Validations implemented
- ✅ Association with Elu created
- ✅ 6 API endpoints implemented
- ✅ Routes registered in index.js
- ✅ Tests written (14 tests)
- ✅ Documentation complete

---

## 📞 Support

- Model: `backend/src/models/Promise.js`
- Routes: `backend/src/routes/promises.js`
- Tests: `backend/__tests__/Promise.test.js`
- Docs: `backend/PROMISE_MODEL.md`

---

**Promise Model — Ready for Production! 🚀**
