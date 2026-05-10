# Production Deployment Script for Windows
# Usage: .\scripts\deploy-production.ps1

Write-Host "═══════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 PRODUCTION DEPLOYMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════" -ForegroundColor Cyan

# Linter
Write-Host "`n📝 Running linter..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Lint failed" -ForegroundColor Red
  exit 1
}

# Tests
Write-Host "`n✅ Running tests..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Tests failed" -ForegroundColor Red
  exit 1
}

# Coverage
Write-Host "`n📊 Checking coverage..." -ForegroundColor Yellow
npm run test:coverage
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Coverage < 85%" -ForegroundColor Red
  exit 1
}

# Security audit
Write-Host "`n🔍 Security audit..." -ForegroundColor Yellow
npm audit
if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️ Vulnerabilities found" -ForegroundColor Yellow
}

# Build
Write-Host "`n🏗️ Building..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Build failed" -ForegroundColor Red
  exit 1
}

# Bundle size
Write-Host "`n📦 Bundle size check..." -ForegroundColor Yellow
if (Test-Path "dist") {
  $size = (Get-Item "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
  Write-Host "Size: $([Math]::Round($size, 2)) MB" -ForegroundColor Green
}

# Lighthouse
Write-Host "`n🌐 Lighthouse test..." -ForegroundColor Yellow
npm run lighthouse
# Continue even if lighthouse fails

# Docker build
Write-Host "`n🐳 Building Docker image..." -ForegroundColor Yellow
docker build -t citoyenavise:production .

# Migrations
Write-Host "`n🔐 Database migrations..." -ForegroundColor Yellow
npm run migrate

# Git deployment
Write-Host "`n📡 Deploying to production..." -ForegroundColor Yellow
$releaseDate = Get-Date -Format "yyyy-MM-dd"
git add .
git commit -m "Production release - $releaseDate" -ErrorAction SilentlyContinue
git push origin main

Write-Host "`n✨ Deployment complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 APP LIVE: https://citoyenavise.org" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════" -ForegroundColor Cyan
