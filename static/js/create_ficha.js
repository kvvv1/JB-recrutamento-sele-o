function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11) {
        return false;
    }
    // Mais validações aqui (baseado nos dígitos verificadores do CPF)
    return true;
}

// Verifica o CPF antes de enviar o formulário
document.getElementById('createFichaForm').addEventListener('submit', function(event) {
    const cpf = document.getElementById('cpf').value;
    if (!validarCPF(cpf)) {
        event.preventDefault();
        alert('CPF inválido.');
        return;
    }
});


ddocument.getElementById('createFichaForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const nomeCompleto = document.getElementById('nomeCompleto').value;
    const cpf = document.getElementById('cpf').value;

    fetch('/create_ficha_manual', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome_completo: nomeCompleto,
            cpf: cpf
        })
    })
    .then(response => {
        if (!response.ok) {
            // Se a resposta não for OK (status 400), retorna a mensagem de erro
            return response.json().then(data => { throw new Error(data.message); });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Redireciona para a página de visualização do formulário com o CPF
            window.location.href = `/view_form/${data.cpf}`;
        }
    })
    .catch(error => {
        // Exibe um alerta se o CPF já existir ou outro erro ocorrer
        alert(error.message);
    });
});
