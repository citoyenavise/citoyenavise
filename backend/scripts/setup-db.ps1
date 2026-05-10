# ═══════════════════════════════════════════════════════════════════
# Setup Base de Données — Citoyen Avisé (PowerShell)
# ═══════════════════════════════════════════════════════════════════

param(
    [string]$DbName = "citoyenavise_dev",
    [string]$DbUser = "postgres"
)

# Colors
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"

Write-Host "🚀 Initialisation Base de Données — Citoyen Avisé`n" -ForegroundColor $Yellow

# Configuration
$migrationsPath = ".\src\migrations"

Write-Host "📋 Configuration:" -ForegroundColor $Yellow
Write-Host "   Database: $DbName"
Write-Host "   User: $DbUser"
Write-Host "   Migrations: $migrationsPath`n"

# Check if psql is available
try {
    $null = psql --version
} catch {
    Write-Host "❌ PostgreSQL CLI not found. Install it first." -ForegroundColor $Red
    exit 1
}

# Check migrations directory
if (-not (Test-Path $migrationsPath)) {
    Write-Host "❌ Migrations directory not found: $migrationsPath" -ForegroundColor $Red
    exit 1
}

# Step 1: Ask to drop database
$drop = Read-Host "Drop existing database? (y/n)"
if ($drop -eq "y") {
    Write-Host "🗑️  Dropping database..." -ForegroundColor $Yellow
    psql -U $DbUser -c "DROP DATABASE IF EXISTS $DbName;" 2>$null
}

# Step 2: Create database
Write-Host "📦 Creating database: $DbName" -ForegroundColor $Yellow
createdb -U $DbUser $DbName
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create database" -ForegroundColor $Red
    exit 1
}
Write-Host "✅ Database created`n" -ForegroundColor $Green

# Step 3: Enable PostGIS
Write-Host "🗺️  Enabling PostGIS extension..." -ForegroundColor $Yellow
psql -U $DbUser -d $DbName -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>$null
Write-Host "✅ PostGIS enabled`n" -ForegroundColor $Green

# Step 4: Apply migrations
Write-Host "📂 Applying migrations..." -ForegroundColor $Yellow
$migrations = @(
    "001_create_users.sql",
    "002_create_elus.sql",
    "003_create_circonscriptions.sql",
    "004_create_petitions.sql",
    "005_create_elu_commitments.sql",
    "006_create_posts.sql"
)

foreach ($migration in $migrations) {
    $migrationFile = Join-Path $migrationsPath $migration

    if (-not (Test-Path $migrationFile)) {
        Write-Host "❌ Migration not found: $migrationFile" -ForegroundColor $Red
        exit 1
    }

    Write-Host "   Applying $migration... " -NoNewline
    psql -U $DbUser -d $DbName -f $migrationFile 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅" -ForegroundColor $Green
    } else {
        Write-Host "❌ Failed" -ForegroundColor $Red
        exit 1
    }
}

Write-Host ""

# Step 5: Verify tables
Write-Host "🔍 Verifying tables..." -ForegroundColor $Yellow
$tableCount = psql -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | ForEach-Object { $_.Trim() }
Write-Host "✅ Created $tableCount tables`n" -ForegroundColor $Green

# Step 6: Database statistics
Write-Host "📑 Database statistics:" -ForegroundColor $Yellow
psql -U $DbUser -d $DbName -c @"
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"@

Write-Host ""

# Step 7: Summary
Write-Host "═════════════════════════════════════════════════════════" -ForegroundColor $Green
Write-Host "✅ Base de données initialisée avec succès!" -ForegroundColor $Green
Write-Host "═════════════════════════════════════════════════════════" -ForegroundColor $Green
Write-Host ""
Write-Host "Prochaines étapes:"
Write-Host "  1. Configure .env avec DATABASE_URL"
Write-Host "  2. Démarre le serveur: npm run dev"
Write-Host "  3. Teste l'API: curl http://localhost:5000/health"
Write-Host ""
Write-Host "Documentation:"
Write-Host "  - Database setup: see DATABASE_SETUP.md"
Write-Host "  - API endpoints: see API_FRENCH_ROUTES.md"
Write-Host "  - Testing: npm test"
Write-Host ""
