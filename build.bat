@echo off
echo Building Guitar Tab Reader...

set ELECTRON_RUN_AS_NODE=
cd /d "%~dp0windows"

echo.
echo [1/2] Compiling source...
npx electron-vite build
if errorlevel 1 (
  echo Build failed at compile step.
  pause
  exit /b 1
)

echo.
echo [2/2] Packaging installer...
npx electron-builder --win
if errorlevel 1 (
  echo Build failed at packaging step.
  pause
  exit /b 1
)

echo.
echo Done! Installer is in releases\
pause
