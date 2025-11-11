#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para simular o upload de currículo e testar a comunicação
"""

import requests
import os
import tempfile
import json

def criar_arquivo_teste():
    """Cria um arquivo de teste para upload"""
    # Cria um arquivo temporário
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write("Este é um arquivo de teste para upload de currículo.\n")
        f.write("Data: " + str(os.urandom(100).hex()) + "\n")
        f.write("Fim do arquivo de teste.")
        return f.name

def testar_upload_curriculo():
    """Testa o upload de currículo via HTTP"""
    
    print("🧪 TESTE DE UPLOAD DE CURRÍCULO VIA HTTP")
    print("=" * 60)
    
    # URL do servidor (ajuste conforme necessário)
    base_url = "http://localhost:5050"  # Ajuste a porta se necessário
    
    # Cria arquivo de teste
    arquivo_teste = criar_arquivo_teste()
    print(f"📁 Arquivo de teste criado: {arquivo_teste}")
    
    try:
        # Teste 1: Upload sem CPF
        print("\n1️⃣ TESTE 1: Upload SEM CPF")
        print("-" * 40)
        
        with open(arquivo_teste, 'rb') as f:
            files = {'curriculo': ('teste_sem_cpf.txt', f, 'text/plain')}
            response = requests.post(f"{base_url}/upload_curriculo", files=files)
        
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        try:
            result = response.json()
            print(f"Resposta: {json.dumps(result, indent=2, ensure_ascii=False)}")
        except:
            print(f"Resposta (texto): {response.text}")
        
        # Teste 2: Upload COM CPF
        print("\n2️⃣ TESTE 2: Upload COM CPF")
        print("-" * 40)
        
        with open(arquivo_teste, 'rb') as f:
            files = {'curriculo': ('teste_com_cpf.txt', f, 'text/plain')}
            data = {'cpf': '12345678901'}  # CPF de teste
            response = requests.post(f"{base_url}/upload_curriculo", files=files, data=data)
        
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        try:
            result = response.json()
            print(f"Resposta: {json.dumps(result, indent=2, ensure_ascii=False)}")
        except:
            print(f"Resposta (texto): {response.text}")
        
        # Teste 3: Verificar se o arquivo foi salvo
        print("\n3️⃣ TESTE 3: Verificar arquivo salvo")
        print("-" * 40)
        
        upload_dir = os.path.join('static', 'uploads')
        if os.path.exists(upload_dir):
            arquivos = os.listdir(upload_dir)
            arquivos_teste = [f for f in arquivos if 'teste' in f.lower()]
            print(f"Arquivos na pasta uploads: {len(arquivos)}")
            print(f"Arquivos de teste encontrados: {len(arquivos_teste)}")
            
            if arquivos_teste:
                for arquivo in arquivos_teste:
                    caminho_completo = os.path.join(upload_dir, arquivo)
                    tamanho = os.path.getsize(caminho_completo)
                    print(f"  - {arquivo} ({tamanho} bytes)")
            else:
                print("  Nenhum arquivo de teste encontrado")
        else:
            print("  Pasta uploads não encontrada")
        
        # Teste 4: Verificar banco de dados
        print("\n4️⃣ TESTE 4: Verificar banco de dados")
        print("-" * 40)
        
        # Aqui você pode adicionar uma verificação no banco se necessário
        print("  Verificação do banco de dados seria feita aqui")
        
    except requests.exceptions.ConnectionError:
        print("❌ Erro de conexão: Servidor não está rodando ou porta incorreta")
        print(f"   Tente ajustar a URL base: {base_url}")
    except Exception as e:
        print(f"❌ Erro durante o teste: {str(e)}")
    
    finally:
        # Limpa arquivo de teste
        if os.path.exists(arquivo_teste):
            os.unlink(arquivo_teste)
            print(f"\n🧹 Arquivo de teste removido: {arquivo_teste}")

def testar_upload_com_curl():
    """Testa o upload usando curl (se disponível)"""
    
    print("\n🔄 TESTE ALTERNATIVO: Usando curl")
    print("=" * 60)
    
    # Cria arquivo de teste
    arquivo_teste = criar_arquivo_teste()
    print(f"📁 Arquivo de teste criado: {arquivo_teste}")
    
    try:
        # Comando curl para teste
        curl_cmd = f'curl -X POST -F "curriculo=@{arquivo_teste}" -F "cpf=12345678901" http://localhost:5050/upload_curriculo'
        
        print(f"Comando curl:")
        print(f"  {curl_cmd}")
        
        print("\nExecute este comando em outro terminal para testar o upload.")
        print("Ou copie e cole em um terminal separado.")
        
    except Exception as e:
        print(f"❌ Erro ao preparar comando curl: {str(e)}")
    
    finally:
        # Limpa arquivo de teste
        if os.path.exists(arquivo_teste):
            os.unlink(arquivo_teste)
            print(f"\n🧹 Arquivo de teste removido: {arquivo_teste}")

if __name__ == "__main__":
    print("🚀 INICIANDO TESTES DE UPLOAD")
    print("=" * 60)
    
    # Verifica se o servidor está rodando
    try:
        response = requests.get("http://localhost:5050", timeout=5)
        print("✅ Servidor está rodando")
    except:
        print("⚠️  Servidor não está rodando ou não responde")
        print("   Certifique-se de que o Flask está executando")
        print("   Tente executar: python app.py")
        print()
    
    # Executa os testes
    testar_upload_curriculo()
    testar_upload_com_curl()
    
    print("\n" + "=" * 60)
    print("📝 RESUMO DOS TESTES:")
    print("1. Teste de upload sem CPF")
    print("2. Teste de upload com CPF")
    print("3. Verificação de arquivos salvos")
    print("4. Verificação do banco de dados")
    print("5. Comando curl alternativo")
    print("\n💡 DICAS:")
    print("- Verifique se o servidor Flask está rodando")
    print("- Verifique os logs do servidor durante o teste")
    print("- Use o comando curl como alternativa")
    print("- Verifique se a pasta static/uploads existe e tem permissões")

