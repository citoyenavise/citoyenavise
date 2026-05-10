# Quick setup with single 001_initial.sql migration (Windows)

param(
    [string]$DbName = "citoyenavise_dev",
    [string]$DbUser = "postgres"
)

Write-Host "🚀 Quick Setup — Citoyen Avisé" -ForegroundColor Green
Write-Host ""

# Drop & create
Write-Host "📦 Creating database: $DbName" -ForegroundColor Yellow
dropdb -U $DbUser $DbName 2>$null
createdb -U $DbUser $DbName

# Enable PostGIS
Write-Host "🗺️  Enabling PostGIS..." -ForegroundColor Yellow
psql -U $DbUser -d $DbName -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>$null

# Apply migration
Write-Host "📂 Applying 001_initial.sql..." -ForegroundColor Yellow
psql -U $DbUser -d $DbName -f ".\src\migrations\001_initial.sql"

Write-Host ""
Write-Host "✅ Database ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next:"
Write-Host "  npm install"
Write-Host "  npm run dev"
Write-Host ""
