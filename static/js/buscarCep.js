/**
 * Função para normalizar CEP (remove caracteres não numéricos)
 * @param {string} cep - CEP a ser normalizado
 * @returns {string} - CEP apenas com números
 */
function normalizarCEP(cep) {
    if (!cep) return '';
    return cep.replace(/\D/g, '');
}

/**
 * Função para validar formato de CEP
 * @param {string} cep - CEP a ser validado
 * @returns {boolean} - true se válido
 */
function validarCEP(cep) {
    const cepNormalizado = normalizarCEP(cep);
    return /^[0-9]{8}$/.test(cepNormalizado);
}

/**
 * Busca CEP usando a API ViaCEP
 * @param {string} cep - CEP normalizado (apenas números)
 * @returns {Promise<Object>} - Dados do endereço ou null em caso de erro
 */
async function buscarCEPViaCEP(cep) {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('[CEP] ViaCEP: Erro HTTP', response.status);
            return null;
        }

        const data = await response.json();

        // ViaCEP retorna {erro: true} quando não encontra
        if (data.erro === true) {
            console.warn('[CEP] ViaCEP: CEP não encontrado');
            return null;
        }

        // Verifica se tem dados válidos
        if (data && data.cep) {
            return {
                logradouro: data.logradouro || '',
                bairro: data.bairro || '',
                cidade: data.localidade || '',
                uf: data.uf || '',
                cep: data.cep || cep
            };
        }

        return null;
    } catch (error) {
        console.error('[CEP] Erro ao buscar com ViaCEP:', error);
        return null;
    }
}

/**
 * Busca CEP usando a API BrasilAPI (fallback)
 * @param {string} cep - CEP normalizado (apenas números)
 * @returns {Promise<Object>} - Dados do endereço ou null em caso de erro
 */
async function buscarCEPBrasilAPI(cep) {
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('[CEP] BrasilAPI: Erro HTTP', response.status);
            return null;
        }

        const data = await response.json();

        // BrasilAPI retorna erro na propriedade type
        if (data.type === 'service_error' || data.type === 'validation_error') {
            console.warn('[CEP] BrasilAPI: CEP não encontrado');
            return null;
        }

        // Verifica se tem dados válidos
        if (data && data.cep) {
            return {
                logradouro: data.street || '',
                bairro: data.neighborhood || '',
                cidade: data.city || '',
                uf: data.state || '',
                cep: data.cep || cep
            };
        }

        return null;
    } catch (error) {
        console.error('[CEP] Erro ao buscar com BrasilAPI:', error);
        return null;
    }
}

/**
 * Busca CEP usando múltiplas APIs com fallback
 * @param {string} cep - CEP (pode ter formatação)
 * @returns {Promise<Object|null>} - Dados do endereço ou null
 */
async function buscarCEPComFallback(cep) {
    const cepNormalizado = normalizarCEP(cep);

    if (!validarCEP(cepNormalizado)) {
        console.error('[CEP] CEP inválido:', cep);
        return null;
    }

    // Tenta primeiro com ViaCEP
    console.log('[CEP] Tentando buscar com ViaCEP...');
    let dados = await buscarCEPViaCEP(cepNormalizado);

    // Se falhar, tenta com BrasilAPI
    if (!dados) {
        console.log('[CEP] ViaCEP falhou, tentando BrasilAPI...');
        dados = await buscarCEPBrasilAPI(cepNormalizado);
    }

    // Se ainda não encontrou, tenta com CEP sem hífen formatado
    if (!dados && cepNormalizado.length === 8) {
        const cepFormatado = `${cepNormalizado.substring(0, 5)}-${cepNormalizado.substring(5)}`;
        console.log('[CEP] Tentando com formato alternativo...');
        dados = await buscarCEPViaCEP(cepNormalizado);
    }

    return dados;
}

/**
 * Preenche os campos do formulário com os dados do endereço
 * @param {Object} dados - Dados do endereço
 * @param {string} prefix - Prefixo para os campos (ex: 'edit-' para formulário de edição)
 */
function preencherCamposEndereco(dados, prefix = '') {
    if (!dados) return;

    const campos = {
        endereco: dados.logradouro || '',
        bairro: dados.bairro || '',
        cidade: dados.cidade || '',
        uf: dados.uf || '',
        estado: dados.uf || ''
    };

    // Preencher endereço (pode ser 'endereco' ou 'rua')
    const campoEndereco = document.getElementById(prefix + 'endereco') || 
                         document.getElementById(prefix + 'rua');
    if (campoEndereco) {
        campoEndereco.value = campos.endereco;
    }

    // Preencher bairro
    const campoBairro = document.getElementById(prefix + 'bairro');
    if (campoBairro) {
        campoBairro.value = campos.bairro;
    }

    // Preencher cidade (pode ser 'cidade' ou 'localidade')
    const campoCidade = document.getElementById(prefix + 'cidade') || 
                       document.getElementById(prefix + 'localidade');
    if (campoCidade) {
        campoCidade.value = campos.cidade;
    }

    // Preencher UF/Estado (pode ter vários nomes)
    const campoUF = document.getElementById(prefix + 'uf') || 
                   document.getElementById(prefix + 'estado') ||
                   document.getElementById(prefix + 'estado_nasc');
    if (campoUF) {
        // Se for um select, tenta selecionar a opção
        if (campoUF.tagName === 'SELECT') {
            const valorUF = campos.uf.toUpperCase();
            for (let i = 0; i < campoUF.options.length; i++) {
                if (campoUF.options[i].value === valorUF) {
                    campoUF.value = valorUF;
                    break;
                }
            }
        } else {
            campoUF.value = campos.uf;
        }
    }

    console.log('[CEP] Campos preenchidos:', campos);
}

/**
 * Função principal para buscar endereço por CEP (view_registration.html)
 */
async function buscarEnderecoPorCEP() {
    const cepField = document.getElementById('cep');
    
    if (!cepField) {
        console.error('[CEP] Campo CEP não encontrado');
        alert('Erro: Campo CEP não encontrado.');
        return;
    }

    const cep = cepField.value;

    if (!cep || cep.trim() === '') {
        alert('Por favor, insira um CEP.');
        return;
    }

    const cepNormalizado = normalizarCEP(cep);

    if (!validarCEP(cepNormalizado)) {
        alert('CEP inválido. Por favor, insira um CEP com 8 dígitos.');
        return;
    }

    // Mostrar loading (se existir)
    const loadingElement = document.getElementById('loading-cep');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }

    try {
        const dados = await buscarCEPComFallback(cepNormalizado);

        if (dados) {
            preencherCamposEndereco(dados);
            console.log('[CEP] Endereço encontrado com sucesso');
        } else {
            alert('CEP não encontrado. Verifique se o CEP está correto e tente novamente.');
        }
    } catch (error) {
        console.error('[CEP] Erro ao buscar endereço:', error);
        alert('Erro ao buscar o endereço. Tente novamente mais tarde.');
    } finally {
        // Esconder loading
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
}

/**
 * Função buscarEndereco para compatibilidade com o painel.html
 */
async function buscarEndereco() {
    // Determinar qual campo CEP está sendo usado baseado em qual botão foi clicado
    var cepField;
    var prefix = '';
    
    // Verificar se o botão clicado está no formulário de edição
    if (document.activeElement && document.activeElement.closest('#edit-ticket-form')) {
        cepField = document.getElementById('edit-cep');
        prefix = 'edit-';
    } else {
        // Caso contrário, assumimos que é o formulário principal
        cepField = document.getElementById('cep');
        prefix = '';
    }
    
    // Se não encontrarmos o campo, exibimos uma mensagem e saímos da função
    if (!cepField) {
        alert("Elemento de CEP não encontrado!");
        return;
    }
    
    const cep = cepField.value;

    if (!cep || cep.trim() === '') {
        alert("Por favor, preencha o campo CEP.");
        return;
    }

    const cepNormalizado = normalizarCEP(cep);

    if (!validarCEP(cepNormalizado)) {
        alert("Formato de CEP inválido. Por favor, insira um CEP com 8 dígitos.");
        return;
    }

    // Mostrar a mensagem de "Aguarde..."
    var loadingElement = document.getElementById('loading-ticket');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }

    try {
        const dados = await buscarCEPComFallback(cepNormalizado);

        if (dados) {
            preencherCamposEndereco(dados, prefix);
        } else {
            alert("CEP não encontrado. Verifique se o CEP está correto.");
        }
    } catch (error) {
        console.error("Erro ao buscar o endereço:", error);
        alert("Erro ao buscar o endereço. Tente novamente mais tarde.");
    } finally {
        // Esconde a mensagem de "Aguarde..."
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
}

/**
 * Função para buscar o endereço na edição de ticket
 */
async function buscarEnderecoEdicao() {
    const cepField = document.getElementById('edit-cep');
    
    if (!cepField) {
        alert("Campo CEP não encontrado.");
        return;
    }

    const cep = cepField.value;

    if (!cep || cep.trim() === '') {
        alert("Por favor, preencha o campo CEP.");
        return;
    }

    const cepNormalizado = normalizarCEP(cep);

    if (!validarCEP(cepNormalizado)) {
        alert("Formato de CEP inválido. Por favor, insira um CEP com 8 dígitos.");
        return;
    }

    // Mostrar a mensagem de "Aguarde..."
    const loadingElement = document.getElementById('loading-ticket');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }

    try {
        const dados = await buscarCEPComFallback(cepNormalizado);

        if (dados) {
            preencherCamposEndereco(dados, 'edit-');
        } else {
            alert("CEP não encontrado. Verifique se o CEP está correto.");
        }
    } catch (error) {
        console.error("Erro ao buscar o endereço:", error);
        alert("Erro ao buscar o endereço. Tente novamente mais tarde.");
    } finally {
        // Esconde a mensagem de "Aguarde..."
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
}

// Adicionar event listener para o botão de buscar CEP no view_registration.html
document.addEventListener('DOMContentLoaded', function() {
    const buscarCepBtn = document.getElementById('buscarCep');
    if (buscarCepBtn) {
        buscarCepBtn.addEventListener('click', buscarEnderecoPorCEP);
        console.log('[CEP] Event listener adicionado ao botão buscarCep');
    }
});

// Exportar funções para uso global
window.buscarEndereco = buscarEndereco;
window.buscarEnderecoEdicao = buscarEnderecoEdicao;
window.buscarEnderecoPorCEP = buscarEnderecoPorCEP;
