/**
 * Script para melhorar a submissão do formulário de registro
 * Com controle de timeout e melhor tratamento de erros
 */
document.addEventListener("DOMContentLoaded", function () {
    const openConfirmModalButton = document.getElementById("openConfirmModal");
    if (!openConfirmModalButton) return;

    openConfirmModalButton.dataset.originalText = openConfirmModalButton.innerHTML;

    const confirmSubmitModal = new bootstrap.Modal(document.getElementById("confirmSubmitModal"));
    const successModal = new bootstrap.Modal(document.getElementById("successModal"));
    const confirmSubmitButton = document.getElementById("confirmSubmitButton");
    const form = document.getElementById("registrationForm");

    if (!confirmSubmitButton || !form) return;

    openConfirmModalButton.addEventListener("click", function () {
        confirmSubmitModal.show();
    });

    // Função para tentar enviar o formulário com retentativas
    function submitFormWithRetry(maxRetries = 3, currentRetry = 0) {
        // Mostrar status de salvamento
        openConfirmModalButton.disabled = true;
        openConfirmModalButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando... ' + 
            (currentRetry > 0 ? `(tentativa ${currentRetry+1}/${maxRetries+1})` : '');
        
        // Configurar um timeout maior para evitar espera infinita
        const timeoutDuration = 30000; // 30 segundos (aumentado de 15s)
        let timeoutId = setTimeout(() => {
            console.error("Tempo esgotado ao tentar salvar o formulário");
            
            // Se ainda temos tentativas restantes
            if (currentRetry < maxRetries) {
                console.log(`Tentando novamente (${currentRetry+1}/${maxRetries})`);
                submitFormWithRetry(maxRetries, currentRetry + 1);
            } else {
                alert("O tempo para salvar o formulário esgotou após várias tentativas. Por favor, verifique sua conexão e tente novamente.");
                openConfirmModalButton.disabled = false;
                openConfirmModalButton.innerHTML = openConfirmModalButton.dataset.originalText;
            }
        }, timeoutDuration);
        
        console.log("Enviando formulário para: " + form.action + " (tentativa " + (currentRetry+1) + ")");
        
        // Envio do formulário manualmente com tratamento de erro melhorado
        fetch(form.action, {
            method: form.method,
            body: new FormData(form),
            // Aumentar o tempo limite de conexão
            signal: AbortSignal.timeout(timeoutDuration - 1000)
        })
            .then(response => {
                console.log("Resposta recebida:", response.status);
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error('Erro na resposta do servidor: ' + response.status + ' ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                console.log("Dados da resposta:", data);
                if (data.success) {
                    successModal.show();
                    // Obter o CPF diretamente do campo do formulário
                    const cpf = document.getElementById('cpf').value;
                    console.log("CPF obtido do formulário:", cpf);
                    
                    // Resetar a flag de salvamento manual
                    if (window.isManualSaving !== undefined) {
                        window.isManualSaving = false;
                    }
                    
                    // Sincronizar backups locais com o servidor
                    syncLocalBackupWithServer(cpf);
                    
                    setTimeout(() => {
                        window.location.href = '/view_form/' + cpf;
                    }, 1500);
                } else {
                    // Se houver falha mas ainda temos tentativas
                    if (currentRetry < maxRetries) {
                        console.log(`Erro do servidor. Tentando novamente (${currentRetry+1}/${maxRetries})`);
                        setTimeout(() => {
                            submitFormWithRetry(maxRetries, currentRetry + 1);
                        }, 2000); // espera 2 segundos antes de tentar novamente
                    } else {
                        alert("Erro ao salvar o formulário: " + (data.message || "Erro desconhecido"));
                        openConfirmModalButton.disabled = false;
                        openConfirmModalButton.innerHTML = openConfirmModalButton.dataset.originalText;
                        
                        // Resetar a flag de salvamento manual em caso de erro
                        if (window.isManualSaving !== undefined) {
                            window.isManualSaving = false;
                        }
                    }
                }
            })
            .catch(error => {
                clearTimeout(timeoutId);
                console.error("Erro ao enviar o formulário:", error);
                
                // Se for um erro de rede e ainda temos tentativas
                if ((error.name === 'TypeError' || error.message.includes('Failed to fetch')) && currentRetry < maxRetries) {
                    console.log(`Erro de conexão. Tentando novamente (${currentRetry+1}/${maxRetries})`);
                    setTimeout(() => {
                        submitFormWithRetry(maxRetries, currentRetry + 1);
                    }, 3000); // espera 3 segundos antes de tentar novamente
                } else {
                    alert("Erro ao salvar o formulário: " + error.message);
                    openConfirmModalButton.disabled = false;
                    openConfirmModalButton.innerHTML = openConfirmModalButton.dataset.originalText;
                    
                    // Resetar a flag de salvamento manual em caso de erro
                    if (window.isManualSaving !== undefined) {
                        window.isManualSaving = false;
                    }
                    
                    // Salvar em localStorage como último recurso
                    try {
                        const formData = new FormData(form);
                        const dataObj = {};
                        for (const [key, value] of formData.entries()) {
                            dataObj[key] = value;
                        }
                        
                        const cpf = document.getElementById('cpf')?.value;
                        if (cpf) {
                            localStorage.setItem(`emergency_backup_${cpf}`, JSON.stringify({
                                data: dataObj,
                                timestamp: new Date().toISOString(),
                                url: form.action
                            }));
                            alert("Seus dados foram salvos localmente como backup. Tente enviar novamente quando a conexão for restaurada.");
                        }
                    } catch (backupError) {
                        console.error("Não foi possível salvar backup local:", backupError);
                    }
                }
            });
    }

    confirmSubmitButton.addEventListener("click", function () {
        confirmSubmitModal.hide();
        submitFormWithRetry();
    });
});

// Função para sincronizar backups locais com o servidor
function syncLocalBackupWithServer(cpf) {
    try {
        // Verificar se há backup local para o CPF
        const backupKey = `ficha_backup_${cpf}`;
        const emergencyKey = `emergency_backup_${cpf}`;
        const backup = localStorage.getItem(backupKey) || localStorage.getItem(emergencyKey);
        
        if (backup) {
            console.log("Enviando backup local para o servidor...");
            const backupData = JSON.parse(backup);
            
            // Enviar para o servidor
            fetch('/sync_local_backup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    cpf: cpf,
                    backup_data: backupData.data,
                    timestamp: backupData.timestamp
                })
            })
            .then(response => {
                if (response.ok) {
                    console.log("Backup sincronizado com o servidor com sucesso");
                    // Remover backup local após sincronização bem-sucedida
                    localStorage.removeItem(backupKey);
                    localStorage.removeItem(emergencyKey);
                } else {
                    console.error("Erro ao sincronizar backup com o servidor:", response.statusText);
                }
            })
            .catch(error => {
                console.error("Erro ao sincronizar backup:", error);
            });
        }
    } catch (error) {
        console.error("Erro ao processar sincronização de backup:", error);
    }
} 