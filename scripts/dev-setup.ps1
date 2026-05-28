# Citoyen Avise - Dev Setup Local
#
# Provisionne l'environnement de developpement local :
#   1. Lance Postgres via docker-compose (service postgres uniquement)
#   2. Attend que Postgres soit healthy
#   3. Ajuste backend/.env (DATABASE_URL Docker + ADMIN_SEED_TOKEN dev)
#      avec backup .env.bak avant modification
#   4. Synchronise le schema Sequelize (sequelize.sync force:true)
#
# Idempotent : peut etre relance sans casser quoi que ce soit.
#
# Usage :
#   .\scripts\dev-setup.ps1
#
# Ensuite, dans une fenetre PowerShell separee :
#   cd backend
#   npm run dev

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent

Write-Host "=== CITOYEN AVISE - Dev setup local ===" -ForegroundColor Cyan

# 1. Docker Postgres
Write-Host ""
Write-Host "[1/4] Demarrage Postgres via docker-compose..." -ForegroundColor Green
Push-Location $RepoRoot
try {
    docker compose up -d postgres
    if ($LASTEXITCODE -ne 0) { throw "docker compose up failed (exit $LASTEXITCODE)" }
} finally {
    Pop-Location
}

# 2. Attente healthcheck
Write-Host ""
Write-Host "[2/4] Attente que Postgres soit healthy..." -ForegroundColor Green
$timeout = 60
$elapsed = 0
$status = ""
while ($elapsed -lt $timeout) {
    try {
        $status = docker inspect --format='{{.State.Health.Status}}' citoyenavise_postgres 2>$null
    } catch {
        $status = "unknown"
    }
    if ($status -eq "healthy") { break }
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host "  attente... ($elapsed s, status=$status)" -ForegroundColor DarkGray
}
if ($status -ne "healthy") {
    throw "Postgres pas healthy apres $timeout s (status=$status)"
}
Write-Host "  OK Postgres healthy" -ForegroundColor Green

# 3. Mise a jour backend/.env (idempotente)
Write-Host ""
Write-Host "[3/4] Verification backend/.env..." -ForegroundColor Green
$envPath = Join-Path $RepoRoot "backend\.env"
if (-not (Test-Path $envPath)) {
    throw "backend/.env introuvable : $envPath"
}

$envContent = [System.IO.File]::ReadAllText($envPath, [System.Text.UTF8Encoding]::new($false))
$changed = $false
$expectedDbUrl = "postgresql://staging_user:staging_password@localhost:5433/citoyenavise_staging"

if ($envContent -notmatch [regex]::Escape($expectedDbUrl)) {
    Copy-Item $envPath "$envPath.bak" -Force
    Write-Host "  backup: backend/.env.bak cree" -ForegroundColor DarkGray
    $envContent = $envContent -replace 'DATABASE_URL=[^\r\n]*', "DATABASE_URL=$expectedDbUrl"
    $changed = $true
    Write-Host "  DATABASE_URL ajuste pour Docker (staging_user)" -ForegroundColor Yellow
} else {
    Write-Host "  DATABASE_URL deja conforme" -ForegroundColor DarkGray
}

if ($envContent -notmatch "(?m)^ADMIN_SEED_TOKEN=") {
    if (-not (Test-Path "$envPath.bak")) {
        Copy-Item $envPath "$envPath.bak" -Force
        Write-Host "  backup: backend/.env.bak cree" -ForegroundColor DarkGray
    }
    if (-not $envContent.EndsWith("`n")) { $envContent += "`n" }
    $envContent += "`n# Token local (dev only - jamais en prod)`nADMIN_SEED_TOKEN=dev_token_local_only`n"
    $changed = $true
    Write-Host "  ADMIN_SEED_TOKEN ajoute (dev_token_local_only)" -ForegroundColor Yellow
} else {
    Write-Host "  ADMIN_SEED_TOKEN deja present" -ForegroundColor DarkGray
}

if ($changed) {
    # Ecriture UTF-8 SANS BOM pour ne pas corrompre les caracteres accentues
    [System.IO.File]::WriteAllText($envPath, $envContent, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  backend/.env mis a jour (UTF-8 sans BOM)" -ForegroundColor Green
} else {
    Write-Host "  backend/.env deja conforme, aucun changement" -ForegroundColor Green
}

# 4. Sync schema Sequelize
Write-Host ""
Write-Host "[4/4] Sync schema Sequelize (sequelize.sync force:true)..." -ForegroundColor Green
Write-Host "  ATTENTION : DROP + CREATE de toutes les tables (donnees locales perdues)" -ForegroundColor Yellow
Push-Location (Join-Path $RepoRoot "backend")
try {
    npm run setup:db
    if ($LASTEXITCODE -ne 0) { throw "npm run setup:db failed (exit $LASTEXITCODE)" }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "=== SETUP TERMINE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines etapes :" -ForegroundColor Cyan
Write-Host "  1. Ouvre une fenetre PowerShell SEPAREE de celle-ci" -ForegroundColor White
Write-Host "  2. cd $(Join-Path $RepoRoot 'backend')" -ForegroundColor White
Write-Host "  3. npm run dev" -ForegroundColor White
Write-Host "  4. Dans une 3e fenetre PowerShell :" -ForegroundColor White
Write-Host "     .\scripts\dev-curl-import-federal.ps1 dry-run" -ForegroundColor White
