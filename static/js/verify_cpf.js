document.getElementById('cpf-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var cpf = document.getElementById('cpf').value;
    var category = document.getElementById('category').value;

    // Exibir a mensagem de "Aguarde..." enquanto a verificação é feita
    document.getElementById('loading-cpf').style.display = 'flex';

    // Esconder o formulário abaixo caso esteja aberto
    document.getElementById('ticket-form').style.display = 'none';
    
    // Função para validar CPF
    function validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
        var sum, rest;
        sum = 0;
        for (var i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11) rest = 0;
        if (rest !== parseInt(cpf.substring(9, 10))) return false;
        sum = 0;
        for (var i = 1; i <= 10; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }
        rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11) rest = 0;
        if (rest !== parseInt(cpf.substring(10, 11))) return false;
        return true;
    }

    if (!validateCPF(cpf)) {
        var notification = document.getElementById('cpf-notification');
        notification.textContent = 'CPF inválido. Por favor, insira um CPF válido.';
        document.getElementById('loading-cpf').style.display = 'none';
        return;
    }

    fetch('/verify_cpf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf: cpf, category: category })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('loading-cpf').style.display = 'none';

        if (data.exists) {
            if (data.external) {
                // Encontrado no banco de dados externo
                document.getElementById('name').value = data.name;
                document.getElementById('cep').value = data.cep || '';
                document.getElementById('numero').value = data.numero || '';
                document.getElementById('complemento').value = data.complemento || '';
                document.getElementById('ticket-form').style.display = 'block';
                document.getElementById('ticket-category').value = category;
                document.getElementById('ticket-cpf').value = cpf;
            } else {
                // Converter a data para o formato brasileiro
                var dateParts = data.created_at.split(' ');
                var date = dateParts[0].split('-').reverse().join('/');
                var time = dateParts[1];
                var formattedDate = date + ' ' + time;

                // Exibe a mensagem de aviso para candidatos encontrados no banco interno
                document.getElementById('candidate-name').innerHTML = `<strong>${data.name}</strong>`;
                document.getElementById('process-date').innerHTML = `<strong>${formattedDate}</strong>`;
                document.getElementById('process-status').innerHTML = `<strong>${data.situacao || 'Não Avaliado'}</strong>`;
                document.getElementById('process-info').style.display = 'block';

                // Esconder o formulário de cadastro abaixo já que o CPF já existe
                document.getElementById('ticket-form').style.display = 'none';
            }
        } else {
            // CPF não encontrado, exibe o formulário de cadastro
            document.getElementById('cpf-notification').textContent = 'CPF não encontrado. Prosseguindo com o cadastro.';
            document.getElementById('ticket-form').style.display = 'block';
            document.getElementById('ticket-category').value = category;
            document.getElementById('ticket-cpf').value = cpf;
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        document.getElementById('loading-cpf').style.display = 'none';
    });
});
