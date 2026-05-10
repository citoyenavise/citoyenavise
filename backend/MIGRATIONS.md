# 🔄 Database Migrations — Citoyen Avisé

**Guide pour exécuter les migrations SQL**

---

## 📋 Migrations Existantes

| Version | Fichier | Description |
|---------|---------|-------------|
| V001 | `V001_initial_schema.sql` | Schema initial (users, posts, comments, etc) |
| V002 | `V002_add_performance_indexes.sql` | Indexes pour performance |
| V003 | `V003_public_data_engine.sql` | Public Data Engine (datasets, entities, attachments) |
| **V004** | **`V004_promises.sql`** | **Promesses électorales (NEW)** |

---

## 🚀 Exécuter la Nouvelle Migration

### **Option 1: Avec Node.js (Recommandé)**

```bash
cd backend

# Exécuter la migration V004
node scripts/run-migration.js V004_promises.sql
```

**Résultat attendu:**
```
✨ Migration executed successfully!
   File: V004_promises.sql
   Time: 45ms
```

### **Option 2: Avec npm script**

```bash
# Exécuter toutes les migrations pending
npm run migrate

# Voir le status
npm run migrate:status
```

### **Option 3: Avec psql (ligne de commande)**

```bash
# Directement depuis le fichier SQL
psql $DATABASE_URL -f backend/src/database/migrations/V004_promises.sql

# Ou copier-coller le contenu
psql $DATABASE_URL << 'EOF'
CREATE TYPE promise_status AS ENUM ('engagee', 'en_cours', 'completee', 'abandonnee');

CREATE TABLE promises (
  id SERIAL PRIMARY KEY,
  elu_id INTEGER NOT NULL REFERENCES elus(id) ON DELETE CASCADE,
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  status promise_status DEFAULT 'engagee',
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promises_elu_id ON promises(elu_id);
CREATE INDEX idx_promises_status ON promises(status);
CREATE INDEX idx_promises_deadline ON promises(deadline);
CREATE INDEX idx_promises_elu_status ON promises(elu_id, status);
EOF
```

---

## 📊 Schéma V004 — Promesses Électorales

### **Table: `promises`**

```sql
Column          | Type                      | Notes
────────────────┼──────────────────────────┼──────────────────
id              | SERIAL PRIMARY KEY        | Auto-increment
elu_id          | INTEGER (FK)              | References elus(id)
titre           | VARCHAR(255)              | Required, non-empty
description     | TEXT                      | Optional
status          | promise_status ENUM       | See below
deadline        | DATE                      | Optional
created_at      | TIMESTAMP                 | Auto-set
completed_at    | TIMESTAMP                 | When completed
updated_at      | TIMESTAMP                 | Auto-update
```

### **ENUM: `promise_status`**

```
engagee       — Promesse engagée/annoncée
en_cours      — En cours de réalisation
completee     — Complétée avec succès
abandonnee    — Abandonnée/Annulée
```

### **Indexes**

```
idx_promises_elu_id       — Find promises for an elected official
idx_promises_status       — Filter by status
idx_promises_deadline     — Find upcoming/overdue promises
idx_promises_created      — Order by creation date
idx_promises_elu_status   — Combined query: elu_id + status
```

---

## 🧪 Test de la Migration

### **1. Vérifier la table a été créée**

```bash
psql $DATABASE_URL -c "\dt promises"
```

**Résultat attendu:**
```
           List of relations
 Schema |   Name   | Type  | Owner
────────┼──────────┼───────┼───────
 public | promises | table | user
```

### **2. Vérifier la structure**

```bash
psql $DATABASE_URL -c "\d promises"
```

**Résultat attendu:**
```
                                    Table "public.promises"
    Column    |            Type             | Collation | Nullable |              Default
──────────────┼─────────────────────────────┼───────────┼──────────┼──────────────────────
 id           | integer                     |           | not null | nextval('promises_id_seq'::regclass)
 elu_id       | integer                     |           | not null |
 titre        | character varying(255)      |           | not null |
 description  | text                        |           |          |
 status       | promise_status              |           |          | 'engagee'::promise_status
 deadline     | date                        |           |          |
 created_at   | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 completed_at | timestamp without time zone |           |          |
 updated_at   | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "promises_pkey" PRIMARY KEY, btree (id)
    "idx_promises_elu_id" btree (elu_id)
    "idx_promises_status" btree (status)
    "idx_promises_deadline" btree (deadline)
    "idx_promises_created" btree (created_at DESC)
    "idx_promises_elu_status" btree (elu_id, status)
Foreign-key constraints:
    "promises_elu_id_fkey" FOREIGN KEY (elu_id) REFERENCES elus(id) ON DELETE CASCADE
```

### **3. Insérer une promesse de test**

```bash
psql $DATABASE_URL << 'EOF'
-- Trouver un élu
SELECT id, nom FROM elus LIMIT 1;

-- Insérer une promesse de test (remplacer elu_id par un vrai ID)
INSERT INTO promises (elu_id, titre, description, status, deadline)
VALUES (
  1,
  'Augmenter le financement de l''éducation',
  'Augmenter le budget de l''éducation de 10% d''ici 2026',
  'en_cours',
  '2026-12-31'::date
);

-- Vérifier
SELECT * FROM promises WHERE elu_id = 1;
EOF
```

**Résultat attendu:**
```
 id | elu_id |          titre           |        description         | status  |  deadline  |      created_at
────┼────────┼──────────────────────────┼────────────────────────────┼─────────┼────────────┼──────────────────────
  1 |      1 | Augmenter le finance ... | Augmenter le budget de ... | en_cours | 2026-12-31 | 2026-05-10 15:45:00
```

---

## 📝 Utiliser la Table Promises dans l'API

### **Créer une promesse**

```javascript
import { pool } from './database.js';

app.post('/api/v1/elus/:elu_id/promises', async (req, res) => {
  const { titre, description, deadline, status } = req.body;
  const { elu_id } = req.params;

  const query = `
    INSERT INTO promises (elu_id, titre, description, deadline, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const result = await pool.query(query, [
    elu_id,
    titre,
    description,
    deadline,
    status || 'engagee'
  ]);

  res.status(201).json(result.rows[0]);
});
```

### **Lister les promesses d'un élu**

```javascript
app.get('/api/v1/elus/:elu_id/promises', async (req, res) => {
  const { elu_id } = req.params;
  const { status } = req.query;

  let query = 'SELECT * FROM promises WHERE elu_id = $1';
  const params = [elu_id];

  if (status) {
    query += ' AND status = $2';
    params.push(status);
  }

  query += ' ORDER BY deadline ASC';

  const result = await pool.query(query, params);
  res.json(result.rows);
});
```

### **Obtenir une promesse**

```javascript
app.get('/api/v1/promises/:id', async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    'SELECT p.*, e.nom as elu_nom FROM promises p JOIN elus e ON p.elu_id = e.id WHERE p.id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Promise not found' });
  }

  res.json(result.rows[0]);
});
```

### **Mettre à jour le statut**

```javascript
app.put('/api/v1/promises/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const completedAt = status === 'completee' ? new Date() : null;

  const result = await pool.query(
    `UPDATE promises 
     SET status = $1, completed_at = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [status, completedAt, id]
  );

  res.json(result.rows[0]);
});
```

---

## 🔄 Rollback (si nécessaire)

### **Supprimer la table (attention!)**

```bash
psql $DATABASE_URL << 'EOF'
DROP TABLE IF EXISTS promises;
DROP TYPE IF EXISTS promise_status;

DELETE FROM schema_versions WHERE version_number = 4;
EOF
```

---

## 📊 Requêtes Utiles

### **Compteur par statut**

```sql
SELECT status, COUNT(*) as count
FROM promises
GROUP BY status
ORDER BY count DESC;
```

### **Promesses expirées (deadline passée)**

```sql
SELECT p.*, e.nom
FROM promises p
JOIN elus e ON p.elu_id = e.id
WHERE p.deadline < CURRENT_DATE
  AND p.status != 'completee'
ORDER BY p.deadline ASC;
```

### **Promesses par région**

```sql
SELECT 
  e.region,
  COUNT(*) as total_promises,
  COUNT(CASE WHEN p.status = 'completee' THEN 1 END) as completed,
  ROUND(100.0 * COUNT(CASE WHEN p.status = 'completee' THEN 1 END) / COUNT(*), 2) as completion_rate
FROM promises p
JOIN elus e ON p.elu_id = e.id
GROUP BY e.region
ORDER BY completion_rate DESC;
```

### **Élus avec le plus de promesses**

```sql
SELECT 
  e.nom,
  COUNT(*) as promise_count,
  COUNT(CASE WHEN p.status = 'completee' THEN 1 END) as completed
FROM elus e
LEFT JOIN promises p ON e.id = p.elu_id
GROUP BY e.id, e.nom
ORDER BY promise_count DESC
LIMIT 10;
```

---

## ✅ Checklist Après Migration

- [ ] Migration V004 exécutée sans erreur
- [ ] Table `promises` créée
- [ ] Tous les indexes créés
- [ ] ENUM `promise_status` créé
- [ ] Foreign key vers `elus` OK
- [ ] Données de test insérées
- [ ] Routes API créées
- [ ] Tests écrits

---

## 📞 Troubleshooting

### **Error: "relation 'promises' does not exist"**

```bash
# Vérifier si la table existe
psql $DATABASE_URL -c "\dt promises"

# Si non, exécuter la migration
npm run migrate
# ou
node scripts/run-migration.js V004_promises.sql
```

### **Error: "type 'promise_status' does not exist"**

```bash
# Vérifier si l'ENUM existe
psql $DATABASE_URL -c "\dT promise_status"

# Si non, créer manuellement
psql $DATABASE_URL -c "CREATE TYPE promise_status AS ENUM ('engagee', 'en_cours', 'completee', 'abandonnee');"
```

### **Error: "cannot truncate table 'promises'"**

```bash
# Vider les données mais garder la table
TRUNCATE TABLE promises;

# Ou supprimer et recréer
DROP TABLE promises;
npm run migrate
```

---

**Migration V004 — Promesses Électorales — Ready! ✅**
