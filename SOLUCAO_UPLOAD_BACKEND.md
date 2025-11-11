# Solução para Problema de Upload de Currículo - Backend

## Problema Identificado
O upload de currículo não está funcionando corretamente no backend, causando erro e recarregamento da página.

## Soluções Implementadas

### 1. Configurações Globais do Flask ✅
Adicionadas configurações específicas para uploads no início do arquivo `app.py`:

```python
# Configurações para upload de arquivos
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'doc', 'docx', 'txt'}

# Garante que o diretório de uploads existe
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])
    print(f"Diretório de uploads criado: {app.config['UPLOAD_FOLDER']}")

def allowed_file(filename):
    """Verifica se a extensão do arquivo é permitida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']
```

### 2. Função de Validação ✅
Criada função `allowed_file()` para validar extensões permitidas.

### 3. Rota de Upload Melhorada ✅
Atualizada a rota `/upload_curriculo` com:
- Validação de tipo de arquivo
- Validação de tamanho (máximo 10MB)
- Uso das configurações globais
- Melhor tratamento de erros e logging
- Uso do diretório configurado

### 4. Validações Implementadas ✅
- **Tipo de arquivo**: Apenas PDF, DOC, DOCX, TXT
- **Tamanho**: Máximo 10MB
- **Nome seguro**: Usa `secure_filename()` para evitar problemas de segurança
- **Diretório**: Usa configuração global `UPLOAD_FOLDER`

## Como Testar

### 1. Reinicie o Servidor Flask
```bash
# Pare o servidor atual (Ctrl+C)
# Execute novamente
python app.py
```

### 2. Verifique os Logs
Ao tentar fazer upload, verifique o console do servidor para mensagens como:
- "Iniciando upload de currículo..."
- "Arquivo salvo com sucesso: [caminho]"
- Ou mensagens de erro específicas

### 3. Teste com Diferentes Arquivos
- ✅ Arquivo PDF pequeno (< 10MB)
- ✅ Arquivo DOC pequeno (< 10MB)
- ❌ Arquivo muito grande (> 10MB)
- ❌ Tipo de arquivo não permitido (ex: .exe, .jpg)

## Possíveis Problemas e Soluções

### Problema: "Erro interno: [mensagem]"
**Solução**: Verifique os logs do servidor para detalhes específicos

### Problema: "Tipo de arquivo não permitido"
**Solução**: Use apenas PDF, DOC, DOCX ou TXT

### Problema: "Arquivo muito grande"
**Solução**: Reduza o tamanho do arquivo para menos de 10MB

### Problema: "Erro ao salvar o arquivo"
**Solução**: Verifique permissões do diretório `static/uploads`

## Verificações Adicionais

### 1. Permissões do Diretório
```bash
# Verifique se o diretório tem permissões de escrita
dir static\uploads
```

### 2. Espaço em Disco
```bash
# Verifique se há espaço suficiente
dir
```

### 3. Logs do Servidor
- Execute o servidor em modo debug
- Verifique mensagens de erro no console

## Status das Correções

- ✅ Configurações globais adicionadas
- ✅ Função de validação criada
- ✅ Rota de upload melhorada
- ✅ Validações implementadas
- ✅ Tratamento de erros melhorado
- ✅ Logging adicionado

## Próximos Passos

1. **Reinicie o servidor Flask**
2. **Teste o upload** com um arquivo pequeno
3. **Verifique os logs** para mensagens de sucesso/erro
4. **Reporte problemas** específicos se persistirem

## Arquivos Modificados

- `app.py` - Configurações globais e rota de upload
- `templates/view_registration.html` - Frontend do upload (já corrigido)

## Notas Importantes

- O servidor deve ser reiniciado após as mudanças
- Verifique sempre os logs do servidor para debugging
- Teste com arquivos pequenos primeiro
- Mantenha o diretório `static/uploads` com permissões adequadas

