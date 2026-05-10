# Route GET /api/v1/petitions/:id/stats — Statistiques Pétition

## 📋 Vue d'ensemble

Route publique pour obtenir les statistiques d'une pétition : nombre de signatures, commentaires, créateur, objectif d'atteinte.

---

## 🔐 Authentification

**Non requise** — Route publique accessible à tous

---

## 🛣️ Endpoint

### **GET /api/v1/petitions/:id/stats**

**Paramètres :**
- `petition_id` (route) : integer positif
- `goal` (query, optionnel) : integer positif

**Exemple :**
```bash
# Sans goal
GET /api/v1/petitions/123/stats

# Avec goal
GET /api/v1/petitions/123/stats?goal=200
```

---

## 📤 Réponse 200 OK

### Format standard (sans `goal`)

```json
{
  "success": true,
  "data": {
    "totalSignatures": 123,
    "totalComments": 45,
    "createdAt": "2026-05-09",
    "creator": {
      "id": 456,
      "nomComplet": "Jean Dupont"
    },
    "targetElu": {
      "id": 789,
      "nom": "Marie Dubois"
    },
    "percentageToGoal": null
  }
}
```

### Avec `goal=200`

```json
{
  "success": true,
  "data": {
    "totalSignatures": 123,
    "totalComments": 45,
    "createdAt": "2026-05-09",
    "creator": {
      "id": 456,
      "nomComplet": "Jean Dupont"
    },
    "targetElu": {
      "id": 789,
      "nom": "Marie Dubois"
    },
    "percentageToGoal": 61
  }
}
```

---

## 🧮 Champs Détails

| Champ | Type | Description |
|-------|------|-------------|
| `totalSignatures` | integer | Nombre de signatures (depuis petition.signaturesCount) |
| `totalComments` | integer | Nombre de commentaires (COUNT depuis petition_comments) |
| `createdAt` | string | Date création pétition au format YYYY-MM-DD |
| `creator` | object | Créateur { id, nomComplet } ou null |
| `targetElu` | object | Élu visé { id, nom } ou null |
| `percentageToGoal` | integer\|null | Pourcentage atteint (null si pas goal) |

### Calcul `percentageToGoal`

```
percentageToGoal = Math.round((totalSignatures / goal) * 100)

Exemples :
- 5 signatures, goal 10 → (5/10)*100 = 50%
- 5 signatures, goal 20 → (5/20)*100 = 25%
- 5 signatures, goal 2 → (5/2)*100 = 250% (dépassement)
- 5 signatures, goal 100 → (5/100)*100 = 5%
- 0 signatures, goal 100 → (0/100)*100 = 0%
```

**Sans `goal` :** `percentageToGoal` = `null`

---

## ❌ Erreurs

### **400 Bad Request**

```json
{
  "success": false,
  "error": "petition_id invalide",
  "details": [...]
}
```

**Cas :**
- petition_id non-integer (ex: "abc")
- petition_id ≤ 0 (ex: "-5", "0")
- goal ≤ 0 (ex: "-10", "0")
- goal non-integer (ex: "abc")

### **404 Not Found**

```json
{
  "success": false,
  "error": "Pétition non trouvée"
}
```

**Cas :**
- petition_id inexistant (ex: 99999)

---

## 🔄 Cas Spéciaux

### Pétition sans élu (`eluId = null`)

```json
{
  "success": true,
  "data": {
    "totalSignatures": 0,
    "totalComments": 0,
    "createdAt": "2026-05-10",
    "creator": {
      "id": 123,
      "nomComplet": "Alice"
    },
    "targetElu": null,
    "percentageToGoal": null
  }
}
```

### Pétition sans commentaires

```json
{
  "data": {
    "totalComments": 0,
    ...
  }
}
```

### Pétition sans signatures

```json
{
  "data": {
    "totalSignatures": 0,
    "percentageToGoal": 0  // si goal fourni
  }
}
```

---

## 📊 Exemples cURL

### Stats basiques

```bash
curl http://localhost:5000/api/v1/petitions/123/stats

{
  "success": true,
  "data": {
    "totalSignatures": 5,
    "totalComments": 3,
    "createdAt": "2026-05-09",
    "creator": { "id": 1, "nomComplet": "John" },
    "targetElu": { "id": 2, "nom": "Marie" },
    "percentageToGoal": null
  }
}
```

### Avec objectif de 10 signatures

```bash
curl "http://localhost:5000/api/v1/petitions/123/stats?goal=10"

{
  "success": true,
  "data": {
    "totalSignatures": 5,
    "totalComments": 3,
    "createdAt": "2026-05-09",
    "creator": { "id": 1, "nomComplet": "John" },
    "targetElu": { "id": 2, "nom": "Marie" },
    "percentageToGoal": 50
  }
}
```

### Avec objectif de 200 signatures (dépassement)

```bash
curl "http://localhost:5000/api/v1/petitions/123/stats?goal=2"

{
  "success": true,
  "data": {
    "totalSignatures": 5,
    "totalComments": 3,
    "createdAt": "2026-05-09",
    "creator": { "id": 1, "nomComplet": "John" },
    "targetElu": { "id": 2, "nom": "Marie" },
    "percentageToGoal": 250
  }
}
```

---

## 🧪 Tests

### Suite de Tests : `__tests__/petition-stats.test.js`

Couvre :
- ✅ Stats basiques (200 OK)
- ✅ Tous les champs présents
- ✅ totalSignatures correct
- ✅ totalComments correct
- ✅ createdAt format YYYY-MM-DD
- ✅ creator info (id, nomComplet)
- ✅ targetElu info (id, nom)
- ✅ percentageToGoal null sans goal
- ✅ percentageToGoal calcul correct (50%, 25%, 100%, 0%)
- ✅ percentageToGoal arrondi
- ✅ percentageToGoal > 100%
- ✅ Erreurs validation (invalid id, goal négatif/zéro)
- ✅ Pétitions sans élu
- ✅ Public access (no JWT)
- ✅ Signatures = 0
- ✅ Format réponse exact

**Exécuter :**
```bash
npm test -- __tests__/petition-stats.test.js
```

---

## 🔒 Sécurité

| Aspect | Implémentation |
|--------|-----------------|
| **Public access** | Aucune authentification requise |
| **SQL Injection** | Sequelize parameterized queries |
| **Validation** | Zod (petition_id > 0, goal > 0 optionnel) |
| **Data leaking** | Aucune (stats publiques) |

---

## 🔧 Implémentation Détails

### Requête 1 : Récupérer pétition

```javascript
const petition = await Petition.findByPk(petitionId, {
  attributes: ['id', 'createdAt', 'signaturesCount', 'citoyenId', 'eluId'],
  include: [
    { model: User, as: 'creator', attributes: ['id', 'nomComplet'] },
    { model: Elu, as: 'elu', attributes: ['id', 'nom'] },
  ],
});
```

### Requête 2 : Compter commentaires

```javascript
const commentCount = await Comment.count({
  where: { petitionId },
});
```

### Calcul percentageToGoal

```javascript
let percentageToGoal = null;
if (goal && goal > 0) {
  percentageToGoal = Math.round((petition.signaturesCount / goal) * 100);
}
```

---

## 📈 Performance

**Optimisations :**
- Pas de JOIN sur signatures (utilise signaturesCount dénormalisé)
- COUNT sur comments avec index petition_id
- 2 requêtes DB seulement (findByPk + count)
- Pas de pagination (stats globales)

**Complexité :**
- O(1) pour récupérer pétition
- O(n) pour compter commentaires (mais indexé)

---

## ✅ Checklist de Conformité

- [x] Public access (aucune authentification)
- [x] GET /petitions/:id/stats
- [x] Validation petition_id (integer positif)
- [x] Validation goal (integer positif, optionnel)
- [x] totalSignatures retourné
- [x] totalComments retourné
- [x] createdAt au format YYYY-MM-DD
- [x] creator { id, nomComplet }
- [x] targetElu { id, nom }
- [x] percentageToGoal = null sans goal
- [x] percentageToGoal calculé si goal
- [x] targetElu null si pas d'élu
- [x] Tests complets (40+ cas)

---

## 🚀 Utilisation Recommandée

### Frontend Dashboard

```javascript
// Afficher la progression
const stats = await api.petitions.getStats(petitionId, { goal: 200 });

console.log(`${stats.totalSignatures}/${200} signatures (${stats.percentageToGoal}%)`);
console.log(`${stats.totalComments} commentaires`);
console.log(`Créée par : ${stats.creator.nomComplet}`);
console.log(`Pour : ${stats.targetElu.nom}`);
```

### Analytics

```javascript
// Comparer pétitions par taux de signature
const petitions = await Promise.all([
  api.petitions.getStats(123, { goal: 100 }),
  api.petitions.getStats(456, { goal: 100 }),
  api.petitions.getStats(789, { goal: 100 }),
]);

const sorted = petitions.sort((a, b) => b.percentageToGoal - a.percentageToGoal);
```
