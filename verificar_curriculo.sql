-- Script para verificar e testar a coluna curriculo
-- Execute este script no SQL Server Management Studio ou via pyodbc

USE SistemaRS;
GO

-- 1. Verificar estrutura detalhada da coluna curriculo
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'registration_form' 
AND COLUMN_NAME = 'curriculo';

-- 2. Verificar se há constraints na coluna
SELECT 
    c.CONSTRAINT_NAME,
    c.CONSTRAINT_TYPE,
    cc.COLUMN_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS c
JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE cc 
    ON c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
WHERE c.TABLE_NAME = 'registration_form' 
AND cc.COLUMN_NAME = 'curriculo';

-- 3. Verificar estatísticas dos registros com currículo
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN curriculo IS NOT NULL THEN 1 END) as com_curriculo,
    COUNT(CASE WHEN curriculo IS NULL THEN 1 END) as sem_curriculo,
    COUNT(CASE WHEN curriculo = '' THEN 1 END) as curriculo_vazio,
    COUNT(CASE WHEN curriculo IS NOT NULL AND curriculo != '' THEN 1 END) as curriculo_preenchido
FROM registration_form;

-- 4. Verificar alguns exemplos de registros com currículo
SELECT TOP 10
    cpf,
    nome_completo,
    curriculo,
    created_at,
    last_updated
FROM registration_form 
WHERE curriculo IS NOT NULL 
AND curriculo != ''
ORDER BY last_updated DESC;

-- 5. Verificar alguns exemplos de registros sem currículo
SELECT TOP 10
    cpf,
    nome_completo,
    curriculo,
    created_at,
    last_updated
FROM registration_form 
WHERE curriculo IS NULL 
OR curriculo = ''
ORDER BY last_updated DESC;

-- 6. Testar UPDATE em um registro específico (substitua o CPF por um existente)
-- DECLARE @cpf_teste VARCHAR(11) = '12345678901'; -- Substitua por um CPF real
-- 
-- UPDATE registration_form 
-- SET curriculo = 'teste_curriculo.pdf',
--     last_updated = CURRENT_TIMESTAMP
-- WHERE cpf = @cpf_teste;
-- 
-- SELECT @@ROWCOUNT as linhas_afetadas;
-- 
-- -- Verificar o resultado
-- SELECT cpf, nome_completo, curriculo, last_updated
-- FROM registration_form 
-- WHERE cpf = @cpf_teste;

-- 7. Verificar se há triggers na tabela
SELECT 
    t.name as trigger_name,
    t.is_disabled,
    t.create_date
FROM sys.triggers t
JOIN sys.tables tab ON t.parent_id = tab.object_id
WHERE tab.name = 'registration_form';

-- 8. Verificar permissões do usuário atual
SELECT 
    p.permission_name,
    p.state_desc,
    s.name as schema_name,
    o.name as object_name
FROM sys.database_permissions p
JOIN sys.objects o ON p.major_id = o.object_id
JOIN sys.schemas s ON o.schema_id = s.schema_id
WHERE o.name = 'registration_form'
AND p.grantee_principal_id = USER_ID();

-- 9. Verificar se há índices na coluna curriculo
SELECT 
    i.name as index_name,
    i.type_desc,
    ic.key_ordinal,
    c.name as column_name
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE OBJECT_NAME(i.object_id) = 'registration_form'
AND c.name = 'curriculo';

-- 10. Verificar se há problemas de encoding ou caracteres especiais
SELECT TOP 20
    cpf,
    nome_completo,
    curriculo,
    LEN(curriculo) as tamanho_curriculo,
    ASCII(LEFT(curriculo, 1)) as primeiro_caractere_ascii
FROM registration_form 
WHERE curriculo IS NOT NULL 
AND curriculo != ''
ORDER BY last_updated DESC;

