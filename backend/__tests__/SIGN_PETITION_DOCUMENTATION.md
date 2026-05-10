# Route POST /api/v1/petitions/:id/sign — Sign Petition

## 📋 Vue d'ensemble

Cette route permet à un utilisateur authentifié de signer une pétition. Elle implémente une idempotence garantie via une contrainte UNIQUE au niveau de la base de données.

---

## 🔐 Authentification & Validation

### Middleware & Validations (Zod)

```javascript
router.post('/:id/sign', authMiddleware, async (req, res, next) => {
```

| Validation | Schéma | Exemple | Résultat |
|-----------|--------|---------|----------|
| **JWT Required** | authMiddleware | `Authorization: Bearer <token>` | 401 si absent/invalide |
| **petition_id** | `z.coerce.number().int().positive()` | `123` | 400 si ≤0 ou non-integer |
| **citoyen_id** | `req.user.userId` (du token) | Extracté automatiquement | Pas injectable via body |
| **Pétition existe** | `Petition.findByPk(id)` | Query BD | 404 si non trouvée |
| **Status published** | `petition.status === 'published'` | draft/published/closed/won | 400 si non published |

---

## 🎯 Cas de Réponse

### ✅ Succès : 201 Created

```json
{
  "signed": true,
  "totalSignatures": 123
}
```

**Points clés :**
- Signature créée dans la BD
- `signatures_count` incrémenté (0 → 1)
- Timestamp `created_at` automatique (PostgreSQL)
- AUCUN autre champ en réponse

### ❌ Doublon : 409 Conflict (UNIQUE violation)

```json
{
  "signed": false,
  "message": "Vous avez déjà signé cette pétition"
}
```

**Trigger :**
- `SELECT` détecte signature existante → 409 immédiat
- Ou `INSERT` échoue sur contrainte UNIQUE → capturé et retourné 409
- `signatures_count` inchangé

### ❌ Pétition non trouvée : 404 Not Found

```json
{
  "signed": false,
  "message": "Pétition non trouvée"
}
```

### ❌ Pétition non publiée : 400 Bad Request

```json
{
  "signed": false,
  "message": "Cette pétition n'est pas publiée"
}
```

Valide pour status : `draft`, `closed`, `won`

### ❌ ID invalide : 400 Bad Request

```json
{
  "signed": false,
  "message": "petition_id invalide",
  "details": [{ "code": "...", "message": "..." }]
}
```

Cas :
- `petition_id` non-integer : `/petitions/abc/sign`
- `petition_id` ≤ 0 : `/petitions/-123/sign` ou `/petitions/0/sign`
- `petition_id` float : `/petitions/12.5/sign`

### ❌ Non authentifié : 401 Unauthorized

```json
{
  "success": false,
  "error": "Token manquant",
  "message": "Utilisez: Authorization: Bearer <token>",
  "code": "MISSING_TOKEN"
}
```

Retourné par `authMiddleware` (ne transite pas par cette route)

---

## 🔄 Flow Détaillé

```
1. Validation JWT (authMiddleware)
   ↓ 401 si absent/invalide
2. Validation petition_id (Zod)
   ↓ 400 si invalid
3. SELECT petition BY id
   ↓ 404 si absent
4. CHECK status === 'published'
   ↓ 400 si non published
5. SELECT signature BY (petition_id, citoyen_id)
   ↓ 409 si existe
6. INSERT signature
   ↓ 409 si UNIQUE constraint violation (race condition)
7. UPDATE petition SET signatures_count = signatures_count + 1
   ↓
8. RETURN 201 { signed: true, totalSignatures: N }
```

---

## 💾 Changements BD

### Table `signatures`

```sql
INSERT INTO signatures (petition_id, citoyen_id, created_at)
VALUES (123, 456, CURRENT_TIMESTAMP);
```

**Contraintes :**
- UNIQUE(petition_id, citoyen_id) — Empêche doublons
- FOREIGN KEY petition_id → petitions(id) ON DELETE CASCADE
- FOREIGN KEY citoyen_id → users(id) ON DELETE CASCADE

### Table `petitions`

```sql
UPDATE petitions
SET signatures_count = signatures_count + 1
WHERE id = 123;
```

**Via trigger PostgreSQL :**
```sql
CREATE TRIGGER petition_signature_count_trigger
AFTER INSERT OR DELETE ON signatures
FOR EACH ROW
EXECUTE FUNCTION update_petition_signature_count();
```

---

## 🧪 Tests

### Suite de Tests : `__tests__/sign-petition.test.js`

Couvre :
- ✅ Première signature (201)
- ✅ Deuxième signature (409)
- ✅ Validation petition_id (400 pour invalid/négatif/zéro)
- ✅ Pétition non trouvée (404)
- ✅ Pétition non publiée (400)
- ✅ Sans authentification (401)
- ✅ JWT invalide (403)
- ✅ Format réponse exact
- ✅ citoyen_id du token (pas injectable)
- ✅ Incrément totalSignatures

**Exécuter :**
```bash
npm test -- __tests__/sign-petition.test.js
```

---

## 🔒 Sécurité

| Aspect | Implémentation |
|--------|-----------------|
| **Authentification** | JWT via authMiddleware |
| **Autorisation** | citoyen_id extrait de req.user (pas injectable) |
| **Idempotence** | UNIQUE(petition_id, citoyen_id) + SELECT before INSERT |
| **Injection SQL** | Parameterized queries via Sequelize |
| **Race Condition** | BD constraint garantit une seule signature |
| **Data Integrity** | CASCADE DELETE + Trigger pour count |

---

## 📊 Exemple cURL

### Signer (Succès)

```bash
curl -X POST http://localhost:5000/api/v1/petitions/123/sign \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"

# Réponse 201
{
  "signed": true,
  "totalSignatures": 1
}
```

### Signer (Doublon)

```bash
# Deuxième appel avec le même JWT

# Réponse 409
{
  "signed": false,
  "message": "Vous avez déjà signé cette pétition"
}
```

### Validation Zod (ID invalide)

```bash
curl -X POST http://localhost:5000/api/v1/petitions/abc/sign \
  -H "Authorization: Bearer ..." 

# Réponse 400
{
  "signed": false,
  "message": "petition_id invalide",
  "details": [...]
}
```

---

## ✅ Checklist de Conformité

- [x] Protected (JWT required) ✓ authMiddleware
- [x] Valide petition_id existe ✓ Zod + findByPk
- [x] Valide citoyen_id du token ✓ req.user.userId
- [x] INSERT signature (petition_id, citoyen_id) ✓ Signature.create
- [x] UNIQUE violation → 409 ✓ SELECT before INSERT + catch constraint
- [x] Succès → { signed: true, totalSignatures } ✓ 201 response
- [x] Incrémenter signatures_count ✓ petition.save()
- [x] Validation Zod (petition_id) ✓ z.coerce.number().int().positive()

---

## 📝 Notes

- Le format de réponse **ne contient que** `signed` et `totalSignatures` (pas de `success`, `message`, `data`)
- Le `totalSignatures` est le **count APRÈS** l'insertion (commencer à 1 pour première signature)
- L'erreur 409 est **idempotente** — même message/code à chaque tentative
- Le citoyen_id vient **uniquement du token** — body injection impossible
