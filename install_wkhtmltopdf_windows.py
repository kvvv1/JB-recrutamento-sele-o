#!/usr/bin/env python3
"""
Script para instalar wkhtmltopdf no Windows
"""

import subprocess
import sys
import os
import urllib.request
import zipfile
import shutil
from pathlib import Path

def download_file(url, filename):
    """Baixa um arquivo da URL"""
    try:
        print(f"📥 Baixando {filename}...")
        urllib.request.urlretrieve(url, filename)
        print(f"✅ {filename} baixado com sucesso!")
        return True
    except Exception as e:
        print(f"❌ Erro ao baixar {filename}: {e}")
        return False

def extract_zip(zip_path, extract_to):
    """Extrai um arquivo ZIP"""
    try:
        print(f"📦 Extraindo {zip_path}...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
        print(f"✅ {zip_path} extraído com sucesso!")
        return True
    except Exception as e:
        print(f"❌ Erro ao extrair {zip_path}: {e}")
        return False

def install_wkhtmltopdf():
    """Instala wkhtmltopdf no Windows"""
    print("🔧 Instalando wkhtmltopdf para Windows...")
    
    # URL do wkhtmltopdf para Windows (versão estável)
    wkhtmltopdf_url = "https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/wkhtmltox-0.12.6-1.msvc2015-win64.exe"
    installer_name = "wkhtmltopdf-installer.exe"
    
    # Baixar o instalador
    if not download_file(wkhtmltopdf_url, installer_name):
        return False
    
    # Executar o instalador
    try:
        print("🚀 Executando instalador do wkhtmltopdf...")
        print("⚠️ IMPORTANTE: Aceite a instalação padrão (C:\\Program Files\\wkhtmltopdf)")
        
        # Executar o instalador silenciosamente
        result = subprocess.run([
            installer_name, 
            "/S",  # Modo silencioso
            "/D=C:\\Program Files\\wkhtmltopdf"  # Diretório de instalação
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ wkhtmltopdf instalado com sucesso!")
            
            # Verificar se foi instalado corretamente
            wkhtmltopdf_path = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
            if os.path.exists(wkhtmltopdf_path):
                print(f"✅ wkhtmltopdf encontrado em: {wkhtmltopdf_path}")
                
                # Configurar pdfkit para usar o caminho correto
                config_pdfkit_path(wkhtmltopdf_path)
                return True
            else:
                print("❌ wkhtmltopdf não foi encontrado após a instalação")
                return False
        else:
            print(f"❌ Erro na instalação: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao executar instalador: {e}")
        return False
    finally:
        # Limpar arquivo temporário
        if os.path.exists(installer_name):
            os.remove(installer_name)

def config_pdfkit_path(wkhtmltopdf_path):
    """Configura o pdfkit para usar o caminho correto do wkhtmltopdf"""
    try:
        import pdfkit
        
        # Configurar o caminho do wkhtmltopdf
        config = pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_path)
        
        # Testar se funciona
        print("🧪 Testando configuração do pdfkit...")
        test_html = "<html><body><h1>Teste</h1></body></html>"
        
        pdfkit.from_string(test_html, "test_pdfkit.pdf", configuration=config)
        
        if os.path.exists("test_pdfkit.pdf"):
            print("✅ pdfkit configurado e funcionando!")
            os.remove("test_pdfkit.pdf")
            
            # Criar arquivo de configuração
            config_content = f'''# Configuração do pdfkit para wkhtmltopdf
import pdfkit

# Configuração do wkhtmltopdf
WKHTMLTOPDF_PATH = r"{wkhtmltopdf_path}"
pdfkit_config = pdfkit.configuration(wkhtmltopdf=WKHTMLTOPDF_PATH)

# Função para gerar PDF
def generate_pdf(html_content, output_path):
    return pdfkit.from_string(html_content, output_path, configuration=pdfkit_config)
'''
            
            with open("pdfkit_config.py", "w", encoding="utf-8") as f:
                f.write(config_content)
            
            print("✅ Arquivo de configuração criado: pdfkit_config.py")
            return True
        else:
            print("❌ Teste do pdfkit falhou")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao configurar pdfkit: {e}")
        return False

def main():
    print("🚀 Instalador de wkhtmltopdf para Windows")
    print("=" * 50)
    
    # Verificar se já está instalado
    wkhtmltopdf_path = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
    if os.path.exists(wkhtmltopdf_path):
        print("✅ wkhtmltopdf já está instalado!")
        config_pdfkit_path(wkhtmltopdf_path)
        return
    
    # Instalar wkhtmltopdf
    if install_wkhtmltopdf():
        print("\n🎉 wkhtmltopdf instalado com sucesso!")
        print("💡 O sistema agora deve conseguir gerar PDFs corretamente.")
        print("🔄 Reinicie o aplicativo Flask para aplicar as mudanças.")
    else:
        print("\n❌ Falha na instalação do wkhtmltopdf!")
        print("💡 Tente instalar manualmente:")
        print("   1. Baixe de: https://wkhtmltopdf.org/downloads.html")
        print("   2. Execute o instalador")
        print("   3. Reinicie o aplicativo")

if __name__ == "__main__":
    main()
