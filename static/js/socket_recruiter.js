document.addEventListener('DOMContentLoaded', function () {
    const recruiterSelect = document.getElementById('recrutador-select');
    const cpfInput = document.getElementById('cpf');
    let cpf = '';
    
    if (cpfInput) {
        cpf = cpfInput.value;
    } else {
        // Se não encontrar o input, tenta extrair o CPF da URL
        const urlParts = window.location.pathname.split('/');
        const cpfIndex = urlParts.indexOf('view_form') + 1;
        if (cpfIndex > 0 && cpfIndex < urlParts.length) {
            cpf = urlParts[cpfIndex];
        }
    }

    console.log('Socket Recruiter inicializado. CPF:', cpf);

    // Adiciona evento de mudança ao select de recrutador
    if (recruiterSelect) {
        recruiterSelect.addEventListener('change', function() {
            const selectedRecruiter = recruiterSelect.value;

            if (!selectedRecruiter || !cpf) {
                console.error('Recrutador ou CPF não disponível para atualização');
                return;
            }
            
            console.log('Atualizando recrutador para:', selectedRecruiter);
            
            // Mostra indicador visual de carregamento
            const recrutadorElement = document.getElementById('recrutador');
            if (recrutadorElement) {
                const textoOriginal = recrutadorElement.textContent;
                recrutadorElement.textContent = "Atualizando...";
                
                // Atualizar diretamente via fetch, sem tentar usar o socket
                atualizarRecrutadorViaFetch(cpf, selectedRecruiter, recrutadorElement, textoOriginal);
            }
        });
    }

    // Função para atualizar via fetch (fallback)
    function atualizarRecrutadorViaFetch(cpf, recrutador, elementoRecrutador, textoOriginal) {
        fetch('/set_recruiter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams({
                'cpf': cpf,
                'recrutador': recrutador
            })
        })
        .then(response => {
            // Verifica se a resposta é JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json().then(data => {
                    return { 
                        ok: response.ok, 
                        status: response.status, 
                        data: data 
                    };
                });
            } else {
                // Para respostas não-JSON (como redirecionamentos)
                return { 
                    ok: response.ok, 
                    status: response.status, 
                    data: { success: response.ok } 
                };
            }
        })
        .then(result => {
            // Considera respostas 200 OK, 302 Found (redirecionamento) ou dados com success=true como bem-sucedidas
            if (result.ok || (result.data && result.data.success)) {
                if (elementoRecrutador) {
                    elementoRecrutador.textContent = "Recrutador: " + recrutador;
                }
                
                // Exibe notificação se disponível
                if (typeof showAutoSavePopup === 'function') {
                    showAutoSavePopup('Recrutador atualizado com sucesso!');
                    
                    // Atualiza o estado inicial do formulário
                    if (typeof getCurrentFormData === 'function' && typeof initialFormData !== 'undefined') {
                        initialFormData = JSON.stringify(getCurrentFormData());
                    }
                } else {
                    // Recarrega a página
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            } else {
                if (elementoRecrutador) {
                    elementoRecrutador.textContent = textoOriginal || "Erro na atualização";
                }
                
                console.error('Erro ao definir recrutador:', result);
                alert('Erro ao definir recrutador. Tente novamente.');
            }
        })
        .catch(error => {
            if (elementoRecrutador) {
                elementoRecrutador.textContent = textoOriginal || "Erro na atualização";
            }
            
            console.error('Erro na requisição:', error);
            alert('Erro ao comunicar com o servidor. Tente novamente.');
        });
    }
});
