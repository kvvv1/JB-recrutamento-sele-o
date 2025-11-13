@echo off
REM Script para executar o app.py no Windows
REM Use: executar.bat

cd /d "%~dp0"
call venv\Scripts\activate.bat
py app.py
pause


