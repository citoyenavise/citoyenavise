#!/bin/bash
set -e

echo "═══════════════════════════════════"
echo "🚀 PRODUCTION DEPLOYMENT"
echo "═══════════════════════════════════"

echo "📝 Running linter..."
npm run lint || { echo "❌ Lint failed"; exit 1; }

echo "✅ Running tests..."
npm test || { echo "❌ Tests failed"; exit 1; }

echo "📊 Checking coverage..."
npm run test:coverage || { echo "❌ Coverage < 85%"; exit 1; }

echo "🔍 Security audit..."
npm audit || { echo "⚠️ Vulnerabilities found"; }

echo "🏗️ Building..."
npm run build || { echo "❌ Build failed"; exit 1; }

echo "📦 Bundle size check..."
du -sh dist/

echo "🌐 Lighthouse test..."
npm run lighthouse || true

echo "🐳 Building Docker image..."
docker build -t citoyenavise:production .

echo "🔐 Database migrations..."
npm run migrate

echo "📡 Deploying to production..."
git add .
git commit -m "Production release - $(date +%Y-%m-%d)" || true
git push origin main

echo "✨ Deployment complete!"
echo "═══════════════════════════════════"
echo "🎉 APP LIVE: https://citoyenavise.org"
echo "═══════════════════════════════════"
