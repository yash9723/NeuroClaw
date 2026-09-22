@echo off
title NeuroClaw OpenClaw Gateway Server
cd /d "%~dp0"
echo ========================================================
echo   Starting NeuroClaw OpenClaw Gateway Backend
echo ========================================================
python server\start_server.py
pause
