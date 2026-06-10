@echo off
set ELECTRON_RUN_AS_NODE=
cd /d "%~dp0windows"
npx electron-vite dev
