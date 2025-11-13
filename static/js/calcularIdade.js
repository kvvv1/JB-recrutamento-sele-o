// Função para calcular a idade com base na data de nascimento
function calcularIdade(dataNasc) {
    if (!dataNasc || dataNasc.length < 10) return ''; // Verifica se a data tem 10 caracteres completos (AAAA-MM-DD)

    var hoje = new Date();
    // Parse local sem timezone (AAAA-MM-DD ou DD/MM/AAAA)
    var y, m, d;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataNasc)) {
        y = parseInt(dataNasc.slice(0, 4), 10);
        m = parseInt(dataNasc.slice(5, 7), 10);
        d = parseInt(dataNasc.slice(8, 10), 10);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataNasc)) {
        d = parseInt(dataNasc.slice(0, 2), 10);
        m = parseInt(dataNasc.slice(3, 5), 10);
        y = parseInt(dataNasc.slice(6, 10), 10);
    } else {
        return '';
    }
    var nascimento = new Date(y, m - 1, d);

    if (isNaN(nascimento.getTime())) {
        return ''; // Retorna vazio se a data for inválida
    }

    var idade = hoje.getFullYear() - nascimento.getFullYear();
    var mm = hoje.getMonth() - nascimento.getMonth();
    if (mm < 0 || (mm === 0 && hoje.getDate() < nascimento.getDate())) {
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
