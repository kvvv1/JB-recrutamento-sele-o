document.addEventListener('DOMContentLoaded', function() {
    // Seleciona o elemento de número de filhos
    var numeroFilhosSelect = document.getElementById('numero_filhos');

    // Gera os campos de idade com base no valor atual de número de filhos
    gerarCamposIdadesFilhos();

    // Adiciona o evento de mudança no campo de número de filhos
    numeroFilhosSelect.addEventListener('change', gerarCamposIdadesFilhos);

    function gerarCamposIdadesFilhos() {
        // Obtém o valor selecionado no campo número de filhos
        var numeroFilhos = numeroFilhosSelect.value;

        // Seleciona o elemento onde os campos serão inseridos
        var container = document.getElementById('filhos_idades');

        // Limpa o conteúdo atual do container
        container.innerHTML = '';

        // Gera os campos de idade com base no número de filhos selecionado
        for (var i = 1; i <= numeroFilhos; i++) {
            var div = document.createElement('div');
            div.classList.add('form-group');
            
            var label = document.createElement('label');
            label.setAttribute('for', 'idade_filho_' + i);
            label.textContent = 'Idade do Filho ' + i + ':';
            
            var input = document.createElement('input');
            input.setAttribute('type', 'number');
            input.setAttribute('class', 'form-control');
            input.setAttribute('id', 'idade_filho_' + i);
            input.setAttribute('name', 'idade_filho_' + i);
            input.setAttribute('min', '0');
            input.setAttribute('max', '100');

            // Preenche com o valor salvo no banco, se existir
            if (typeof formData !== 'undefined' && formData[`idade_filho_${i}`]) {
                input.value = formData[`idade_filho_${i}`];
            }
            
            // Adiciona o label e o campo ao container
            div.appendChild(label);
            div.appendChild(input);
            container.appendChild(div);
        }
    }

    // Chama a função uma vez para carregar os campos iniciais, se houver número de filhos salvo
    gerarCamposIdadesFilhos();
});
