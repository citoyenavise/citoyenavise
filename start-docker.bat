@echo off
REM 🚀 Script de démarrage Docker — Citoyenavise PHASE 1 (Windows)
REM Usage: start-docker.bat [dev|prod]

setlocal enabledelayedexpansion

set MODE=%1
if "%MODE%"=="" set MODE=dev

echo 🚀 Citoyenavise - Demarrage Docker Mode: %MODE%
echo.

REM Vérifier Docker
docker --version >nul 2>&1
if errorlevel 1 (
  echo ❌ Docker n'est pas installe
  exit /b 1
)

REM Vérifier Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
  echo ❌ Docker Compose n'est pas installe
  exit /b 1
)

REM Créer .env.docker s'il n'existe pas
if not exist ".env.docker" (
  echo 📝 Creation .env.docker...
  (
    echo # Docker Compose Environment
    echo NODE_ENV=development
    echo DB_USER=postgres
    echo DB_PASSWORD=postgres
    echo DB_NAME=citoyenavise_dev
    echo DB_HOST=postgres
    echo DB_PORT=5432
    echo REDIS_PASSWORD=password
    echo.
    echo # Backend
    echo JWT_SECRET=dev_secret_key_min_32_chars_change_in_prod_abc123def456
    echo JWT_REFRESH_SECRET=dev_refresh_secret_key_min_32_chars_abc123def456_DIFFERENT
    echo API_URL=http://localhost:5000
    echo FRONTEND_URL=http://localhost:3000
    echo CORS_ORIGIN=http://localhost:3000,http://localhost:8000
    echo.
    echo # Logging
    echo LOG_LEVEL=debug
    echo.
    echo # pgAdmin
    echo PGADMIN_EMAIL=admin@citoyenavise.local
    echo PGADMIN_PASSWORD=admin
  ) > .env.docker
  echo ✅ .env.docker cree
)

if "%MODE%"=="dev" (
  echo 🔧 Mode DEVELOPPEMENT
  echo.

  echo 📦 Demarrage services...
  docker-compose up -d postgres redis

  echo ⏳ Attente PostgreSQL healthy...
  timeout /t 15 /nobreak

  echo 📦 Demarrage backend...
  docker-compose up -d backend

  echo ⏳ Attente Backend ready...
  timeout /t 10 /nobreak

  echo 📦 Demarrage frontend...
  docker-compose up -d frontend

  echo.
  echo 🎉 Services demarres!
  echo.
  echo 📍 Acces:
  echo    Backend:  http://localhost:5000
  echo    Frontend: http://localhost:3000
  echo    API:      http://localhost:5000/api/v1/...
  echo.
  echo 📊 Status:
  docker-compose ps
  echo.
  echo 📝 Logs: docker-compose logs -f
  echo 🛑 Arret: docker-compose down
)

if "%MODE%"=="prod" (
  echo 🚀 Mode PRODUCTION
  echo.

  echo 📦 Build + demarrage services...
  docker-compose up -d --build

  echo ✅ Services en prod
  echo.
  echo 📍 Acces:
  echo    Backend:  http://localhost:5000
  echo    Frontend: http://localhost:3000
)

pause
