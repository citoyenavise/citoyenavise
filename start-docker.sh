#!/bin/bash

# 🚀 Script de démarrage Docker — Citoyenavise PHASE 1
# Usage: ./start-docker.sh [dev|prod]

set -e

MODE=${1:-dev}
ENV_FILE=".env.docker"

echo "🚀 Citoyenavise - Démarrage Docker Mode: $MODE"
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker n'est pas installé"
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo "❌ Docker Compose n'est pas installé"
  exit 1
fi

# Créer .env.docker s'il n'existe pas
if [ ! -f "$ENV_FILE" ]; then
  echo "📝 Création $ENV_FILE..."
  cat > "$ENV_FILE" << 'ENVEOF'
# Docker Compose Environment
NODE_ENV=development
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=citoyenavise_dev
DB_HOST=postgres
DB_PORT=5432
REDIS_PASSWORD=password

# Backend
JWT_SECRET=dev_secret_key_min_32_chars_change_in_prod_abc123def456
JWT_REFRESH_SECRET=dev_refresh_secret_key_min_32_chars_abc123def456_DIFFERENT
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://localhost:8000

# Logging
LOG_LEVEL=debug

# pgAdmin
PGADMIN_EMAIL=admin@citoyenavise.local
PGADMIN_PASSWORD=admin
ENVEOF
  echo "✅ $ENV_FILE créé"
fi

# Mode développement
if [ "$MODE" = "dev" ]; then
  echo "🔧 Mode DÉVELOPPEMENT"
  echo ""

  echo "📦 Démarrage services..."
  docker-compose up -d postgres redis

  echo "⏳ Attente PostgreSQL healthy (15-30s)..."
  until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
    echo "  ⏳ En attente..."
  done
  echo "✅ PostgreSQL prêt"

  echo ""
  echo "📦 Démarrage backend..."
  docker-compose up -d backend

  echo "⏳ Attente Backend ready (10-20s)..."
  for i in {1..30}; do
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
      echo "✅ Backend prêt"
      break
    fi
    sleep 1
  done

  echo ""
  echo "📦 Démarrage frontend..."
  docker-compose up -d frontend

  echo ""
  echo "🎉 Services démarrés!"
  echo ""
  echo "📍 Accès:"
  echo "   Backend:  http://localhost:5000"
  echo "   Frontend: http://localhost:3000"
  echo "   API:      http://localhost:5000/api/v1/..."
  echo ""
  echo "🗄️  Migrations:"
  docker-compose exec backend npm run migrate:status
  echo ""

fi

# Mode production
if [ "$MODE" = "prod" ]; then
  echo "🚀 Mode PRODUCTION"

  # Validation des secrets
  if [ -z "$JWT_SECRET" ] || [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "❌ JWT_SECRET et JWT_REFRESH_SECRET doivent être définis"
    exit 1
  fi

  echo "📦 Build + démarrage services..."
  docker-compose up -d --build

  echo "✅ Services en prod"
  echo ""
  echo "📍 Accès:"
  echo "   Backend:  http://localhost:5000"
  echo "   Frontend: http://localhost:3000"
  echo ""
fi

echo ""
echo "📝 Logs: docker-compose logs -f"
echo "🛑 Arrêt: docker-compose down"
echo ""
