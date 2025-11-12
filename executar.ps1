# Script para executar o app.py
# No Windows, use: .\executar.ps1

# Navegar para o diretório do projeto
cd $PSScriptRoot

# Ativar o ambiente virtual
Write-Host "Ativando ambiente virtual..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Executar o app
Write-Host "Executando app.py..." -ForegroundColor Green
py app.py

