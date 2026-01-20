@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

where docker >nul 2>&1
if errorlevel 1 (
  echo Docker no esta instalado o no esta en el PATH.
  echo Instala Docker Desktop y vuelve a intentar.
  pause
  exit /b 1
)

REM Si Docker Desktop/Engine no esta corriendo, evitamos el error de la pipe
docker info >nul 2>&1
if errorlevel 1 (
  echo Docker Engine no esta iniciado (Docker Desktop cerrado).
  echo Si tus contenedores estaban corriendo, se frenan igual al cerrar Docker.
  pause
  exit /b 0
)

echo Deteniendo Panaderia...
docker compose down
if errorlevel 1 (
  echo Ocurrio un error al detener los contenedores.
  pause
  exit /b 1
)

echo.
echo Sistema detenido.
echo.
pause
