# Scripts — Citoyen Avisé Backend

## 🚀 Setup Base de Données

### Linux / macOS
```bash
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh [DB_NAME] [DB_USER]

# Exemple
./scripts/setup-db.sh citoyenavise_dev postgres
```

### Windows (PowerShell)
```powershell
.\scripts\setup-db.ps1 -DbName citoyenavise_dev -DbUser postgres

# Ou avec les defaults
.\scripts\setup-db.ps1
```

---

## 📋 Ce que le script fait

1. ✅ **Drop** la base de données existante (optionnel)
2. ✅ **Create** la base de données
3. ✅ **Enable** PostGIS extension (pour geolocation)
4. ✅ **Apply** toutes les migrations dans l'ordre:
   - 001_create_users.sql
   - 002_create_elus.sql
   - 003_create_circonscriptions.sql
   - 004_create_petitions.sql
   - 005_create_elu_commitments.sql
   - 006_create_posts.sql
5. ✅ **Verify** les tables créées
6. ✅ **Show** les statistiques

---

## ✅ Configuration .env

Après le setup, configure `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/citoyenavise_dev
JWT_SECRET=your-secret-key-min-32-chars
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 🚀 Démarrer le serveur

```bash
npm install
npm run dev
```

Le serveur est disponible à: `http://localhost:5000`

---

## 🧪 Tests

```bash
# Tous les tests
npm test

# Mode watch
npm run test:watch

# Couverture
npm run test:coverage
```

---

## 📚 Documentation

- `DATABASE_SETUP.md` — Guide d'initialisation manuelle
- `API_FRENCH_ROUTES.md` — Routes API avec noms français
- `TESTING.md` — Guide de testing avec Jest
- `ENDPOINTS_TESTING_GUIDE.md` — Exemples curl

---

## 🔧 Troubleshooting

### PostgreSQL not found
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql@15

# Windows
# Télécharger depuis https://www.postgresql.org/download/
```

### Permission denied (setup-db.sh)
```bash
chmod +x scripts/setup-db.sh
```

### Database already exists
```bash
dropdb citoyenavise_dev
./scripts/setup-db.sh
```

### FATAL: Ident authentication failed
```bash
# Vérifier pg_hba.conf ou utiliser -U postgres
./scripts/setup-db.sh citoyenavise_dev postgres
```

---

## 📞 Support

- Tests: `npm test`
- Logs: Voir `npm run dev` output
- Database: `psql citoyenavise_dev`
