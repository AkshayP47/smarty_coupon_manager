@echo off
REM Starts all three services, each in its own window.
REM Run from the project root. One-time setup first (see README.md):
REM   backend:  npm install  (+ backend\.env)
REM   frontend: npm install
REM   ai-service: python -m venv venv  +  venv\Scripts\python.exe -m pip install -r requirements.txt
start "backend" cmd /k "cd /d %~dp0backend && npm run dev"
start "frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
start "ai-service" cmd /k "cd /d %~dp0ai-service && venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"
