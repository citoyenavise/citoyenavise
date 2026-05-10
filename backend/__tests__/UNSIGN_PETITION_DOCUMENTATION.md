# Route DELETE /api/v1/petitions/:id/sign — Unsign Petition

## 📋 Vue d'ensemble

Cette route permet à un utilisateur authentifié de retirer sa signature d'une pétition. C'est l'inverse exact de POST /sign.

---

## 🔐 Authentification & Validation

### Middleware & Validations (Zod)

```javascript
router.delete('/:id/sign', authMiddleware, async (req, res, next) => {
```

| Validation | Schéma | Exemple | Résultat |
|-----------|--------|---------|----------|
| **JWT Required** | authMiddleware | `Authorization: Bearer <token>` | 401 si absent/invalide |
| **petition_id** | `z.coerce.number().int().positive()` | `123` | 400 si ≤0 ou non-integer |
| **citoyen_id** | `req.user.userId` (du token) | Extracté automatiquement | Pas injectable via body |
| **Pétition existe** | `Petition.findByPk(id)` | Query BD | 404 si non trouvée |
| **Signature existe** | `Signature.findOne({petitionId, citoyenId})` | Query BD | 404 si non trouvée |

---

## 🎯 Cas de Réponse

### ✅ Succès : 200 OK

```json
{
  "unsigned": true,
  "totalSignatures": 122
}
```

**Points clés :**
- Signature supprimée de la BD
- `signatures_count` décrémenté (1 → 0)
- `totalSignatures` = compteur APRÈS suppression
- AUCUN autre champ en réponse

### ❌ Signature n'existe pas : 404 Not Found

```json
{
  "unsigned": false,
  "message": "Vous n'aviez pas signé cette pétition"
}
```

**Trigger :**
- Utilisateur n'a jamais signé cette pétition
- Ou a déjà retiré sa signature
- Idempotence : même réponse à chaque tentative

### ❌ Pétition non trouvée : 404 Not Found

```json
{
  "unsigned": false,
  "message": "Pétition non trouvée"
}
```

### ❌ ID invalide : 400 Bad Request

```json
{
  "unsigned": false,
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

4. SELECT signature BY (petition_id, citoyen_id)
   ↓ 404 si n'existe pas

5. DELETE signature
   ↓ Suppression en cascade

6. UPDATE petition SET signatures_count = signatures_count - 1
   ↓ (Si count > 0)

7. RETURN 200 { unsigned: true, totalSignatures: N }
```

---

## 💾 Changements BD

### Table `signatures`

```sql
DELETE FROM signatures
WHERE petition_id = 123
  AND citoyen_id = 456;
```

**Via Sequelize :**
```javascript
await signature.destroy();
```

### Table `petitions`

```sql
UPDATE petitions
SET signatures_count = signatures_count - 1
WHERE id = 123
  AND signatures_count > 0;
```

**Via trigger PostgreSQL :**
```sql
CREATE TRIGGER petition_signature_count_trigger
AFTER DELETE ON signatures
FOR EACH ROW
EXECUTE FUNCTION update_petition_signature_count();
```

---

## 🧪 Tests

### Suite de Tests : `__tests__/unsign-petition.test.js`

Couvre :
- ✅ Retirer signature (200)
- ✅ Signature n'existe pas (404)
- ✅ Validation petition_id (400 pour invalid/négatif/zéro)
- ✅ Pétition non trouvée (404)
- ✅ Sans authentification (401)
- ✅ JWT invalide (403)
- ✅ Format réponse exact
- ✅ citoyen_id du token (pas injectable)
- ✅ Décrément totalSignatures
- ✅ Multiple users unsign correctly
- ✅ Sign/Unsign cycle (re-sign après unsign)

**Exécuter :**
```bash
npm test -- __tests__/unsign-petition.test.js
```

---

## 🔒 Sécurité

| Aspect | Implémentation |
|--------|-----------------|
| **Authentification** | JWT via authMiddleware |
| **Autorisation** | citoyen_id extrait de req.user (pas injectable) |
| **SQL Injection** | Parameterized queries via Sequelize |
| **Data Integrity** | CASCADE DELETE + Trigger pour count |
| **Idempotence** | 404 si signature inexistante |

---

## 📊 Exemple cURL

### Retirer signature (Succès)

```bash
curl -X DELETE http://localhost:5000/api/v1/petitions/123/sign \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"

# Réponse 200
{
  "unsigned": true,
  "totalSignatures": 122
}
```

### Retirer signature inexistante

```bash
# Deuxième appel avec le même JWT

# Réponse 404
{
  "unsigned": false,
  "message": "Vous n'aviez pas signé cette pétition"
}
```

### Validation Zod (ID invalide)

```bash
curl -X DELETE http://localhost:5000/api/v1/petitions/abc/sign \
  -H "Authorization: Bearer ..." 

# Réponse 400
{
  "unsigned": false,
  "message": "petition_id invalide",
  "details": [...]
}
```

---

## ✅ Checklist de Conformité

- [x] Protected (JWT required) ✓ authMiddleware
- [x] Valide petition_id existe ✓ Zod + findByPk
- [x] DELETE signature WHERE petition_id AND citoyen_id ✓ findOne + destroy
- [x] Décrémenter signatures_count ✓ petition.save()
- [x] Return { unsigned: true, totalSignatures } ✓ 200 response
- [x] Si signature n'existe pas → 404 ✓ findOne check
- [x] Validation Zod (petition_id) ✓ z.coerce.number().int().positive()

---

## 🔄 Comparaison avec POST /sign

| Aspect | POST /sign | DELETE /sign |
|--------|-----------|------------|
| **Réponse succès** | 201 `{ signed: true, totalSignatures }` | 200 `{ unsigned: true, totalSignatures }` |
| **Erreur doublon** | 409 Conflict | 404 Not Found |
| **Action BD** | INSERT + Incrément | DELETE + Décrément |
| **Idempotence** | Non (409) | Oui (404) |
| **Counter** | Passe 0→1 | Passe 1→0 |

---

## 📝 Notes

- Le format de réponse **ne contient que** `unsigned` et `totalSignatures` (pas de `success`, `message`, `data`)
- Le `totalSignatures` est le **count APRÈS** la suppression
- L'erreur 404 est **idempotente** — même message/code à chaque tentative
- Le citoyen_id vient **uniquement du token** — body injection impossible
- Peut re-signer après unsign (créer nouvelle signature)
- Trigger PostgreSQL gère le décrément automatiquement
