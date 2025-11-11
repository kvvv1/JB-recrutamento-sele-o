document.addEventListener('DOMContentLoaded', function () {
    // Elementos de avaliação
    const avaliacaoRH = document.getElementById('avaliacao_rh');
    const avaliacaoGerencia = document.getElementById('avaliacao_gerencia');
    
    // Divs que contêm os textareas de motivo de reprovação
    const divMotivoReprovacaoRH = document.getElementById('motivo_reprovacao_rh_container');
    const divMotivoReprovacaoGerente = document.getElementById('motivo_reprovacao_gerente_container');
    
    // Textareas de motivo de reprovação
    const textareaMotivoReprovacaoRH = document.getElementById('motivo_reprovacao_rh_textarea');
    const textareaMotivoReprovacaoGerente = document.getElementById('motivo_reprovacao_gerente_textarea');
    
    // Função para verificar e mostrar/esconder o motivo de reprovação do RH
    function verificarAvaliacaoRH() {
        console.log("Verificando avaliação RH: " + avaliacaoRH.value);
        if (avaliacaoRH.value === 'Reprovado') {
            divMotivoReprovacaoRH.style.display = 'block';
            textareaMotivoReprovacaoRH.disabled = false; // Garantir que o campo está habilitado
        } else {
            divMotivoReprovacaoRH.style.display = 'none';
            // Não desabilitar para garantir que o valor seja enviado mesmo quando oculto
            // textareaMotivoReprovacaoRH.disabled = true;
        }
    }
    
    // Função para verificar e mostrar/esconder o motivo de reprovação do Gerente
    function verificarAvaliacaoGerencia() {
        console.log("Verificando avaliação Gerência: " + avaliacaoGerencia.value);
        if (avaliacaoGerencia.value === 'Reprovado') {
            divMotivoReprovacaoGerente.style.display = 'block';
            textareaMotivoReprovacaoGerente.disabled = false; // Garantir que o campo está habilitado
        } else {
            divMotivoReprovacaoGerente.style.display = 'none';
            // Não desabilitar para garantir que o valor seja enviado mesmo quando oculto
            // textareaMotivoReprovacaoGerente.disabled = true;
        }
    }
    
    // Adicionar listeners aos selects de avaliação
    if (avaliacaoRH) {
        avaliacaoRH.addEventListener('change', function() {
            verificarAvaliacaoRH();
            
            // Disparar evento de alteração para o auto-save
            if (typeof autoSave === 'function') {
                setTimeout(autoSave, 500);
            }
        });
    }
    
    if (avaliacaoGerencia) {
        avaliacaoGerencia.addEventListener('change', function() {
            verificarAvaliacaoGerencia();
            
            // Disparar evento de alteração para o auto-save
            if (typeof autoSave === 'function') {
                setTimeout(autoSave, 500);
            }
        });
    }
    
    // Garantir que os textareas também acionem o auto-save quando editados
    if (textareaMotivoReprovacaoRH) {
        textareaMotivoReprovacaoRH.addEventListener('input', function() {
            console.log("Texto de reprovação RH modificado: " + textareaMotivoReprovacaoRH.value);
            // Disparar evento de alteração para o auto-save
            if (typeof autoSave === 'function') {
                setTimeout(autoSave, 1000);
            }
        });
    }
    
    if (textareaMotivoReprovacaoGerente) {
        textareaMotivoReprovacaoGerente.addEventListener('input', function() {
            console.log("Texto de reprovação Gerente modificado: " + textareaMotivoReprovacaoGerente.value);
            // Disparar evento de alteração para o auto-save
            if (typeof autoSave === 'function') {
                setTimeout(autoSave, 1000);
            }
        });
    }

    // Verificar os estados iniciais para exibir corretamente os campos
    verificarAvaliacaoRH();
    verificarAvaliacaoGerencia();
});
