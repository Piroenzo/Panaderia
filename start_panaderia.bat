@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

REM 1) Verificar que docker.exe exista
where docker >nul 2>&1
if errorlevel 1 (
  echo Docker no esta instalado o no esta en el PATH.
  echo Instala Docker Desktop y vuelve a intentar.
  pause
  exit /b 1
)

REM 2) Si Docker Engine no esta listo, abrir Docker Desktop y esperar
docker info >nul 2>&1
if errorlevel 1 (
  echo Docker no esta listo. Abriendo Docker Desktop...
  if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  ) else (
    start "" "docker-desktop:"
  )

  echo Esperando a que Docker Engine este listo...
  set /a tries=0
  :WAIT_DOCKER
  docker info >nul 2>&1
  if not errorlevel 1 goto :DOCKER_READY
  set /a tries+=1
  if !tries! GEQ 120 (
    echo.
    echo Docker no se inicio a tiempo. Abri Docker Desktop manualmente y reintenta.
    pause
    exit /b 1
  )
  timeout /t 1 >nul
  goto :WAIT_DOCKER
)

:DOCKER_READY
echo Iniciando Panaderia con Docker...
docker compose up --build -d
if errorlevel 1 (
  echo Ocurrio un error al iniciar los contenedores.
  pause
  exit /b 1
)

REM 3) Esperar a que el frontend responda (por si tarda en arrancar)
echo Esperando a que el frontend este listo en http://localhost:5173 ...
set /a tries=0
:WAIT_FRONT
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:5173; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 goto :OPEN_BROWSER
set /a tries+=1
if !tries! GEQ 60 (
  echo No pude verificar el frontend a tiempo, igual lo abro...
  goto :OPEN_BROWSER
)
timeout /t 1 >nul
goto :WAIT_FRONT

:OPEN_BROWSER
REM 4) Abrir el frontend en el navegador (pestana)
start "" "http://localhost:5173"

echo.
echo Sistema listo:
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo Docs API: http://localhost:8000/docs
echo.
pause
