#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Setup Base de Données — Citoyen Avisé
# ═══════════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Initialisation Base de Données — Citoyen Avisé${NC}\n"

# Configuration
DB_NAME="${1:-citoyenavise_dev}"
DB_USER="${2:-postgres}"
MIGRATIONS_PATH="./src/migrations"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL CLI not found. Install it first.${NC}"
    exit 1
fi

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_PATH" ]; then
    echo -e "${RED}❌ Migrations directory not found: $MIGRATIONS_PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Migrations: $MIGRATIONS_PATH"
echo ""

# Step 1: Drop existing database (optional)
read -p "Drop existing database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Dropping database...${NC}"
    psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
fi

# Step 2: Create database
echo -e "${YELLOW}📦 Creating database: $DB_NAME${NC}"
createdb -U "$DB_USER" "$DB_NAME" || {
    echo -e "${RED}❌ Failed to create database${NC}"
    exit 1
}
echo -e "${GREEN}✅ Database created${NC}\n"

# Step 3: Enable PostGIS extension
echo -e "${YELLOW}🗺️  Enabling PostGIS extension...${NC}"
psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis;" || {
    echo -e "${RED}⚠️  PostGIS extension not available (optional)${NC}"
}
echo -e "${GREEN}✅ PostGIS enabled${NC}\n"

# Step 4: Apply migrations in order
echo -e "${YELLOW}📂 Applying migrations...${NC}"
MIGRATIONS=(
    "001_create_users.sql"
    "002_create_elus.sql"
    "003_create_circonscriptions.sql"
    "004_create_petitions.sql"
    "005_create_elu_commitments.sql"
    "006_create_posts.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    migration_file="$MIGRATIONS_PATH/$migration"

    if [ ! -f "$migration_file" ]; then
        echo -e "${RED}❌ Migration not found: $migration_file${NC}"
        exit 1
    fi

    echo -n "   Applying $migration... "
    psql -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" > /dev/null 2>&1 || {
        echo -e "${RED}❌ Failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✅${NC}"
done

echo ""

# Step 5: Verify tables
echo -e "${YELLOW}🔍 Verifying tables...${NC}"
TABLE_COUNT=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
echo -e "${GREEN}✅ Created $TABLE_COUNT tables${NC}\n"

# Step 6: Check indexes
echo -e "${YELLOW}📑 Database statistics:${NC}"
psql -U "$DB_USER" -d "$DB_NAME" <<EOF
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
EOF

echo ""

# Step 7: Summary
echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Base de données initialisée avec succès!${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"
echo ""
echo "Prochaines étapes:"
echo "  1. Configure .env avec DATABASE_URL"
echo "  2. Démarre le serveur: npm run dev"
echo "  3. Teste l'API: curl http://localhost:5000/health"
echo ""
echo "Documentation:"
echo "  - Database setup: see DATABASE_SETUP.md"
echo "  - API endpoints: see API_FRENCH_ROUTES.md"
echo "  - Testing: npm test"
echo ""
