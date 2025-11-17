/**
 * Script consolidado que contém várias funções úteis para otimizar o desempenho
 * Combina funcionalidades para reduzir o número de arquivos carregados
 */

// Constantes e variáveis globais
const DEBUG_MODE = false;
let formState = {
    isSubmitting: false,
    lastSaveTime: null,
    hasUnsavedChanges: false
};

// Função para log condicional (reduzir logs no console)
function conditionalLog(message, data = null) {
    if (DEBUG_MODE) {
        if (data) {
            console.log(message, data);
        } else {
            console.log(message);
        }
    }
}

// Função para calcular idade
function calcularIdade(dataNascimento) {
    if (!dataNascimento) return "";
    
    const hoje = new Date();
    // Parse local sem timezone
    let y, m, d;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
        y = parseInt(dataNascimento.slice(0, 4), 10);
        m = parseInt(dataNascimento.slice(5, 7), 10);
        d = parseInt(dataNascimento.slice(8, 10), 10);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) {
        d = parseInt(dataNascimento.slice(0, 2), 10);
        m = parseInt(dataNascimento.slice(3, 5), 10);
        y = parseInt(dataNascimento.slice(6, 10), 10);
    } else {
        return "";
    }
    const nascimento = new Date(y, m - 1, d);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesNascimento > mesAtual || 
        (mesNascimento === mesAtual && nascimento.getDate() > hoje.getDate())) {
        idade--;
    }
    
    return idade;
}

// Função para limitar a frequência de execução de funções (debounce)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Função para inicializar máscaras em campos do formulário
function inicializarMascaras() {
    if (typeof $.fn.mask !== 'function') {
        conditionalLog('jQuery Mask não encontrado');
        return;
    }
    
    $('#cpf').mask('000.000.000-00');
    $('#telefone').mask('(00) 00000-0000');
    $('#cep').mask('00000-000');
}

// Função para buscar CEP (usa a função melhorada se disponível, senão usa implementação própria)
async function buscarCEP() {
    // Se a função melhorada com fallback completo estiver disponível, usa ela
    if (window.buscarCEPComFallback) {
        const cepField = document.getElementById('cep');
        if (!cepField) {
            conditionalLog('Campo CEP não encontrado');
            return;
        }

        const cep = cepField.value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            alert('CEP inválido. Por favor, insira um CEP com 8 dígitos.');
            return;
        }

        try {
            const dados = await window.buscarCEPComFallback(cep);
            
            if (dados) {
                // Preenche os campos
                const enderecoField = document.getElementById('endereco') || document.getElementById('rua');
                const bairroField = document.getElementById('bairro');
                const cidadeField = document.getElementById('cidade') || document.getElementById('localidade');
                const ufField = document.getElementById('uf') || document.getElementById('estado') || document.getElementById('estado_nasc');

                if (enderecoField) enderecoField.value = dados.logradouro || '';
                if (bairroField) bairroField.value = dados.bairro || '';
                if (cidadeField) cidadeField.value = dados.cidade || '';
                
                // Preenche UF se for select
                if (ufField) {
                    if (ufField.tagName === 'SELECT') {
                        const valorUF = (dados.uf || '').toUpperCase();
                        for (let i = 0; i < ufField.options.length; i++) {
                            if (ufField.options[i].value === valorUF) {
                                ufField.value = valorUF;
                                break;
                            }
                        }
                    } else {
                        ufField.value = dados.uf || '';
                    }
                }

                // Foca no campo de número
                const numeroField = document.getElementById('numero');
                if (numeroField) {
                    setTimeout(() => numeroField.focus(), 300);
                }
            } else {
                alert('CEP não encontrado. Verifique se o CEP está correto.');
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            alert('Erro ao buscar o endereço. Tente novamente mais tarde.');
        }
        return;
    }

    // Se buscarEnderecoPorCEP estiver disponível, usa ela
    if (window.buscarEnderecoPorCEP) {
        await window.buscarEnderecoPorCEP();
        // Foca no campo de número após preencher o endereço
        const numeroField = document.getElementById('numero');
        if (numeroField) {
            setTimeout(() => numeroField.focus(), 300);
        }
        return;
    }

    // Fallback: implementação básica (não deveria chegar aqui se buscarCep.js estiver carregado)
    const cepField = document.getElementById('cep');
    if (!cepField) {
        conditionalLog('Campo CEP não encontrado');
        return;
    }

    const cep = cepField.value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        alert('CEP inválido. Por favor, insira um CEP com 8 dígitos.');
        return;
    }

    alert('Função de busca de CEP não disponível. Verifique se o arquivo buscarCep.js está carregado.');
}

// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    conditionalLog('Script consolidado inicializado');
    
    // Inicializar máscaras
    inicializarMascaras();
    
    // Configurar cálculo de idade automático
    const dataNascInput = document.getElementById('data_nasc');
    const idadeInput = document.getElementById('idade');
    
    if (dataNascInput && idadeInput) {
        dataNascInput.addEventListener('change', function() {
            idadeInput.value = calcularIdade(this.value);
        });
        
        // Calcular idade inicial se a data já estiver preenchida
        if (dataNascInput.value) {
            idadeInput.value = calcularIdade(dataNascInput.value);
        }
    }
    
    // Configurar busca de CEP
    const buscarCepBtn = document.getElementById('buscarCep');
    if (buscarCepBtn) {
        buscarCepBtn.addEventListener('click', buscarCEP);
    }
    
    // Configurar toggles visuais
    const cargoIndicadoToggle = document.getElementById('select-indicated-cargo');
    const cargoCheckboxes = document.getElementById('cargo-indicado-checkboxes');
    
    if (cargoIndicadoToggle && cargoCheckboxes) {
        cargoIndicadoToggle.addEventListener('click', function() {
            cargoCheckboxes.style.display = cargoCheckboxes.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    // Otimização: Usar delegação de eventos para reduzir o número de listeners
    document.addEventListener('click', function(e) {
        // Manipular cliques em botões ou elementos específicos
        if (e.target.matches('#viewCurriculo')) {
            const curriculoUrl = e.target.dataset.curriculo;
            if (curriculoUrl) {
                document.getElementById('curriculoIframe').src = curriculoUrl;
                new bootstrap.Modal(document.getElementById('curriculoModal')).show();
            }
        }
    });
    
    // Otimização: Usar evento input com debounce para campos de texto
    const formFields = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
    formFields.forEach(field => {
        field.addEventListener('input', debounce(function() {
            formState.hasUnsavedChanges = true;
        }, 500));
    });
});

// Exportar funções que podem ser necessárias em outros scripts
window.calculaIdade = calcularIdade;
window.buscarCEP = buscarCEP; 