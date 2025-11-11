# Solução para Problema de Upload de Currículo

## Problema Identificado
O upload de currículo não está funcionando corretamente, causando erro e recarregamento da página.

## Soluções Implementadas

### 1. Melhorias no Frontend (JavaScript)
- ✅ Adicionado validação de arquivo antes do envio
- ✅ Adicionado feedback visual durante o upload
- ✅ Adicionado tratamento de erros mais robusto
- ✅ Adicionado logs de debugging no console
- ✅ Adicionado validação de tamanho (máximo 10MB)
- ✅ Adicionado validação de tipo de arquivo (PDF, DOC, DOCX, TXT)

### 2. Melhorias no Backend (Python/Flask)
- ✅ Configurações específicas para uploads
- ✅ Validação de extensões permitidas
- ✅ Limite de tamanho de arquivo configurado
- ✅ Melhor tratamento de erros e logging
- ✅ Criação automática do diretório de uploads

### 3. Verificações Realizadas
- ✅ Diretório `static/uploads` existe e tem permissões
- ✅ Rota `/upload_curriculo` está funcionando
- ✅ Arquivos estão sendo salvos corretamente

## Como Testar

### 1. Abra o Console do Navegador
- Pressione F12 ou clique com botão direito → Inspecionar
- Vá para a aba "Console"

### 2. Tente Fazer Upload
- Selecione um arquivo PDF, DOC, DOCX ou TXT
- Clique em "Enviar"
- Observe as mensagens no console

### 3. Verifique as Mensagens
- Deve aparecer: "Botão de upload clicado"
- Deve aparecer: "Arquivo selecionado: [nome do arquivo]"
- Deve aparecer: "FormData criado, enviando para /upload_curriculo..."

## Possíveis Problemas e Soluções

### Problema: "Nenhum arquivo enviado"
**Solução:** Verifique se o arquivo foi selecionado corretamente

### Problema: "Tipo de arquivo não permitido"
**Solução:** Use apenas PDF, DOC, DOCX ou TXT

### Problema: "Arquivo muito grande"
**Solução:** Arquivo deve ter menos de 10MB

### Problema: "Erro interno do servidor"
**Solução:** Verifique os logs do servidor Flask

## Logs do Servidor
Para ver os logs do servidor, execute o Flask em modo debug:
```bash
python app.py
```

## Arquivos Modificados
1. `templates/view_registration.html` - Frontend melhorado
2. `app.py` - Backend com configurações de upload

## Próximos Passos
1. Teste o upload com um arquivo pequeno (PDF ou TXT)
2. Verifique o console do navegador para mensagens de erro
3. Se ainda houver problemas, verifique os logs do servidor
4. Teste com diferentes tipos de arquivo

## Contato para Suporte
Se o problema persistir, forneça:
- Mensagens de erro do console
- Logs do servidor
- Tipo e tamanho do arquivo tentado
- Versão do navegador

