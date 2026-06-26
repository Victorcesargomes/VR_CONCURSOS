@echo off
cd /d "%~dp0"
"C:\Users\victo\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000 > run_api.log 2>&1
