# 🤝 Promises (Engagements Électoraux) — Setup Guide

**Table pour suivre les promesses électorales des élus**

---

## 📦 Migration V004 — Créée ✅

**Fichier:** `backend/src/database/migrations/V004_promises.sql`

Crée une table `promises` pour stocker les engagements électoraux de chaque élu.

---

## 🚀 Exécuter la Migration

### **Option 1: Avec npm (Recommandé)**

```bash
cd backend
npm run migrate
```

Cela exécutera **toutes les migrations pending** (V001, V002, V003, V004)

### **Option 2: Exécuter une migration spécifique**

```bash
node scripts/run-migration.js V004_promises.sql
```

### **Option 3: Vérifier le statut des migrations**

```bash
npm run migrate:status
```

### **Option 4: Manuellement avec psql**

```bash
psql $DATABASE_URL < backend/src/database/migrations/V004_promises.sql
```

---

## 📊 Schéma de la Table

```sql
CREATE TABLE promises (
  id                SERIAL PRIMARY KEY,
  elu_id            INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,
  titre             VARCHAR(255) NOT NULL,
  description       TEXT,
  status            ENUM ('engagee', 'en_cours', 'completee', 'abandonnee'),
  deadline          DATE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at      TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Colonnes**

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | SERIAL PRIMARY KEY | Auto-incrémenté |
| `elu_id` | INTEGER | Référence vers `elus(id)` |
| `titre` | VARCHAR(255) | Titre de la promesse (requis) |
| `description` | TEXT | Description détaillée (optionnel) |
| `status` | ENUM | État: engagee, en_cours, completee, abandonnee |
| `deadline` | DATE | Date limite (optionnel) |
| `created_at` | TIMESTAMP | Date de création (auto) |
| `completed_at` | TIMESTAMP | Date de complétion (optionnel) |
| `updated_at` | TIMESTAMP | Dernière mise à jour (auto) |

### **Status Possibles**

```
engagee       — Promesse engagée/annoncée
en_cours      — En cours de réalisation
completee     — Complétée avec succès
abandonnee    — Abandonnée/Annulée
```

### **Indexes Créés**

```
idx_promises_elu_id       — Requêtes par élu
idx_promises_status       — Filtrer par statut
idx_promises_deadline     — Requêtes par date limite
idx_promises_created      — Trier par date création
idx_promises_elu_status   — Combo: elu_id + status
```

---

## 🧪 Tester la Migration

### **1. Vérifier la table**

```bash
psql $DATABASE_URL -c "\dt promises"
```

**Résultat attendu:**
```
           List of relations
 Schema |   Name   | Type  | Owner
────────┼──────────┼───────┼───────
 public | promises | table | postgres
(1 row)
```

### **2. Voir la structure**

```bash
psql $DATABASE_URL -c "\d promises"
```

### **3. Exécuter les tests**

```bash
npm test -- __tests__/promises.test.js
```

### **4. Insérer une promesse de test**

```bash
psql $DATABASE_URL << 'EOF'
-- Trouver un élu
SELECT id, nom FROM elus LIMIT 1;

-- Insérer une promesse (remplacer 1 par un vrai elu_id)
INSERT INTO promises (elu_id, titre, description, status, deadline)
VALUES (
  1,
  'Réduire la criminalité de 10%',
  'Plan de sécurité publique renforcée avec 50 agents de plus',
  'en_cours',
  '2026-06-30'::date
);

-- Vérifier
SELECT * FROM promises WHERE elu_id = 1;
EOF
```

---

## 💻 Exemple d'API (À Implémenter)

### **POST /api/v1/elus/:elu_id/promises — Créer une promesse**

```bash
curl -X POST http://localhost:5000/api/v1/elus/1/promises \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Investir 100M$ dans les transports",
    "description": "Modernisation complète du réseau de bus et métro",
    "status": "engagee",
    "deadline": "2027-12-31"
  }'
```

**Réponse (201 Created):**
```json
{
  "id": 1,
  "elu_id": 1,
  "titre": "Investir 100M$ dans les transports",
  "description": "Modernisation complète du réseau de bus et métro",
  "status": "engagee",
  "deadline": "2027-12-31",
  "created_at": "2026-05-10T16:00:00Z",
  "completed_at": null,
  "updated_at": "2026-05-10T16:00:00Z"
}
```

### **GET /api/v1/elus/:elu_id/promises — Lister les promesses d'un élu**

```bash
curl http://localhost:5000/api/v1/elus/1/promises
# Optionnel: filtrer par statut
curl http://localhost:5000/api/v1/elus/1/promises?status=en_cours
```

**Réponse (200 OK):**
```json
[
  {
    "id": 1,
    "elu_id": 1,
    "titre": "Investir 100M$ dans les transports",
    "status": "en_cours",
    "deadline": "2027-12-31"
  },
  {
    "id": 2,
    "elu_id": 1,
    "titre": "Réduire les impôts de 5%",
    "status": "engagee",
    "deadline": "2026-12-31"
  }
]
```

### **GET /api/v1/promises/:id — Détail d'une promesse**

```bash
curl http://localhost:5000/api/v1/promises/1
```

**Réponse (200 OK):**
```json
{
  "id": 1,
  "elu_id": 1,
  "elu_nom": "Jean Dupont",
  "titre": "Investir 100M$ dans les transports",
  "description": "Modernisation complète du réseau de bus et métro",
  "status": "en_cours",
  "deadline": "2027-12-31",
  "created_at": "2026-05-10T16:00:00Z",
  "completed_at": null
}
```

### **PUT /api/v1/promises/:id/status — Mettre à jour le statut**

```bash
curl -X PUT http://localhost:5000/api/v1/promises/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "completee"}'
```

**Réponse (200 OK):**
```json
{
  "id": 1,
  "status": "completee",
  "completed_at": "2026-05-10T18:00:00Z",
  "updated_at": "2026-05-10T18:00:00Z"
}
```

### **DELETE /api/v1/promises/:id — Supprimer une promesse**

```bash
curl -X DELETE http://localhost:5000/api/v1/promises/1
```

**Réponse (204 No Content)**

---

## 📈 Requêtes SQL Utiles

### **Compteur par statut**

```sql
SELECT status, COUNT(*) as count
FROM promises
GROUP BY status
ORDER BY count DESC;
```

### **Promesses expirées**

```sql
SELECT p.*, e.nom
FROM promises p
JOIN elus e ON p.elu_id = e.id
WHERE p.deadline < CURRENT_DATE
  AND p.status IN ('engagee', 'en_cours')
ORDER BY p.deadline ASC;
```

### **Taux de réussite par élu**

```sql
SELECT 
  e.nom,
  COUNT(*) as total,
  COUNT(CASE WHEN p.status = 'completee' THEN 1 END) as completed,
  ROUND(100.0 * COUNT(CASE WHEN p.status = 'completee' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as percentage
FROM elus e
LEFT JOIN promises p ON e.id = p.elu_id
GROUP BY e.id, e.nom
ORDER BY percentage DESC NULLS LAST;
```

### **Élus avec le plus de promesses**

```sql
SELECT 
  e.nom,
  COUNT(*) as promise_count,
  MAX(p.deadline) as latest_deadline
FROM elus e
LEFT JOIN promises p ON e.id = p.elu_id
GROUP BY e.id, e.nom
ORDER BY promise_count DESC
LIMIT 10;
```

---

## ✅ Checklist

- [ ] Migration V004 exécutée (`npm run migrate`)
- [ ] Table `promises` créée avec succès
- [ ] Tous les indexes créés
- [ ] ENUM `promise_status` fonctionnel
- [ ] Foreign key vers `elus` OK
- [ ] Tests passent (`npm test -- __tests__/promises.test.js`)
- [ ] Données de test insérées
- [ ] Routes API créées (optionnel)

---

## 📁 Fichiers Créés

```
✅ backend/src/database/migrations/V004_promises.sql
✅ backend/__tests__/promises.test.js
✅ backend/MIGRATIONS.md
✅ backend/package.json (updated with migrate scripts)
✅ PROMISES_SETUP.md (ce fichier)
```

---

## 🚀 Prochaines Étapes

### **Phase 1: API Routes** (À faire)
- [ ] Route POST pour créer promesse
- [ ] Route GET pour lister
- [ ] Route GET pour détail
- [ ] Route PUT pour mettre à jour statut
- [ ] Route DELETE pour supprimer

### **Phase 2: Frontend** (À faire)
- [ ] Page de gestion des promesses
- [ ] Dashboard de suivi
- [ ] Notifications de deadline
- [ ] Statistiques

### **Phase 3: Integration** (À faire)
- [ ] Linking avec PDE (promises des députés)
- [ ] Notifications aux citoyens
- [ ] Historique des changements

---

## 📞 Support

Pour plus de détails:
- Lire: `backend/MIGRATIONS.md`
- Regarder: `backend/__tests__/promises.test.js`
- Schéma: `backend/src/database/migrations/V004_promises.sql`

---

**Prêt à suivre les promesses électorales ! 🎯**
