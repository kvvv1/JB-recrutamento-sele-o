#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar detalhes específicos da coluna curriculo
"""

import pyodbc
import os

def verificar_curriculo_detalhado():
    """Verifica detalhes específicos da coluna curriculo"""
    
    connection_string = os.environ.get("SQL_SERVER_CONNECTION_STRING")

    if not connection_string:
        raise RuntimeError(
            "Defina a variável de ambiente SQL_SERVER_CONNECTION_STRING antes de executar este script."
        )
    
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        print("🔍 VERIFICAÇÃO DETALHADA DA COLUNA CURRÍCULO")
        print("=" * 60)
        
        # 1. Estrutura detalhada da coluna
        print("\n1️⃣ ESTRUTURA DA COLUNA:")
        cursor.execute("""
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE,
                COLUMN_DEFAULT,
                COLLATION_NAME
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'registration_form' 
            AND COLUMN_NAME = 'curriculo'
        """)
        
        col_info = cursor.fetchone()
        if col_info:
            print(f"   Nome: {col_info[0]}")
            print(f"   Tipo: {col_info[1]}")
            print(f"   Tamanho máximo: {col_info[2]}")
            print(f"   Permite NULL: {col_info[3]}")
            print(f"   Valor padrão: {col_info[4] or 'NULL'}")
            print(f"   Collation: {col_info[5] or 'NULL'}")
        else:
            print("   ❌ Coluna não encontrada!")
            return
        
        # 2. Constraints na coluna
        print("\n2️⃣ CONSTRAINTS:")
        cursor.execute("""
            SELECT 
                c.CONSTRAINT_NAME,
                c.CONSTRAINT_TYPE,
                cc.COLUMN_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS c
            JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE cc 
                ON c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
            WHERE c.TABLE_NAME = 'registration_form' 
            AND cc.COLUMN_NAME = 'curriculo'
        """)
        
        constraints = cursor.fetchall()
        if constraints:
            for constraint in constraints:
                print(f"   {constraint[1]}: {constraint[0]}")
        else:
            print("   Nenhuma constraint encontrada")
        
        # 3. Estatísticas detalhadas
        print("\n3️⃣ ESTATÍSTICAS DETALHADAS:")
        cursor.execute("""
            SELECT 
                COUNT(*) as total_registros,
                COUNT(CASE WHEN curriculo IS NOT NULL THEN 1 END) as com_curriculo,
                COUNT(CASE WHEN curriculo IS NULL THEN 1 END) as sem_curriculo,
                COUNT(CASE WHEN curriculo = '' THEN 1 END) as curriculo_vazio,
                COUNT(CASE WHEN curriculo IS NOT NULL AND curriculo != '' THEN 1 END) as curriculo_preenchido
            FROM registration_form
        """)
        
        stats = cursor.fetchone()
        if stats:
            total, com_curriculo, sem_curriculo, vazio, preenchido = stats
            print(f"   Total: {total}")
            print(f"   Com currículo: {com_curriculo}")
            print(f"   Sem currículo: {sem_curriculo}")
            print(f"   Currículo vazio: {vazio}")
            print(f"   Currículo preenchido: {preenchido}")
        
        # 4. Exemplos de registros com currículo
        print("\n4️⃣ EXEMPLOS COM CURRÍCULO (últimos 5):")
        cursor.execute("""
            SELECT TOP 5
                cpf,
                nome_completo,
                curriculo,
                created_at,
                last_updated
            FROM registration_form 
            WHERE curriculo IS NOT NULL 
            AND curriculo != ''
            ORDER BY last_updated DESC
        """)
        
        exemplos_com = cursor.fetchall()
        if exemplos_com:
            for exemplo in exemplos_com:
                cpf, nome, curriculo, created, updated = exemplo
                print(f"   CPF: {cpf}")
                print(f"   Nome: {nome}")
                print(f"   Currículo: {curriculo}")
                print(f"   Criado: {created}")
                print(f"   Atualizado: {updated}")
                print("   " + "-" * 40)
        else:
            print("   Nenhum exemplo encontrado")
        
        # 5. Exemplos de registros sem currículo
        print("\n5️⃣ EXEMPLOS SEM CURRÍCULO (últimos 5):")
        cursor.execute("""
            SELECT TOP 5
                cpf,
                nome_completo,
                curriculo,
                created_at,
                last_updated
            FROM registration_form 
            WHERE curriculo IS NULL 
            OR curriculo = ''
            ORDER BY last_updated DESC
        """)
        
        exemplos_sem = cursor.fetchall()
        if exemplos_sem:
            for exemplo in exemplos_sem:
                cpf, nome, curriculo, created, updated = exemplo
                print(f"   CPF: {cpf}")
                print(f"   Nome: {nome}")
                print(f"   Currículo: {curriculo}")
                print(f"   Criado: {created}")
                print(f"   Atualizado: {updated}")
                print("   " + "-" * 40)
        else:
            print("   Nenhum exemplo encontrado")
        
        # 6. Testar UPDATE em um registro específico
        print("\n6️⃣ TESTE DE UPDATE:")
        # Pega um CPF existente para teste
        cursor.execute("SELECT TOP 1 cpf FROM registration_form WHERE curriculo IS NULL OR curriculo = ''")
        cpf_teste = cursor.fetchone()
        
        if cpf_teste:
            cpf_teste = cpf_teste[0]
            print(f"   Testando UPDATE com CPF: {cpf_teste}")
            
            try:
                cursor.execute("""
                    UPDATE registration_form 
                    SET curriculo = 'teste_curriculo.pdf',
                        last_updated = CURRENT_TIMESTAMP
                    WHERE cpf = ?
                """, (cpf_teste,))
                
                if cursor.rowcount > 0:
                    print("   ✅ UPDATE realizado com sucesso!")
                    
                    # Verifica o resultado
                    cursor.execute("SELECT cpf, nome_completo, curriculo, last_updated FROM registration_form WHERE cpf = ?", (cpf_teste,))
                    resultado = cursor.fetchone()
                    if resultado:
                        print(f"   Resultado: CPF={resultado[0]}, Nome={resultado[1]}, Currículo={resultado[2]}")
                    
                    # Desfaz o teste
                    cursor.execute("""
                        UPDATE registration_form 
                        SET curriculo = NULL,
                            last_updated = CURRENT_TIMESTAMP
                        WHERE cpf = ?
                    """, (cpf_teste,))
                    print("   🔄 Teste desfeito (currículo removido)")
                    
                else:
                    print("   ⚠️  UPDATE não afetou nenhuma linha")
                    
            except Exception as e:
                print(f"   ❌ Erro no UPDATE: {str(e)}")
        else:
            print("   ⚠️  Nenhum CPF disponível para teste")
        
        # 7. Verificar triggers
        print("\n7️⃣ TRIGGERS:")
        cursor.execute("""
            SELECT 
                t.name as trigger_name,
                t.is_disabled,
                t.create_date
            FROM sys.triggers t
            JOIN sys.tables tab ON t.parent_id = tab.object_id
            WHERE tab.name = 'registration_form'
        """)
        
        triggers = cursor.fetchall()
        if triggers:
            for trigger in triggers:
                status = "Desabilitado" if trigger[1] else "Habilitado"
                print(f"   {trigger[0]} ({status}) - Criado em: {trigger[2]}")
        else:
            print("   Nenhum trigger encontrado")
        
        # 8. Verificar permissões
        print("\n8️⃣ PERMISSÕES:")
        cursor.execute("""
            SELECT 
                p.permission_name,
                p.state_desc
            FROM sys.database_permissions p
            JOIN sys.objects o ON p.major_id = o.object_id
            WHERE o.name = 'registration_form'
            AND p.grantee_principal_id = USER_ID()
        """)
        
        permissions = cursor.fetchall()
        if permissions:
            for perm in permissions:
                print(f"   {perm[0]}: {perm[1]}")
        else:
            print("   Nenhuma permissão específica encontrada")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 60)
        print("📝 RESUMO DA VERIFICAÇÃO:")
        print("✅ Estrutura da coluna verificada")
        print("✅ Constraints verificadas")
        print("✅ Estatísticas analisadas")
        print("✅ Exemplos de registros verificados")
        print("✅ Teste de UPDATE realizado")
        print("✅ Triggers verificados")
        print("✅ Permissões verificadas")
        
    except Exception as e:
        print(f"❌ Erro na verificação: {str(e)}")

if __name__ == "__main__":
    verificar_curriculo_detalhado()

