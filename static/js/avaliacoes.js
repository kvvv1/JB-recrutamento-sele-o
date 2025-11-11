document.addEventListener('DOMContentLoaded', function () {
    var avaliacaoRh = document.getElementById('avaliacao_rh');
    var avaliacaoGerencia = document.getElementById('avaliacao_gerencia');
    var sindicancia = document.getElementById('sindicancia'); // Campo de Sindicância
    var admitido = document.getElementById('admitido'); // Campo Admitido
    var situacaoSpan = document.getElementById('form-status');
    var situacaoInput = document.getElementById('situacao');
    var avaliacoesField = document.getElementById('avaliacoesField');
    var cpfInput = document.getElementById('cpf');
    var assinaturaGerencia = document.getElementById('assinatura_gerencia'); // Adicionado campo de assinatura da gerência
    
    // Flag para evitar múltiplos salvamentos em sequência
    var isSaving = false;
    var saveTimeout = null;
    var saveStatusElement = null;

    function atualizarSituacao() {
        // Verificação se os campos estão presentes
        if (!avaliacaoRh || !avaliacaoGerencia || !sindicancia || !situacaoSpan || !situacaoInput) {
            console.error("Campos necessários não encontrados.");
            return;
        }

        // Prioridade 1: Admitido tem prioridade absoluta - Melhorar a verificação para garantir que funcione corretamente
        if (admitido && admitido.value === 'Sim') {
            console.log("Campo admitido = Sim, atualizando situação para Admitido");
            situacaoSpan.textContent = 'Admitido';
            situacaoInput.value = 'Admitido';
            
            // Forçar o salvamento desta alteração para garantir que seja persistida
            if (!isSaving && cpfInput && cpfInput.value) {
                agendarSalvamentoAutomatico();
            }
            
            // Não precisamos verificar as outras condições quando o candidato já está admitido
            return;
        }
        
        // Prioridade 1.5: Em processo de admissão - situação intermediária
        if (admitido && admitido.value === 'Em processo de admissão') {
            console.log("Campo admitido = Em processo de admissão, atualizando situação");
            situacaoSpan.textContent = 'Em processo de admissão';
            situacaoInput.value = 'Em processo de admissão';
            
            // Forçar o salvamento desta alteração para garantir que seja persistida
            if (!isSaving && cpfInput && cpfInput.value) {
                agendarSalvamentoAutomatico();
            }
            
            // Não precisamos verificar as outras condições quando está em processo de admissão
            return;
        }
        
        // Prioridade 2: Se qualquer avaliação for "Reprovado", a situação será "Reprovado"
        else if (avaliacaoRh.value === 'Reprovado' || avaliacaoGerencia.value === 'Reprovado' || sindicancia.value === 'Reprovado') {
            situacaoSpan.textContent = 'Reprovado';
            situacaoInput.value = 'Reprovado';
        }
        // Prioridade 3: Se aprovado no RH e a sindicância está "Em Verificação", situação será "Em Verificação"
        else if (avaliacaoRh.value === 'Aprovado' && sindicancia.value === 'Em Verificação') {
            situacaoSpan.textContent = 'Em Verificação';
            situacaoInput.value = 'Em Verificação';
        }
        // Prioridade 4: Se aprovado no RH, sem verificação ainda, e sem decisão da gerência, situação é "Aprovado RH"
        else if (avaliacaoRh.value === 'Aprovado' && (sindicancia.value === '' || sindicancia.value === null) && (avaliacaoGerencia.value === '' || avaliacaoGerencia.value === null)) {
            situacaoSpan.textContent = 'Aprovado RH';
            situacaoInput.value = 'Aprovado RH';
        }
        // Prioridade 5: Se aprovado em todas as etapas (RH, Sindicância e Gerência), situação será "Aprovado"
        else if (avaliacaoRh.value === 'Aprovado' && sindicancia.value === 'Aprovado' && avaliacaoGerencia.value === 'Aprovado') {
            situacaoSpan.textContent = 'Aprovado';
            situacaoInput.value = 'Aprovado';
        }
        // Prioridade 6: Se RH e Sindicância aprovados, mas gerência ainda está em conversa, situação é "Em Conversa"
        else if (avaliacaoRh.value === 'Aprovado' && sindicancia.value === 'Aprovado' && avaliacaoGerencia.value === 'Em Conversa') {
            situacaoSpan.textContent = 'Em Conversa';
            situacaoInput.value = 'Em Conversa';
        }
        // Prioridade 7: Se Sindicância for aprovada mas Gerência ainda não avaliou, volta para "Aprovado RH"
        else if (avaliacaoRh.value === 'Aprovado' && sindicancia.value === 'Aprovado' && (avaliacaoGerencia.value === '' || avaliacaoGerencia.value === null)) {
            situacaoSpan.textContent = 'Aprovado RH';
            situacaoInput.value = 'Aprovado RH';
        }
        // Prioridade 8: Se nenhuma avaliação foi completamente feita, situação é "Não Avaliado"
        else {
            situacaoSpan.textContent = 'Não Avaliado';
            situacaoInput.value = 'Não Avaliado';
        }

        // Atualizar o campo oculto de avaliações
        if (avaliacoesField) {
            const avaliacoes = {
                rh: avaliacaoRh.value,
                gerencia: avaliacaoGerencia.value,
                sindicancia: sindicancia.value,
                admitido: admitido ? admitido.value : null,
                situacao: situacaoInput.value,
                assinatura_gerencia: assinaturaGerencia ? assinaturaGerencia.value : null // Incluir assinatura da gerência
            };
            avaliacoesField.value = JSON.stringify(avaliacoes);
            
            // Agenda o salvamento automático
            if (cpfInput && cpfInput.value) {
                agendarSalvamentoAutomatico();
            }
        }
    }
    
    // Função para agendar o salvamento automático
    function agendarSalvamentoAutomatico() {
        // Cancela qualquer salvamento pendente
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        // Agenda um novo salvamento após 1 segundo
        saveTimeout = setTimeout(function() {
            salvarAvaliacoes();
        }, 1000);
    }
    
    // Função para salvar as avaliações via AJAX
    function salvarAvaliacoes() {
        // Evita múltiplos salvamentos simultâneos
        if (isSaving) return;
        isSaving = true;
        
        // Cria ou atualiza o elemento de status
        if (!saveStatusElement) {
            saveStatusElement = document.createElement('div');
            saveStatusElement.style.marginTop = '10px';
            saveStatusElement.style.padding = '5px';
            saveStatusElement.style.borderRadius = '3px';
            saveStatusElement.style.fontSize = '0.9em';
            
            // Adiciona próximo ao campo de situação
            const situacaoContainer = situacaoSpan.closest('.form-group');
            if (situacaoContainer) {
                situacaoContainer.appendChild(saveStatusElement);
            }
        }
        
        saveStatusElement.textContent = 'Salvando avaliações...';
        saveStatusElement.style.backgroundColor = '#FFF3CD';
        saveStatusElement.style.color = '#856404';
        
        // Prepara os dados para envio
        const formData = new FormData();
        formData.append('cpf', cpfInput.value);
        formData.append('avaliacoes', avaliacoesField.value);
        formData.append('situacao', situacaoInput.value);
        // Adicionar explicitamente o campo de admitido para garantir que seja salvo
        if (admitido) {
            formData.append('admitido', admitido.value);
        }
        
        // Envia para a rota específica
        fetch('/auto_save_avaliacoes', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                saveStatusElement.textContent = 'Avaliações salvas!';
                saveStatusElement.style.backgroundColor = '#D4EDDA';
                saveStatusElement.style.color = '#155724';
                
                // Remove a mensagem após 3 segundos
                setTimeout(() => {
                    saveStatusElement.textContent = '';
                    saveStatusElement.style.backgroundColor = 'transparent';
                }, 3000);
            } else {
                saveStatusElement.textContent = 'Erro ao salvar: ' + data.message;
                saveStatusElement.style.backgroundColor = '#F8D7DA';
                saveStatusElement.style.color = '#721C24';
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            saveStatusElement.textContent = 'Erro ao salvar as avaliações';
            saveStatusElement.style.backgroundColor = '#F8D7DA';
            saveStatusElement.style.color = '#721C24';
        })
        .finally(() => {
            isSaving = false;
        });
    }

    // Eventos para atualizar a situação ao mudar qualquer campo
    if (avaliacaoRh) avaliacaoRh.addEventListener('change', atualizarSituacao);
    if (avaliacaoGerencia) avaliacaoGerencia.addEventListener('change', atualizarSituacao);
    if (sindicancia) sindicancia.addEventListener('change', atualizarSituacao); // Evento para Sindicância
    if (admitido) admitido.addEventListener('change', atualizarSituacao); // Evento para Admitido
    // Adicionar evento para o campo de assinatura da gerência
    if (assinaturaGerencia) assinaturaGerencia.addEventListener('change', atualizarSituacao);

    // Inicializa a situação ao carregar a página
    atualizarSituacao();
});
