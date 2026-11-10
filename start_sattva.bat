@echo off
setlocal
 title Sattva - Local Development
set "ROOT=%~dp0"
if not exist "%ROOT%backend\app\main.py" (
  echo ERROR: Backend source was not found beside this script.
  pause
  exit /b 1
)
if not exist "%ROOT%frontend\package.json" (
  echo ERROR: Frontend source was not found beside this script.
  pause
  exit /b 1
)
if not exist "%ROOT%.venv\Scripts\python.exe" (
  echo Create the environment first: py -3.13 -m venv .venv
  pause
  exit /b 1
)
start "Sattva Backend" /D "%ROOT%" cmd /k "set PYTHONPATH=%ROOT%backend&& .venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000"
start "Sattva Frontend" /D "%ROOT%frontend" cmd /k "npm.cmd run dev -- --host 127.0.0.1"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
