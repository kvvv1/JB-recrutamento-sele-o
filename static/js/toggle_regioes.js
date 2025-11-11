function toggleRegioes(source) {
    // Seleciona todos os checkboxes com o name "regioes_preferencia"
    var regioesCheckboxes = document.querySelectorAll('input[name="regioes_preferencia"]');

    // Altera o estado dos checkboxes de regiões de preferência com base no estado do botão "selecionar todas"
    regioesCheckboxes.forEach(function (checkbox) {
        checkbox.checked = source.checked;
    });
}
