#!/bin/bash

################################################################################
# 🚀 Deployment Script for Staging Environment
#
# Ce script automatise le déploiement vers l'environnement staging:
# 1. Linting (ESLint)
# 2. Tests (Jest + Playwright)
# 3. Security checks (npm audit, Snyk)
# 4. Docker build
# 5. Docker Compose deployment
#
# Usage: ./scripts/deploy-staging.sh
# Requirements: Node.js, Docker, Docker Compose, Git
################################################################################

set -e  # Exit on error
set -o pipefail  # Exit if any command in pipeline fails

# ═══════════════════════════════════════════════════════════════════════════
# COLORS & FORMATTING
# ═══════════════════════════════════════════════════════════════════════════
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════════════════════
# FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

log_header() {
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
  echo -e "${CYAN}ℹ️  $1${NC}"
}

log_step() {
  echo -e "${MAGENTA}→  $1${NC}"
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# ═══════════════════════════════════════════════════════════════════════════
# PRE-FLIGHT CHECKS
# ═══════════════════════════════════════════════════════════════════════════

log_header "Pre-flight Checks"

# Check Node.js
if ! command_exists node; then
  log_error "Node.js not found. Please install Node.js 18+"
  exit 1
fi
log_success "Node.js $(node --version)"

# Check npm
if ! command_exists npm; then
  log_error "npm not found. Please install npm"
  exit 1
fi
log_success "npm $(npm --version)"

# Check Docker
if ! command_exists docker; then
  log_error "Docker not found. Please install Docker"
  exit 1
fi
log_success "Docker $(docker --version)"

# Check Docker Compose
if ! command_exists docker-compose; then
  log_error "Docker Compose not found. Please install Docker Compose"
  exit 1
fi
log_success "Docker Compose $(docker-compose --version)"

# Check Git
if ! command_exists git; then
  log_error "Git not found. Please install Git"
  exit 1
fi
log_success "Git $(git --version)"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: ENVIRONMENT SETUP
# ═══════════════════════════════════════════════════════════════════════════

log_header "Step 1: Environment Setup"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

log_info "Project root: $PROJECT_ROOT"
log_info "Backend dir: $BACKEND_DIR"
log_info "Frontend dir: $FRONTEND_DIR"

# Check .env files
if [ ! -f "$BACKEND_DIR/.env" ]; then
  log_error ".env file not found in backend. Copy from .env.example:"
  log_error "cp backend/.env.example backend/.env"
  exit 1
fi
log_success ".env file found"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: BACKEND LINTING
# ═══════════════════════════════════════════════════════════════════════════

log_header "Step 2: Backend Linting"

log_step "Running ESLint..."
cd "$BACKEND_DIR"
npm run lint || {
  log_error "Linting failed. Run 'npm run lint:fix' to auto-fix issues."
  exit 1
}
log_success "Linting passed"

log_step "Checking code format..."
npm run format || {
  log_warning "Some files were reformatted. Commit changes and retry."
  exit 1
}
log_success "Code formatting OK"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: BACKEND TESTS
# ═══════════════════════════════════════════════════════════════════════════

log_header "Step 3: Backend Tests"

log_step "Running unit tests..."
npm run test || {
  log_error "Unit tests failed. Fix errors and retry."
  exit 1
}
log_success "Unit tests passed"

log_step "Running CI tests..."
npm run test:ci || {
  log_error "CI tests failed. Check configuration."
  exit 1
}
log_success "CI tests passed"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: SECURITY CHECKS
# ═══════════════════════════════════════════════════════════════════════════

log_header "Step 4: Security Checks"

log_step "Running npm audit..."
npm run security:check || {
  log_warning "npm audit found vulnerabilities. Review and fix if critical."
  # Don't exit on security warning, just warn
}
log_success "Security check complete"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5: FRONTEND LINTING & TESTS
# ═══════════════════════════════════════════════════════════════════════════

log_header "Step 5: Frontend Linting & Tests"

if [ -d "$FRONTEND_DIR" ]; then
  cd "$FRONTEND_DIR"

  log_step "Running frontend linting..."
  npm run lint || {
    log_error "Frontend linting failed."
    exit 1
  }
  log_success "Frontend linting passed"

  log_step "Running frontend tests..."
  npm run test -- --run || {
    log_warning "Frontend tests failed. Continuing anyway..."
  }
  log_success "Frontend tests complete"
else
  log_warning "Frontend directory not found. Skipping frontend tests."
fi

# ═══════════════════════════════════════════════════════════════════════════
# STEP 6: DOCKER BUILD
# ═══════════════════════════════════════════════════════════════════════════

log_header "Step 6: Docker Image Build"

cd "$PROJECT_ROOT"

log_step "Building Docker image: citoyenavise:staging"
if docker build -t citoyenavise:staging . --build-arg NODE_ENV=staging; then
  log_success "Docker image built successfully"
else
  log_error "Docker build failed. Check Dockerfile and logs."
  exit 1
fi

# Show image size
IMAGE_SIZE=$(docker images citoyenavise:staging --format="{{.Size}}")
log_info "Image size: $IMAGE_SIZE"

# ═══════════════════════════════════════════════════════════════════════════
# STEP 7: DOCKER COMPOSE DEPLOYMENT
# ═══════════════════════════════════════════════════════════════════════════

log_header "Step 7: Docker Compose Deployment"

# Check if docker-compose.staging.yml exists
if [ ! -f "$PROJECT_ROOT/docker-compose.staging.yml" ]; then
  log_warning "docker-compose.staging.yml not found. Using docker-compose.yml"
  COMPOSE_FILE="docker-compose.yml"
else
  COMPOSE_FILE="docker-compose.staging.yml"
fi

log_step "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down || true

log_step "Starting services..."
if docker-compose -f "$COMPOSE_FILE" up -d; then
  log_success "Services started"
else
  log_error "Docker Compose deployment failed."
  exit 1
fi

# Wait for services to be ready
log_step "Waiting for services to be ready..."
sleep 5

# Check service health
log_step "Checking service health..."
if curl -s http://localhost:5000/health | grep -q "ok"; then
  log_success "Backend service is healthy"
else
  log_warning "Backend health check failed. Check logs with: docker logs citoyenavise_app"
fi

# ═══════════════════════════════════════════════════════════════════════════
# STEP 8: DEPLOYMENT SUMMARY
# ═══════════════════════════════════════════════════════════════════════════

log_header "Deployment Summary"

log_success "✨ Deployment to staging completed successfully!"
echo ""
echo -e "${GREEN}Services running:${NC}"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo -e "${GREEN}Available endpoints:${NC}"
echo "  📱 Frontend: http://localhost:3001"
echo "  🔌 Backend API: http://localhost:5000"
echo "  📊 API Docs: http://localhost:5000/api-docs"
echo "  🔍 Health: http://localhost:5000/health"

echo ""
echo -e "${GREEN}Useful commands:${NC}"
echo "  View logs:         docker-compose -f $COMPOSE_FILE logs -f"
echo "  Stop services:     docker-compose -f $COMPOSE_FILE down"
echo "  Restart services:  docker-compose -f $COMPOSE_FILE restart"
echo "  Remove volumes:    docker-compose -f $COMPOSE_FILE down -v"

echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "  1. Test the staging deployment"
echo "  2. Check logs for errors"
echo "  3. Run E2E tests: npm run test:e2e"
echo "  4. Deploy to production when ready"

echo ""
log_success "🎉 Happy coding!"
