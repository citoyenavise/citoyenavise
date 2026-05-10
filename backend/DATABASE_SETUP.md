# Guide d'Initialisation Base de Données — Citoyen Avisé

## 📦 Prérequis

- PostgreSQL 12+ installé et en cours d'exécution
- PostGIS extension disponible
- Accès psql en ligne de commande

---

## 🚀 Étapes d'Initialisation

### 1. Créer la Base de Données

```bash
# Créer la base de données principale
createdb citoyenavise_dev

# Optionnel : créer une base de données de test
createdb citoyenavise_test
```

### 2. Activer PostGIS

```bash
# Pour la base de développement
psql citoyenavise_dev -c "CREATE EXTENSION postgis;"

# Pour la base de test (optionnel)
psql citoyenavise_test -c "CREATE EXTENSION postgis;"
```

### 3. Appliquer les Migrations

Les migrations **doivent être exécutées dans cet ordre** :

```bash
# 1. Création de la table users (authentification)
psql citoyenavise_dev < backend/src/migrations/001_create_users.sql

# 2. Création de la table elus
psql citoyenavise_dev < backend/src/migrations/002_create_elus.sql

# 3. Création de la table circonscriptions
psql citoyenavise_dev < backend/src/migrations/003_create_circonscriptions.sql

# 4. Création de la table petitions
psql citoyenavise_dev < backend/src/migrations/004_create_petitions.sql

# 5. Création de la table elu_commitments
psql citoyenavise_dev < backend/src/migrations/005_create_elu_commitments.sql
```

### 4. Vérifier les Tables

```bash
# Lister toutes les tables
psql citoyenavise_dev -c "\dt"

# Vérifier une table spécifique
psql citoyenavise_dev -c "\d users"
```

---

## 📋 Structure des Tables

### users
```
Colonnes: id, email (UNIQUE), nom_complet, province, code_postal, 
          created_at, verified_at, updated_at
Relations: 
  - email_verifications (1-N)
  - login_audits (1-N)
  - petition_signatures (N-N via citoyen_id)
  - petition_updates (1-N via author_id)
  - petition_comments (1-N via author_id)
  - commitment_tracking (N-N via citoyen_id)
  - commitment_updates (1-N via author_id)
```

### elus
```
Colonnes: id, nom_complet, titre (VARCHAR), région, niveau, email, 
          photo_url, site_web, created_at, updated_at
Relations:
  - elus_contacts (1-N)
  - elus_social_media (1-N)
  - petitions (1-N via elu_id)
  - elu_commitments (1-N via elu_id)
  - circonscriptions (N-N via elus_ids ARRAY)
```

### circonscriptions
```
Colonnes: id, nom, niveau, code_postal_ids (BIGINT[]), elus_ids (INTEGER[]),
          géométrie (PostGIS geometry), created_at, updated_at
Relations:
  - code_postal_circonscription (1-N)
  - circonscription_history (1-N)
  - petitions (M-1 via implied)
```

### petitions
```
Colonnes: id, titre, description, citoyen_id (FK → users), 
          elu_id (FK → elus, nullable), status (enum), signatures_count,
          created_at, deadline (nullable), updated_at
Status: 'draft' | 'published' | 'closed' | 'won'
Relations:
  - petition_signatures (1-N)
  - petition_updates (1-N)
  - petition_comments (1-N)
```

### elu_commitments
```
Colonnes: id, elu_id (FK → elus), titre, description, status (enum),
          deadline (nullable), created_at, completed_at (nullable), updated_at
Status: 'engagée' | 'en cours' | 'complétée' | 'abandonnée'
Relations:
  - commitment_updates (1-N)
  - commitment_tracking (1-N)
```

---

## 🔄 Migrations Disponibles

| Migration | Description | Tables Créées |
|-----------|-------------|--------------|
| 001 | Users & Auth | users, email_verifications, login_audits |
| 002 | Élus | elus, elus_contacts, elus_social_media |
| 003 | Circonscriptions | circonscriptions, code_postal_circonscription, circonscription_history |
| 004 | Pétitions | petitions, petition_signatures, petition_updates, petition_comments |
| 005 | Engagements Élus | elu_commitments, commitment_updates, commitment_tracking |

---

## ✅ Vérification Post-Installation

### Vérifier PostGIS
```bash
psql citoyenavise_dev -c "SELECT PostGIS_Version();"
# Doit retourner la version de PostGIS
```

### Vérifier les Extensions
```bash
psql citoyenavise_dev -c "\dx"
# Doit afficher : postgis | <version> | ...
```

### Vérifier les Tables
```bash
psql citoyenavise_dev -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
# Devrait afficher environ 15 tables
```

### Vérifier les Indexes
```bash
psql citoyenavise_dev -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' LIMIT 10;"
```

### Vérifier les Constraints
```bash
psql citoyenavise_dev -c "SELECT constraint_name FROM information_schema.table_constraints WHERE table_schema = 'public';"
```

---

## 🔧 Commandes Utiles

### Dumper la base de données (backup)
```bash
pg_dump citoyenavise_dev > backup_citoyenavise_dev.sql
```

### Restaurer depuis un backup
```bash
psql citoyenavise_dev < backup_citoyenavise_dev.sql
```

### Réinitialiser la base de données (⚠️ destructif)
```bash
dropdb citoyenavise_dev
createdb citoyenavise_dev
psql citoyenavise_dev -c "CREATE EXTENSION postgis;"
# Puis réappliquer les migrations
```

### Vérifier les connexions PostgreSQL
```bash
# Linux/Mac
psql -U postgres -c "SELECT datname FROM pg_database WHERE datname = 'citoyenavise_dev';"

# Windows
psql -U postgres -c "SELECT datname FROM pg_database WHERE datname = 'citoyenavise_dev';"
```

### Visualiser les données
```bash
# Voir tous les utilisateurs
psql citoyenavise_dev -c "SELECT * FROM users;"

# Voir toutes les pétitions avec le nom du créateur
psql citoyenavise_dev -c "
  SELECT p.id, p.titre, u.nom_complet, p.status, p.signatures_count
  FROM petitions p
  JOIN users u ON p.citoyen_id = u.id
  ORDER BY p.created_at DESC;"

# Voir les engagements par élu
psql citoyenavise_dev -c "
  SELECT e.nom_complet, COUNT(ec.id) as nb_engagements
  FROM elu_commitments ec
  JOIN elus e ON ec.elu_id = e.id
  GROUP BY e.nom_complet;"
```

---

## 🚨 Résolution de Problèmes

### PostgreSQL n'est pas accessible
```bash
# Vérifier le statut de PostgreSQL
# Linux
sudo systemctl status postgresql

# Mac
brew services list | grep postgres

# Windows
# Vérifier dans Services (services.msc)
```

### Extension PostGIS non disponible
```bash
# Installer PostGIS (si nécessaire)
# Linux (Ubuntu/Debian)
sudo apt-get install postgresql-postgis

# Mac
brew install postgis

# Windows
# Télécharger depuis https://postgis.net/windows/
```

### Permission Refusée
```bash
# Vérifier les permissions de l'utilisateur PostgreSQL
psql -U postgres citoyenavise_dev -c "SELECT current_user;"

# Si nécessaire, changer le propriétaire de la base
psql -U postgres -c "ALTER DATABASE citoyenavise_dev OWNER TO your_user;"
```

### Table existe déjà
```bash
# Si une migration a partiellement échoué, il peut rester des tables
# Vérifier les tables existantes
psql citoyenavise_dev -c "\dt"

# Supprimer une table si nécessaire
psql citoyenavise_dev -c "DROP TABLE table_name CASCADE;"
```

---

## 📊 Performance

### Créer des indexes supplémentaires (optionnel)
```bash
# Full-text search en français
psql citoyenavise_dev -c "CREATE INDEX idx_petitions_titre_fts ON petitions USING GIN(to_tsvector('french', titre));"

# Géolocalisation
psql citoyenavise_dev -c "CREATE INDEX idx_circonscriptions_geom ON circonscriptions USING GIST(géométrie);"
```

### Vérifier les stats des tables
```bash
psql citoyenavise_dev -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

---

## 🔒 Sécurité

### Créer un utilisateur application (recommandé pour production)
```bash
# Créer un nouvel utilisateur
psql -U postgres -c "CREATE USER citoyenavise_app WITH PASSWORD 'strong_password';"

# Donner les permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE citoyenavise_dev TO citoyenavise_app;"

# Dans votre .env
DATABASE_URL=postgresql://citoyenavise_app:strong_password@localhost:5432/citoyenavise_dev
```

### Restreindre les accès à la base de données
Éditer le fichier `postgresql.conf` :
```
# Écouter seulement en local
listen_addresses = 'localhost'
```

---

## 📚 Documentation Complète

Pour des détails sur les schémas complets, voir :
- [Migration 001 — Users](../src/migrations/001_create_users.sql)
- [Migration 002 — Élus](../src/migrations/002_create_elus.sql)
- [Migration 003 — Circonscriptions](../src/migrations/003_create_circonscriptions.sql)
- [Migration 004 — Pétitions](../src/migrations/004_create_petitions.sql)
- [Migration 005 — Engagements Élus](../src/migrations/005_create_elu_commitments.sql)
