document.getElementById('viewCurriculo').addEventListener('click', function () {
    var modal = document.getElementById('curriculoModal');
    var iframe = document.getElementById('curriculoIframe');

    // Obtém o caminho do currículo a partir do atributo data-curriculo do botão
    var curriculoPath = this.getAttribute('data-curriculo');

    if (curriculoPath) {
        // Define o caminho do currículo no iframe para exibi-lo no modal
        iframe.src = curriculoPath;

        // Exibe o modal com o currículo
        $('#curriculoModal').modal('show');
    } else {
        // Caso não tenha currículo, exibe um alerta
        alert('Nenhum currículo disponível.');
    }
});

// Fecha o modal ao clicar no botão "Fechar"
document.getElementById('closeModalButton').addEventListener('click', function () {
    // Oculta o modal do currículo
    $('#curriculoModal').modal('hide');
});
