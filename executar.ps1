# Script para executar o app.py
# No Windows, use: .\executar.ps1

# Navegar para o diretório do projeto
cd $PSScriptRoot

# Ativar o ambiente virtual
Write-Host "Ativando ambiente virtual..." -ForegroundColor Yellow
.\.venv\Scripts\Activate.ps1

# Configurar subida para acesso externo na rede
$env:HOST = "0.0.0.0"
$env:ACCESS_HOST = "192.168.0.79"
$env:PORT = "5050"

# Executar o app
Write-Host "Executando app.py em http://192.168.0.79:5050 ..." -ForegroundColor Green
py app.py


