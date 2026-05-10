# 🧪 Guide de Test du Backend - Citoyen Avisé

**Date** : 2026-05-10  
**Backend Port** : 5000  
**API Base** : http://localhost:5000/api/v1

---

## 🚀 Démarrage du Backend

### Option 1: Mode Développement (avec auto-reload)
```bash
cd backend
npm install  # Si nécessaire
npm run dev
# → Serveur sur http://localhost:5000
# → Auto-reload activé avec nodemon
```

### Option 2: Mode Production
```bash
cd backend
npm start
# → Serveur sur http://localhost:5000
```

### Attendre que le serveur démarre (~5 secondes)
Vous devriez voir:
```
╔════════════════════════════════════════╗
║  Citoyen Avisé - Backend API           ║
╠════════════════════════════════════════╣
║  Service: citoyenavise-backend         ║
║  Environnement: development            ║
║  Port: 5000                            ║
║  URL: http://localhost:5000            ║
```

---

## ✅ Tests des Endpoints

### 1️⃣ Health Check

**Test basique de santé du serveur**

```bash
curl -v http://localhost:5000/api/v1/health
```

**Résultat attendu (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-10T...",
  "uptime": 25,
  "service": "citoyenavise-backend",
  "version": "1.0.0",
  "database": "connected",
  "cache": "ready"
}
```

**Vérifications**:
- ✅ Code HTTP: 200
- ✅ `status`: "healthy"
- ✅ `database`: "connected"

---

### 2️⃣ Lister les Élus

**Endpoint public - Récupérer la liste des élus**

```bash
# Sans filtres (tous les élus)
curl http://localhost:5000/api/v1/elus

# Avec limite
curl http://localhost:5000/api/v1/elus?limit=10

# Par niveau
curl http://localhost:5000/api/v1/elus?level=federal

# Par région
curl http://localhost:5000/api/v1/elus?region=Quebec

# Recherche full-text
curl "http://localhost:5000/api/v1/elus/search?q=Francois"
```

**Résultat attendu (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "firstName": "François",
      "lastName": "Legault",
      "title": "Premier Ministre",
      "level": "provincial",
      "region": "Quebec",
      "latitude": 45.5017,
      "longitude": -73.5673,
      "transparency_score": 75,
      "promises_count": 15,
      "fulfilled_count": 10
    },
    ...
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

**Vérifications**:
- ✅ Code HTTP: 200
- ✅ `success`: true
- ✅ `data`: array d'élus
- ✅ Chaque élu a: id, firstName, lastName, title, level, region, latitude, longitude

---

### 3️⃣ Détail d'un Élu

**Récupérer les informations détaillées d'un élu**

```bash
# Remplacer UUID-123 par un vrai ID retourné par l'endpoint précédent
curl http://localhost:5000/api/v1/elus/UUID-123
```

**Résultat attendu (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "UUID-123",
    "firstName": "François",
    "lastName": "Legault",
    "title": "Premier Ministre",
    "level": "provincial",
    "region": "Quebec",
    "email": "francois.legault@assnat.qc.ca",
    "phone": "418-643-5000",
    "party": "Parti québécois",
    "latitude": 45.5017,
    "longitude": -73.5673,
    "transparency_score": 75,
    "promises": [
      {
        "id": "promise-1",
        "text": "Créer 10,000 emplois",
        "status": "in_progress",
        "deadline": "2027-12-31"
      }
    ]
  }
}
```

---

### 4️⃣ Promesses d'un Élu

**Récupérer les promesses électorales d'un élu spécifique**

```bash
curl http://localhost:5000/api/v1/elus/UUID-123/promises

# Avec filtrage par statut
curl "http://localhost:5000/api/v1/elus/UUID-123/promises?status=fulfilled"

# Avec pagination
curl "http://localhost:5000/api/v1/elus/UUID-123/promises?page=1&limit=10"
```

**Résultat attendu (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "promise-1",
      "eluId": "UUID-123",
      "text": "Réduire les impôts de 5%",
      "category": "économie",
      "status": "fulfilled",
      "deadline": "2025-12-31",
      "progress": 100,
      "description": "Baisse d'impôt provincial appliquée"
    },
    {
      "id": "promise-2",
      "eluId": "UUID-123",
      "text": "Augmenter le financement de la santé",
      "category": "santé",
      "status": "in_progress",
      "deadline": "2026-06-30",
      "progress": 45,
      "description": "Augmentation de 10% en cours de déploiement"
    }
  ],
  "total": 15,
  "statuses": {
    "fulfilled": 10,
    "in_progress": 4,
    "broken": 1
  }
}
```

---

### 5️⃣ Authentification Magic Link

**Demander un lien de connexion magique**

```bash
# Étape 1: Demander le magic link
curl -X POST http://localhost:5000/api/v1/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Résultat attendu (200 OK)**:
```json
{
  "success": true,
  "message": "Magic link envoyé à test@example.com",
  "email": "test@example.com",
  "expiresIn": 900
}
```

**Note**: En développement, un lien de test est généré. En production, il est envoyé par email.

---

### 6️⃣ Vérifier Magic Link

**Vérifier et utiliser le token magic link**

```bash
# Remplacer MAGIC_TOKEN par le token reçu (en dev, généré dans la réponse)
curl http://localhost:5000/api/v1/auth/verify?token=MAGIC_TOKEN

# OU avec POST
curl -X POST http://localhost:5000/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"MAGIC_TOKEN"}'
```

**Résultat attendu (200 OK)**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "user-uuid",
    "email": "test@example.com",
    "role": "user",
    "createdAt": "2026-05-10T..."
  },
  "expiresIn": 604800
}
```

---

### 7️⃣ Utiliser le JWT Token

**Endpoints protégés - Utiliser le token JWT reçu**

```bash
# Remplacer ACCESSTOKEN par le token reçu
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Obtenir les infos de l'utilisateur actuel
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/auth/me

# Créer une pétition
curl -X POST http://localhost:5000/api/v1/petitions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pour une meilleure éducation",
    "description": "Augmenter le financement de l'éducation",
    "targetSignatures": 10000
  }'

# Signer une pétition
curl -X POST http://localhost:5000/api/v1/petitions/petition-uuid/sign \
  -H "Authorization: Bearer $TOKEN"
```

---

### 8️⃣ Actualités

**Lister les actualités du système**

```bash
# Toutes les actualités
curl http://localhost:5000/api/v1/actualites

# Avec pagination
curl "http://localhost:5000/api/v1/actualites?page=1&limit=10"

# Recherche
curl "http://localhost:5000/api/v1/actualites/search?q=election"
```

**Résultat attendu (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "actualite-1",
      "title": "Nouvelle loi adoptée",
      "content": "L'assemblée nationale a adopté...",
      "published": true,
      "publishedAt": "2026-05-09T...",
      "createdAt": "2026-05-09T..."
    }
  ],
  "total": 42
}
```

---

### 9️⃣ Test Rate Limiting

**Vérifier que le rate limiting fonctionne**

```bash
# Effectuer 10 requêtes rapides
for i in {1..10}; do
  echo "Requête $i:"
  curl -i http://localhost:5000/api/v1/health 2>/dev/null | grep -E "HTTP|X-RateLimit"
  sleep 0.1
done
```

**Résultat attendu**:
- ✅ Requêtes 1-5: HTTP 200 (OK)
- ✅ Requête 6+: HTTP 429 (Too Many Requests)
- ✅ Headers incluent:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: decreasing`
  - `X-RateLimit-Reset: timestamp`

---

### 🔟 Test Security Headers

**Vérifier les headers de sécurité HTTP**

```bash
# Requête HEAD pour voir les headers
curl -I http://localhost:5000

# Ou avec curl -v pour plus de détails
curl -v http://localhost:5000 2>&1 | grep -E "X-|Content-Security|Strict-Transport"
```

**Résultat attendu**:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=15552000; includeSubDomains
Content-Security-Policy: ...
```

**Vérifications**:
- ✅ `X-Frame-Options`: DENY (prévient les clickjacking)
- ✅ `X-Content-Type-Options`: nosniff (prévient le MIME sniffing)
- ✅ `X-XSS-Protection`: activé
- ✅ `Referrer-Policy`: strict-origin-when-cross-origin
- ✅ `Permissions-Policy`: restrictif
- ✅ `Content-Security-Policy`: présent

---

## 📝 Test Complet Séquentiel

Pour tester l'application complètement, exécutez cette séquence:

```bash
#!/bin/bash

# Attendre que le serveur soit prêt
sleep 3

echo "=== Test 1: Health Check ==="
curl -s http://localhost:5000/api/v1/health | jq .

echo -e "\n=== Test 2: Lister les élus ==="
curl -s http://localhost:5000/api/v1/elus?limit=3 | jq '.data | length'

echo -e "\n=== Test 3: Détail élu ==="
ELU_ID=$(curl -s http://localhost:5000/api/v1/elus?limit=1 | jq -r '.data[0].id')
curl -s http://localhost:5000/api/v1/elus/$ELU_ID | jq '.data.firstName'

echo -e "\n=== Test 4: Promesses de l'élu ==="
curl -s http://localhost:5000/api/v1/elus/$ELU_ID/promises | jq '.total'

echo -e "\n=== Test 5: Magic Link ==="
RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}')
echo $RESPONSE | jq .

echo -e "\n=== Test 6: Headers de sécurité ==="
curl -I http://localhost:5000 2>/dev/null | grep -E "X-Frame|X-Content|Content-Security"

echo -e "\n=== Test 7: Rate Limiting ==="
for i in {1..6}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/v1/health)
  echo "Requête $i: HTTP $HTTP_CODE"
  sleep 0.2
done

echo -e "\n✅ Tests complétés!"
```

---

## 🐛 Troubleshooting

### Erreur: "Connection refused"
```
curl: (7) Failed to connect to localhost port 5000: Connection refused
```
**Solution**: 
- Vérifier que le backend a bien démarré
- Vérifier le port: `netstat -tuln | grep 5000`
- Attendre quelques secondes supplémentaires

### Erreur: "Database connection failed"
```
Error: Unable to connect to database
```
**Solution**:
- Vérifier que PostgreSQL est en cours d'exécution
- Vérifier DATABASE_URL dans .env
- Exécuter: `npm run migrate`

### Erreur: "JWT_SECRET not defined"
**Solution**:
- Créer un fichier .env dans le dossier backend
- Ajouter: `JWT_SECRET=your-secret-key-here`
- Redémarrer le serveur

### Headers CORS manquants
**Solution**:
- Vérifier que le frontend est sur `http://localhost:3001`
- Ajuster CORS_ORIGIN dans .env si nécessaire
- Les requests depuis curl n'ont généralement pas besoin de CORS

---

## 📊 Mesures de Performance

Pour mesurer les temps de réponse:

```bash
# Utiliser curl -w pour les timings
curl -w "\n
    DNS lookup:    %{time_namelookup}s\n
    TCP connect:   %{time_connect}s\n
    First byte:    %{time_starttransfer}s\n
    Total time:    %{time_total}s\n" \
  http://localhost:5000/api/v1/health

# Ou utiliser ab (Apache Bench) pour load testing
ab -n 100 -c 10 http://localhost:5000/api/v1/health
```

**Résultat attendu**:
- DNS lookup: < 10ms
- TCP connect: < 5ms
- First byte: < 50ms
- Total time: < 100ms

---

## ✅ Checklist de Vérification

- [ ] Backend démarre sans erreurs
- [ ] Health endpoint répond (200 OK)
- [ ] Élus endpoint retourne des données
- [ ] Détail élu accessible
- [ ] Promesses listées correctement
- [ ] Magic link fonctionnelle
- [ ] JWT token validé
- [ ] Rate limiting actif
- [ ] Headers de sécurité présents
- [ ] Pas d'erreurs CORS
- [ ] Database connectée
- [ ] Tests passent (npm test)

---

**Généré** : 2026-05-10  
**Status** : ✅ **READY FOR TESTING**
