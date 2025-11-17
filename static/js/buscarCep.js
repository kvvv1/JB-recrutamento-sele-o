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
 * Busca CEP usando a API BrasilAPI v2 (fallback 1 - com coordenadas)
 * @param {string} cep - CEP normalizado (apenas números)
 * @returns {Promise<Object>} - Dados do endereço ou null em caso de erro
 */
async function buscarCEPBrasilAPI(cep) {
    try {
        // Tenta primeiro com v2 (inclui coordenadas)
        const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            console.warn('[CEP] BrasilAPI v2: Erro HTTP', response.status);
            // Fallback para v1 se v2 falhar
            return await buscarCEPBrasilAPIv1(cep);
        }

        const data = await response.json();

        // BrasilAPI retorna erro na propriedade type
        if (data.type === 'service_error' || data.type === 'validation_error') {
            console.warn('[CEP] BrasilAPI v2: CEP não encontrado, tentando v1...');
            return await buscarCEPBrasilAPIv1(cep);
        }

        // Verifica se tem dados válidos
        if (data && data.cep) {
            return {
                logradouro: data.street || '',
                bairro: data.neighborhood || '',
                cidade: data.city || '',
                uf: data.state || '',
                cep: data.cep || cep,
                latitude: data.location?.coordinates?.[1] || null,
                longitude: data.location?.coordinates?.[0] || null
            };
        }

        return null;
    } catch (error) {
        console.warn('[CEP] Erro ao buscar com BrasilAPI v2:', error);
        // Tenta v1 como fallback
        return await buscarCEPBrasilAPIv1(cep);
    }
}

/**
 * Busca CEP usando a API BrasilAPI v1 (fallback interno)
 * @param {string} cep - CEP normalizado (apenas números)
 * @returns {Promise<Object>} - Dados do endereço ou null em caso de erro
 */
async function buscarCEPBrasilAPIv1(cep) {
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            console.warn('[CEP] BrasilAPI v1: Erro HTTP', response.status);
            return null;
        }

        const data = await response.json();

        // BrasilAPI retorna erro na propriedade type
        if (data.type === 'service_error' || data.type === 'validation_error') {
            console.warn('[CEP] BrasilAPI v1: CEP não encontrado');
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
        console.error('[CEP] Erro ao buscar com BrasilAPI v1:', error);
        return null;
    }
}

/**
 * Busca CEP usando a API OpenCEP (fallback 2 - open source)
 * @param {string} cep - CEP normalizado (apenas números)
 * @returns {Promise<Object>} - Dados do endereço ou null em caso de erro
 */
async function buscarCEPOpenCEP(cep) {
    try {
        const response = await fetch(`https://opencep.com/v1/${cep}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            console.warn('[CEP] OpenCEP: Erro HTTP', response.status);
            return null;
        }

        const data = await response.json();

        // Verifica se tem dados válidos
        if (data && data.cep) {
            return {
                logradouro: data.logradouro || data.address || '',
                bairro: data.bairro || data.district || '',
                cidade: data.localidade || data.city || '',
                uf: data.uf || data.state || '',
                cep: data.cep || cep
            };
        }

        return null;
    } catch (error) {
        console.warn('[CEP] Erro ao buscar com OpenCEP:', error);
        return null;
    }
}

/**
 * Busca CEP usando a API ApiCEP (fallback 3 - último recurso)
 * @param {string} cep - CEP normalizado (apenas números)
 * @returns {Promise<Object>} - Dados do endereço ou null em caso de erro
 */
async function buscarCEPApiCEP(cep) {
    try {
        // ApiCEP requer formato com hífen
        const cepFormatado = `${cep.substring(0, 5)}-${cep.substring(5)}`;
        const response = await fetch(`https://cdn.apicep.com/file/apicep/${cepFormatado}.json`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            console.warn('[CEP] ApiCEP: Erro HTTP', response.status);
            return null;
        }

        const data = await response.json();

        // ApiCEP retorna status no objeto
        if (data.status && data.status !== 200) {
            console.warn('[CEP] ApiCEP: CEP não encontrado');
            return null;
        }

        // Verifica se tem dados válidos
        if (data && (data.code || data.cep)) {
            return {
                logradouro: data.address || '',
                bairro: data.district || '',
                cidade: data.city || '',
                uf: data.state || '',
                cep: data.code || data.cep || cepFormatado
            };
        }

        return null;
    } catch (error) {
        console.warn('[CEP] Erro ao buscar com ApiCEP:', error);
        return null;
    }
}

/**
 * Busca CEP usando múltiplas APIs com fallback em cascata
 * Ordem de prioridade:
 * 1. ViaCEP (mais confiável e popular)
 * 2. BrasilAPI v2 (com coordenadas, se v2 falhar tenta v1)
 * 3. OpenCEP (open source rápido)
 * 4. ApiCEP (último recurso)
 * 
 * @param {string} cep - CEP (pode ter formatação)
 * @returns {Promise<Object|null>} - Dados do endereço ou null
 */
async function buscarCEPComFallback(cep) {
    const cepNormalizado = normalizarCEP(cep);

    if (!validarCEP(cepNormalizado)) {
        console.error('[CEP] CEP inválido:', cep);
        return null;
    }

    const startTime = performance.now();
    console.log('[CEP] Iniciando busca com fallback em cascata para CEP:', cepNormalizado);

    // 1. Tenta primeiro com ViaCEP (mais confiável)
    console.log('[CEP] [1/4] Tentando ViaCEP...');
    let dados = await buscarCEPViaCEP(cepNormalizado);
    
    if (dados) {
        const timeTaken = (performance.now() - startTime).toFixed(2);
        console.log(`[CEP] ✅ Endereço encontrado via ViaCEP em ${timeTaken}ms`);
        return dados;
    }

    // 2. Se falhar, tenta com BrasilAPI v2 (com coordenadas)
    console.log('[CEP] [2/4] ViaCEP falhou, tentando BrasilAPI v2...');
    dados = await buscarCEPBrasilAPI(cepNormalizado);
    
    if (dados) {
        const timeTaken = (performance.now() - startTime).toFixed(2);
        console.log(`[CEP] ✅ Endereço encontrado via BrasilAPI em ${timeTaken}ms`);
        if (dados.latitude && dados.longitude) {
            console.log(`[CEP] 📍 Coordenadas: ${dados.latitude}, ${dados.longitude}`);
        }
        return dados;
    }

    // 3. Se falhar, tenta com OpenCEP (open source rápido)
    console.log('[CEP] [3/4] BrasilAPI falhou, tentando OpenCEP...');
    dados = await buscarCEPOpenCEP(cepNormalizado);
    
    if (dados) {
        const timeTaken = (performance.now() - startTime).toFixed(2);
        console.log(`[CEP] ✅ Endereço encontrado via OpenCEP em ${timeTaken}ms`);
        return dados;
    }

    // 4. Se falhar, tenta com ApiCEP (último recurso)
    console.log('[CEP] [4/4] OpenCEP falhou, tentando ApiCEP (último recurso)...');
    dados = await buscarCEPApiCEP(cepNormalizado);
    
    if (dados) {
        const timeTaken = (performance.now() - startTime).toFixed(2);
        console.log(`[CEP] ✅ Endereço encontrado via ApiCEP em ${timeTaken}ms`);
        return dados;
    }

    // Se todas as APIs falharam
    const timeTaken = (performance.now() - startTime).toFixed(2);
    console.error(`[CEP] ❌ CEP não encontrado em nenhuma API após ${timeTaken}ms`);
    return null;
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
window.buscarCEPComFallback = buscarCEPComFallback;
window.normalizarCEP = normalizarCEP;
window.validarCEP = validarCEP;
