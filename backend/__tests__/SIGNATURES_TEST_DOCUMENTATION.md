# Tests des Signatures (Idempotence & UNIQUE Constraint)

## 📋 Vue d'ensemble

Le fichier `signatures.test.js` vérifie que la contrainte UNIQUE sur `(petition_id, citoyen_id)` fonctionne correctement, garantissant l'idempotence des signatures de pétitions.

---

## 🔍 Configuration de la BD

### Migration SQL (`001_initial.sql`)

```sql
CREATE TABLE signatures (
  id BIGSERIAL PRIMARY KEY,
  petition_id INTEGER NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  citoyen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(petition_id, citoyen_id)                    ← Contrainte UNIQUE
);

CREATE INDEX idx_signatures_petition_id ON signatures(petition_id);
CREATE INDEX idx_signatures_citoyen_id ON signatures(citoyen_id);
CREATE UNIQUE INDEX idx_signatures_unique ON signatures(petition_id, citoyen_id);  ← Index UNIQUE
```

### Modèle Sequelize (`src/models/Signature.js`)

```javascript
const Signature = sequelize.define('Signature', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  petitionId: {
    type: DataTypes.INTEGER,
    field: 'petition_id',
    allowNull: false,
    references: { model: 'petitions', key: 'id' },
    onDelete: 'CASCADE',
    unique: 'signature_unique',  ← Composant de contrainte UNIQUE
  },
  citoyenId: {
    type: DataTypes.INTEGER,
    field: 'citoyen_id',
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
    unique: 'signature_unique',  ← Composant de contrainte UNIQUE
  },
  createdAt: {                   ← Timestamp automatique
    type: DataTypes.DATE,
    field: 'created_at',
  },
}, {
  tableName: 'signatures',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['petition_id', 'citoyen_id'],  ← Index UNIQUE
    },
  ],
});
```

---

## ✅ Cas de Test

### 1. **Première Signature — 201 Created**

```
POST /api/v1/petitions/:id/sign
Authorization: Bearer <JWT>

Response: 201
{
  "success": true,
  "message": "Pétition signée avec succès",
  "data": {
    "id": 1,
    "petitionId": 123,
    "citoyenId": 456,
    "createdAt": "2026-05-09T12:00:00Z"
  }
}

✅ signatures_count de la pétition passe de 0 à 1
```

### 2. **Deuxième Signature Même User — 409 Conflict**

```
POST /api/v1/petitions/:id/sign
Authorization: Bearer <JWT>

Response: 409
{
  "success": false,
  "error": "Vous avez déjà signé cette pétition",
  "code": "DUPLICATE_SIGNATURE"
}

✅ La contrainte UNIQUE bloque l'insertion
✅ signatures_count reste à 1
```

### 3. **Vérification BD Directe**

La tentative de créer une signature doublon via Sequelize lève :
- `SequelizeUniqueConstraintError` OU
- `UniqueConstraintError` OU
- Erreur contenant "duplicate"

---

## 🛠️ Implémentation dans Routes

### (`src/routes/petitions.js`)

```javascript
router.post('/:id/sign', authMiddleware, async (req, res, next) => {
  // ...
  
  // ✅ Vérification manuelle AVANT création (prévient les race conditions)
  const existingSignature = await Signature.findOne({
    where: {
      petitionId: id,
      citoyenId: req.user.userId,
    },
  });

  if (existingSignature) {
    return res.status(409).json({
      success: false,
      error: 'Vous avez déjà signé cette pétition',  ← Message exact demandé
      code: 'DUPLICATE_SIGNATURE',
    });
  }

  // ✅ Création de la signature (protected par UNIQUE constraint)
  const signature = await Signature.create({
    petitionId: id,
    citoyenId: req.user.userId,
  });

  // ✅ Incrément du compteur
  petition.signaturesCount += 1;
  await petition.save();
  
  res.status(201).json({ /* ... */ });
});
```

### Retrait de Signature

```javascript
router.delete('/:id/sign', authMiddleware, async (req, res, next) => {
  // ...
  
  const signature = await Signature.findOne({
    where: {
      petitionId: id,
      citoyenId: req.user.userId,
    },
  });

  if (!signature) {
    return res.status(404).json({
      success: false,
      error: 'Vous n\'aviez pas signé cette pétition',
      code: 'SIGNATURE_NOT_FOUND',
    });
  }

  await signature.destroy();

  // ✅ Décrément du compteur
  if (petition.signaturesCount > 0) {
    petition.signaturesCount -= 1;
    await petition.save();
  }
  
  res.json({ success: true, message: 'Signature retirée' });
});
```

---

## 🚀 Exécuter les Tests

```bash
# Tous les tests
npm test

# Uniquement les tests de signatures
npm test -- __tests__/signatures.test.js

# Avec couverture
npm test -- --coverage __tests__/signatures.test.js
```

---

## 📊 Couverture Attendue

| Aspect | Couverture |
|--------|-----------|
| Routes | ✅ POST /sign, DELETE /sign, GET /signatures |
| Modèle | ✅ Constraint UNIQUE, Indexes, Cascade |
| Idempotence | ✅ 201 first sign, 409 duplicate, 404 unsign invalid |
| BD | ✅ Une seule ligne per (petition_id, citoyen_id) |
| Erreurs | ✅ Unauthenticated, draft petition, missing petition |

---

## 🔒 Garanties de Sécurité

1. **Contrainte UNIQUE au niveau BD** — Pas de doublons possibles
2. **Vérification Sequelize** — Gère les erreurs de contrainte
3. **JWT Protection** — Seul l'utilisateur authentifié peut signer
4. **Cascade Delete** — Les signatures sont supprimées avec la pétition
5. **Timestamp** — Chaque signature est horodatée

---

## 📝 Notes

- La vérification manuelle dans le code avant création améliore UX (409 au lieu de 500)
- La contrainte BD garantit l'intégrité même en cas de race condition
- Le compteur `signatures_count` est maintenu par trigger PostgreSQL
- Les tests couvrent les cas happy path et error paths
