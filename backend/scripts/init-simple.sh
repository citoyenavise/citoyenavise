#!/bin/bash
# Quick setup with single 001_initial.sql migration

set -e

DB_NAME="${1:-citoyenavise_dev}"
DB_USER="${2:-postgres}"

echo "🚀 Quick Setup — Citoyen Avisé"
echo ""

# Drop & create
echo "📦 Creating database: $DB_NAME"
dropdb -U $DB_USER $DB_NAME 2>/dev/null || true
createdb -U $DB_USER $DB_NAME

# Enable PostGIS
echo "🗺️  Enabling PostGIS..."
psql -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null || true

# Apply migration
echo "📂 Applying 001_initial.sql..."
psql -U $DB_USER -d $DB_NAME -f ./src/migrations/001_initial.sql

echo ""
echo "✅ Database ready!"
echo ""
echo "Next:"
echo "  npm install"
echo "  npm run dev"
echo ""
