#!/usr/bin/env python3
"""
Script específico para instalar dependências de PDF no Windows
"""

import subprocess
import sys
import os
import platform

def run_command(command, description):
    """Executa um comando e retorna True se bem-sucedido"""
    try:
        print(f"🔧 {description}...")
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} - Sucesso!")
            return True
        else:
            print(f"❌ {description} - Falhou:")
            print(f"   Erro: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} - Exceção: {e}")
        return False

def check_system():
    """Verifica o sistema operacional"""
    print(f"🖥️ Sistema: {platform.system()} {platform.release()}")
    print(f"🐍 Python: {sys.version}")
    print(f"📁 Diretório atual: {os.getcwd()}")
    print("=" * 50)

def install_weasyprint():
    """Instala WeasyPrint e suas dependências"""
    print("\n📦 Instalando WeasyPrint...")
    
    # Lista de pacotes necessários para WeasyPrint
    packages = [
        "weasyprint>=60.0",
        "cffi>=1.15.0", 
        "cairocffi>=1.15.0",
        "pycparser>=2.21",
        "Pillow>=9.0.0",
        "fonttools>=4.0.0"
    ]
    
    success_count = 0
    for package in packages:
        if run_command(f'pip install "{package}"', f"Instalando {package}"):
            success_count += 1
    
    return success_count == len(packages)

def install_pdfkit():
    """Instala pdfkit como fallback"""
    print("\n📦 Instalando pdfkit como fallback...")
    return run_command("pip install pdfkit", "Instalando pdfkit")

def test_installation():
    """Testa se as bibliotecas foram instaladas corretamente"""
    print("\n🧪 Testando instalação...")
    
    # Teste WeasyPrint
    try:
        import weasyprint
        print("✅ WeasyPrint importado com sucesso")
        weasyprint_ok = True
    except ImportError as e:
        print(f"❌ WeasyPrint não disponível: {e}")
        weasyprint_ok = False
    
    # Teste pdfkit
    try:
        import pdfkit
        print("✅ pdfkit importado com sucesso")
        pdfkit_ok = True
    except ImportError as e:
        print(f"❌ pdfkit não disponível: {e}")
        pdfkit_ok = False
    
    return weasyprint_ok, pdfkit_ok

def main():
    print("🚀 Instalador de Dependências PDF para Windows")
    print("=" * 50)
    
    check_system()
    
    # Instalar WeasyPrint
    weasyprint_success = install_weasyprint()
    
    # Instalar pdfkit como fallback
    pdfkit_success = install_pdfkit()
    
    # Testar instalação
    weasyprint_ok, pdfkit_ok = test_installation()
    
    print("\n" + "=" * 50)
    print("📊 Resumo da instalação:")
    print(f"WeasyPrint: {'✅ Instalado e funcionando' if weasyprint_ok else '❌ Falhou'}")
    print(f"pdfkit: {'✅ Instalado e funcionando' if pdfkit_ok else '❌ Falhou'}")
    
    if weasyprint_ok:
        print("\n🎉 Sucesso! WeasyPrint está funcionando.")
        print("💡 O sistema agora deve conseguir gerar PDFs corretamente.")
    elif pdfkit_ok:
        print("\n⚠️ WeasyPrint falhou, mas pdfkit está disponível.")
        print("💡 O sistema usará pdfkit, mas pode ter problemas com wkhtmltopdf.")
    else:
        print("\n❌ Falha na instalação!")
        print("💡 Tente instalar manualmente:")
        print("   pip install weasyprint")
        print("   pip install pdfkit")
    
    print("\n🔄 Reinicie o aplicativo Flask para aplicar as mudanças.")

if __name__ == "__main__":
    main()
