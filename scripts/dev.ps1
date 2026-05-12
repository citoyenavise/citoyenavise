# Script de développement pour Citoyen Avisé
# Lance Backend et Frontend dans deux terminaux séparés avec couleurs distinctes

Write-Host "🚀 Démarrage Citoyen Avisé (Environnement de développement)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Arrêter tous les processus Node.js existants (optionnel, décommenter si nécessaire)
# Write-Host "⏹️  Arrêt des processus Node.js existants..." -ForegroundColor Yellow
# Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Lancer le Backend dans un nouveau terminal
Write-Host "📌 Lancement du Backend sur port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\backend'; npm run dev"

# Attendre un peu pour que le backend démarre
Start-Sleep -Seconds 2

# Lancer le Frontend dans un nouveau terminal
Write-Host "📌 Lancement du Frontend sur port 5173..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\frontend'; npm run dev"

# Afficher les URLs
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Services disponibles:" -ForegroundColor Green
Write-Host ""
Write-Host "   Backend API:        http://localhost:3000" -ForegroundColor Green
Write-Host "   Swagger Docs:       http://localhost:3000/api-docs" -ForegroundColor Green
Write-Host "   Frontend:           http://localhost:5173" -ForegroundColor Magenta
Write-Host "   Login Page:         http://localhost:5173/fr/login" -ForegroundColor Magenta
Write-Host "   Admin Dashboard:    http://localhost:5173/fr/admin" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔗 Magic Link Flow:" -ForegroundColor Cyan
Write-Host "   1. Aller sur: http://localhost:5173/fr/login" -ForegroundColor Cyan
Write-Host "   2. Entrer votre email" -ForegroundColor Cyan
Write-Host "   3. Cliquer le lien dans le terminal (mode dev sans SMTP)" -ForegroundColor Cyan
Write-Host "   4. Vérifier à: http://localhost:5173/fr/verify?token=..." -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Conseil: Cliquez sur les URLs ci-dessus pour les ouvrir" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
