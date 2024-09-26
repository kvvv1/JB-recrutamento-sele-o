function aplicarMascaraCPF(cpf) {
    cpf.value = cpf.value
        .replace(/\D/g, '')               // Remove caracteres não numéricos
        .replace(/(\d{3})(\d)/, '$1.$2')  // Coloca o ponto após os três primeiros dígitos
        .replace(/(\d{3})(\d)/, '$1.$2')  // Coloca o ponto após os seis primeiros dígitos
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')  // Coloca o traço antes dos dois últimos dígitos
        .replace(/(-\d{2})\d+?$/, '$1');  // Limita a quantidade de dígitos
}

function aplicarMascaraTelefone(telefone) {
    telefone.value = telefone.value
        .replace(/\D/g, '')                  // Remove caracteres não numéricos
        .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca o parêntese nos dois primeiros dígitos
        .replace(/(\d{5})(\d{1,4})/, '$1-$2') // Coloca o traço após os cinco primeiros dígitos
        .replace(/(-\d{4})\d+?$/, '$1');      // Limita a quantidade de dígitos
}

function aplicarMascaraTelefones(telefones) {
    var valor = telefones.value.replace(/\D/g, ''); // Remove caracteres não numéricos

    if (valor.length <= 10) {
        // Máscara para telefone fixo (10 dígitos)
        telefones.value = valor
            .replace(/^(\d{2})(\d)/g, '($1) $2')  // Parêntese nos dois primeiros dígitos
            .replace(/(\d{4})(\d{1,4})$/, '$1-$2'); // Traço após o quarto dígito
    } else if (valor.length <= 11) {
        // Máscara para celular (11 dígitos)
        telefones.value = valor
            .replace(/^(\d{2})(\d)/g, '($1) $2')  // Parêntese nos dois primeiros dígitos
            .replace(/(\d{5})(\d{1,4})$/, '$1-$2'); // Traço após o quinto dígito
    }

    // Limita o número total de dígitos
    telefones.value = telefones.value.slice(0, 15); // Limita o tamanho total para 15 caracteres (incluindo parênteses e traço)
}


// Função para inicializar as máscaras
function inicializarMascaras() {
    var cpfInput = document.getElementById('cpf');
    var telefoneInput = document.getElementById('telefone');
    var telefonesInput = document.getElementById('telefones');


    
    if (cpfInput) {
        cpfInput.addEventListener('input', function() {
            aplicarMascaraCPF(cpfInput);
        });
    }
    
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            aplicarMascaraTelefone(telefoneInput);
        });
    }

    if (telefonesInput) {
        telefonesInput.addEventListener('input', function() {
            aplicarMascaraTelefones(telefonesInput);
        });
    }
}


function mascaraSalario(campo) {
    var valor = campo.value;

    // Remove tudo que não for dígito
    valor = valor.replace(/\D/g, "");

    // Adiciona o ponto e a vírgula para formatar como moeda
    valor = (valor / 100).toFixed(2) + '';
    valor = valor.replace(".", ",");
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");

    // Adiciona o símbolo do Real no início
    campo.value = "R$ " + valor;
}



// Inicializa as máscaras quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', inicializarMascaras);
