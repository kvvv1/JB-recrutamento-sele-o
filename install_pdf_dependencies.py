#!/usr/bin/env python3
"""
Script para instalar dependências necessárias para geração de PDF
"""

import subprocess
import sys
import os

def install_package(package):
    """Instala um pacote usando pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ {package} instalado com sucesso!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao instalar {package}: {e}")
        return False

def main():
    print("🔧 Instalando dependências para geração de PDF...")
    print("=" * 50)
    
    # Lista de pacotes necessários
    packages = [
        "weasyprint",  # Biblioteca principal para geração de PDF
        "cffi",        # Dependência do WeasyPrint
        "cairocffi",   # Dependência do WeasyPrint
        "pycparser",   # Dependência do WeasyPrint
    ]
    
    success_count = 0
    total_packages = len(packages)
    
    for package in packages:
        print(f"\n📦 Instalando {package}...")
        if install_package(package):
            success_count += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Resumo: {success_count}/{total_packages} pacotes instalados com sucesso")
    
    if success_count == total_packages:
        print("🎉 Todas as dependências foram instaladas com sucesso!")
        print("💡 Agora você pode gerar PDFs usando WeasyPrint")
    else:
        print("⚠️ Algumas dependências falharam na instalação")
        print("💡 Tente instalar manualmente: pip install weasyprint")
    
    print("\n🔍 Verificando instalação...")
    try:
        import weasyprint
        print("✅ WeasyPrint está funcionando corretamente!")
    except ImportError as e:
        print(f"❌ WeasyPrint não está funcionando: {e}")
        print("💡 Tente executar: pip install --upgrade weasyprint")

if __name__ == "__main__":
    main()
