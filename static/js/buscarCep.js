// Função para buscar o endereço com base no CEP
document.getElementById('buscarCep').addEventListener('click', function () {
    var cep = document.getElementById('cep').value;
    if (cep) {
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                if (!data.erro) {
                    document.getElementById('endereco').value = data.logradouro;
                    document.getElementById('bairro').value = data.bairro;
                    document.getElementById('cidade').value = data.localidade;
                } else {
                    alert('CEP não encontrado!');
                }
            })
            .catch(error => {
                alert('Erro ao buscar o CEP!');
            });
    } else {
        alert('Por favor, insira um CEP.');
    }
});
