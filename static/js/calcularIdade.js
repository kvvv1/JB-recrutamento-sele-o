// Função para calcular a idade com base na data de nascimento
function calcularIdade(dataNasc) {
    if (!dataNasc || dataNasc.length < 10) return ''; // Verifica se a data tem 10 caracteres completos (AAAA-MM-DD)

    var hoje = new Date();
    var nascimento = new Date(dataNasc);

    if (isNaN(nascimento.getTime())) {
        return ''; // Retorna vazio se a data for inválida
    }

    var idade = hoje.getFullYear() - nascimento.getFullYear();
    var m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--; // Subtrai um ano da idade
    }

    return idade; // Retorna a idade calculada
}

// Aplica a função quando há qualquer input na data de nascimento
document.getElementById('data_nasc').addEventListener('input', function () {
    var idade = calcularIdade(this.value); // Calcula a idade conforme os caracteres são inseridos
    document.getElementById('idade').value = idade ? idade : ''; // Atualiza o campo de idade
});

// Inicializa o campo de idade se a data de nascimento já estiver preenchida ao carregar a página
document.addEventListener('DOMContentLoaded', function () {
    var dataNasc = document.getElementById('data_nasc').value; // Obtém o valor atual do campo de data de nascimento
    if (dataNasc) { // Se houver data preenchida
        var idade = calcularIdade(dataNasc); // Calcula a idade
        document.getElementById('idade').value = idade; // Preenche o campo de idade
    }
});
