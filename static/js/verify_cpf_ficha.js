document.addEventListener('DOMContentLoaded', function () {

    // Função para remover a máscara e deixar apenas os números do CPF
    function removerMascaraCPF(cpf) {
        return cpf.replace(/\D/g, '');  // Remove tudo que não é dígito
    }

    // Botão de verificação do CPF
    const verificarCpfBtn = document.getElementById('verificarCpfBtn');

    verificarCpfBtn.addEventListener('click', function (event) {
        event.preventDefault();  // Evita o comportamento padrão do botão

        let cpf = document.getElementById('cpf').value;

        // Remove a máscara do CPF
        cpf = removerMascaraCPF(cpf);

        // Exibir o círculo de carregamento enquanto a verificação acontece
        document.getElementById('loading-cpf').style.display = 'block';

        // Envia a requisição ao backend para verificar o CPF
        fetch('/verify_cpf_modal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cpf: cpf })
        })
        .then(response => response.json())
        .then(data => {
            // Esconder o círculo de carregamento
            document.getElementById('loading-cpf').style.display = 'none';

            if (data.exists) {
                // CPF encontrado, preenche os campos com os dados recebidos
                document.getElementById('nomeCompleto').value = data.name || '';
                document.getElementById('cep').value = data.cep || '';
                document.getElementById('rua').value = data.rua || '';
                document.getElementById('numero').value = data.numero || '';
                document.getElementById('complemento').value = data.complemento || '';

                // Exibir os campos adicionais, se aplicável
                document.getElementById('additionalFields').style.display = 'block';
            } else {
                // CPF não encontrado, exibe uma mensagem de aviso
                alert(data.message);
                document.getElementById('additionalFields').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            document.getElementById('loading-cpf').style.display = 'none';
        });
    });
});
