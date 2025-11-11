#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de teste para verificar a estrutura da tabela registration_form
e testar o upload de currículo
"""

import pyodbc
import os

def test_database_structure():
    """Testa a estrutura da tabela registration_form"""
    
    # String de conexão
    connection_string = os.environ.get("SQL_SERVER_CONNECTION_STRING")

    if not connection_string:
        raise RuntimeError(
            "Defina a variável de ambiente SQL_SERVER_CONNECTION_STRING antes de executar este teste."
        )
    
    try:
        # Conecta ao banco
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        print("✅ Conectado ao banco de dados com sucesso!")
        
        # Verifica se a tabela existe
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'registration_form'
        """)
        
        if cursor.fetchone():
            print("✅ Tabela 'registration_form' encontrada!")
        else:
            print("❌ Tabela 'registration_form' NÃO encontrada!")
            return
        
        # Verifica a estrutura da tabela
        cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'registration_form'
            ORDER BY ORDINAL_POSITION
        """)
        
        columns = cursor.fetchall()
        print(f"\n📋 Estrutura da tabela 'registration_form' ({len(columns)} colunas):")
        print("-" * 80)
        print(f"{'Coluna':<25} {'Tipo':<15} {'Nulo':<8} {'Padrão'}")
        print("-" * 80)
        
        curriculo_column = None
        for col in columns:
            col_name, data_type, is_nullable, default_val = col
            print(f"{col_name:<25} {data_type:<15} {is_nullable:<8} {default_val or 'NULL'}")
            
            if col_name.lower() == 'curriculo':
                curriculo_column = col
        
        print("-" * 80)
        
        # Verifica especificamente a coluna curriculo
        if curriculo_column:
            print(f"\n📄 Coluna 'curriculo' encontrada:")
            print(f"   Tipo: {curriculo_column[1]}")
            print(f"   Permite NULL: {curriculo_column[2]}")
            print(f"   Valor padrão: {curriculo_column[3] or 'NULL'}")
        else:
            print("\n❌ Coluna 'curriculo' NÃO encontrada!")
            print("   Esta é a causa do problema!")
        
        # Verifica se existem registros com currículo
        cursor.execute("""
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN curriculo IS NOT NULL AND curriculo != '' THEN 1 END) as com_curriculo,
                   COUNT(CASE WHEN curriculo IS NULL OR curriculo = '' THEN 1 END) as sem_curriculo
            FROM registration_form
        """)
        
        stats = cursor.fetchone()
        if stats:
            total, com_curriculo, sem_curriculo = stats
            print(f"\n📊 Estatísticas dos registros:")
            print(f"   Total de registros: {total}")
            print(f"   Com currículo: {com_curriculo}")
            print(f"   Sem currículo: {sem_curriculo}")
        
        # Testa um UPDATE na coluna curriculo
        print(f"\n🧪 Testando UPDATE na coluna curriculo...")
        try:
            cursor.execute("""
                UPDATE TOP(1) registration_form 
                SET curriculo = 'teste_curriculo.pdf'
                WHERE cpf = (SELECT TOP(1) cpf FROM registration_form)
            """)
            
            if cursor.rowcount > 0:
                print("✅ UPDATE na coluna curriculo funcionou!")
                conn.rollback()  # Desfaz o teste
            else:
                print("⚠️  UPDATE não afetou nenhuma linha (pode ser normal se não houver registros)")
                
        except Exception as e:
            print(f"❌ Erro no UPDATE: {str(e)}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro ao conectar ao banco: {str(e)}")

def test_upload_directory():
    """Testa se o diretório de uploads existe e tem permissões"""
    
    upload_dir = os.path.join('static', 'uploads')
    
    print(f"\n📁 Testando diretório de uploads: {upload_dir}")
    
    if os.path.exists(upload_dir):
        print(f"✅ Diretório existe")
        
        # Testa permissões
        try:
            test_file = os.path.join(upload_dir, 'test_permissions.txt')
            with open(test_file, 'w') as f:
                f.write('test')
            os.remove(test_file)
            print("✅ Permissões de escrita OK")
        except Exception as e:
            print(f"❌ Erro de permissões: {str(e)}")
    else:
        print(f"❌ Diretório não existe")
        
        # Tenta criar
        try:
            os.makedirs(upload_dir, exist_ok=True)
            print(f"✅ Diretório criado com sucesso")
        except Exception as e:
            print(f"❌ Erro ao criar diretório: {str(e)}")

if __name__ == "__main__":
    print("🔍 DIAGNÓSTICO DO PROBLEMA DE UPLOAD DE CURRÍCULO")
    print("=" * 60)
    
    test_database_structure()
    test_upload_directory()
    
    print("\n" + "=" * 60)
    print("📝 RESUMO DO DIAGNÓSTICO:")
    print("1. Verifique se a coluna 'curriculo' existe na tabela")
    print("2. Verifique se o diretório 'static/uploads' existe e tem permissões")
    print("3. Verifique se o CPF está sendo enviado corretamente no upload")
    print("4. Verifique os logs do servidor para erros específicos")

