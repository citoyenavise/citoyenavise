#!/bin/bash

# 🚀 Script de démarrage PostgreSQL Local — Citoyenavise PHASE 1
# Prérequis: PostgreSQL 14+, Node.js 18+
# Usage: ./start-local.sh [db|backend|frontend|all]

set -e

ACTION=${1:-all}

echo "🚀 Citoyenavise - PostgreSQL Local Mode: $ACTION"
echo ""

# Vérifier PostgreSQL
if ! command -v psql &> /dev/null; then
  echo "❌ PostgreSQL n'est pas installé ou non dans PATH"
  echo "   Installation: https://www.postgresql.org/download"
  exit 1
fi

# Vérifier Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js n'est pas installé"
  exit 1
fi

# ============================================
# ACTION: Créer base de données
# ============================================
if [ "$ACTION" = "db" ] || [ "$ACTION" = "all" ]; then
  echo "🗄️  Création base de données..."

  # Créer DB
  createdb citoyenavise_dev 2>/dev/null || echo "  ℹ️  DB citoyenavise_dev existe déjà"

  # Copier .env
  if [ ! -f "backend/.env" ]; then
    echo "📝 Création backend/.env..."
    cp backend/.env.example backend/.env
    echo "✅ backend/.env créé"
    echo "   ⚠️  À personnaliser si nécessaire"
  fi

  echo "✅ Base de données prêt"
  echo ""
fi

# ============================================
# ACTION: Démarrer Backend
# ============================================
if [ "$ACTION" = "backend" ] || [ "$ACTION" = "all" ]; then
  echo "📦 Démarrage Backend..."

  cd backend

  # Install deps
  if [ ! -d "node_modules" ]; then
    echo "📥 npm install..."
    npm install
  fi

  # Migrations
  echo "🔄 Exécution migrations..."
  npm run migrate

  echo "✅ Migrations complétées"
  echo ""

  # Démarrer backend
  echo "🚀 Démarrage API sur port 5000..."
  echo "   Logs disponibles ci-dessous:"
  echo "   Ctrl+C pour arrêter"
  echo ""

  npm run start:backend
fi

# ============================================
# ACTION: Démarrer Frontend
# ============================================
if [ "$ACTION" = "frontend" ]; then
  echo "📦 Démarrage Frontend..."

  cd frontend

  # Install deps
  if [ ! -d "node_modules" ]; then
    echo "📥 npm install..."
    npm install
  fi

  # Dev server
  echo "🚀 Démarrage sur http://localhost:5173"
  echo "   Ctrl+C pour arrêter"
  echo ""

  npm run dev
fi

# ============================================
# ACTION: Status
# ============================================
if [ "$ACTION" = "status" ]; then
  echo "📊 Status:"
  echo ""

  # PostgreSQL
  if psql citoyenavise_dev -c "SELECT 1" &>/dev/null; then
    COUNT=$(psql citoyenavise_dev -t -c "SELECT COUNT(*) FROM users" 2>/dev/null || echo "?")
    echo "✅ PostgreSQL: citoyenavise_dev ($COUNT utilisateurs)"
  else
    echo "❌ PostgreSQL: citoyenavise_dev non accessible"
  fi

  # Migrations
  echo ""
  if [ -d "backend" ]; then
    cd backend
    npm run migrate:status 2>/dev/null || echo "❌ Backend: migrations status non disponible"
  fi
fi

# ============================================
# ACTION: All (par défaut)
# ============================================
if [ "$ACTION" = "all" ]; then
  echo "ℹ️  Pour démarrer individuellement:"
  echo "   ./start-local.sh db       → Créer DB + migrations"
  echo "   ./start-local.sh backend  → Backend (port 5000)"
  echo "   ./start-local.sh frontend → Frontend (port 5173)"
  echo "   ./start-local.sh status   → Voir l'état"
  echo ""
  echo "ℹ️  Ensuite, dans deux terminaux séparés:"
  echo "   Terminal 1: ./start-local.sh backend"
  echo "   Terminal 2: ./start-local.sh frontend"
  echo ""
fi
