document.getElementById('viewCurriculo').addEventListener('click', function () {
    var modal = document.getElementById('curriculoModal');
    var iframe = document.getElementById('curriculoIframe');

    // Obtém o caminho do currículo a partir do atributo data-curriculo do botão
    var curriculoPath = this.getAttribute('data-curriculo');

    if (curriculoPath) {
        // Tenta verificar se o arquivo existe antes de exibi-lo
        fetch(curriculoPath)
            .then(response => {
                if (response.ok) {
                    // Arquivo encontrado, exibe normalmente
                    iframe.src = curriculoPath;
                    $('#curriculoModal').modal('show');
                } else {
                    // Se o arquivo não for encontrado, tenta uma versão alternativa com underscores
                    console.log('Arquivo não encontrado:', curriculoPath);
                    
                    // Extrai o nome do arquivo do caminho completo
                    var pathParts = curriculoPath.split('/');
                    var fileName = pathParts[pathParts.length - 1];
                    
                    // Primeiro decodifica a URL para tratar os %20 como espaços
                    fileName = decodeURIComponent(fileName);
                    console.log('Nome do arquivo decodificado:', fileName);
                    
                    // Substituir espaços por underscores no nome do arquivo
                    var fileNameWithUnderscores = fileName.replace(/ /g, '_');
                    console.log('Nome do arquivo com underscores:', fileNameWithUnderscores);
                    
                    // Reconstruir o caminho com o novo nome de arquivo
                    pathParts[pathParts.length - 1] = fileNameWithUnderscores;
                    var alternativePath = pathParts.join('/');
                    
                    console.log('Tentando caminho alternativo:', alternativePath);
                    
                    // Tenta acessar o arquivo com o nome modificado
                    fetch(alternativePath)
                        .then(altResponse => {
                            if (altResponse.ok) {
                                // Arquivo alternativo encontrado
                                iframe.src = alternativePath;
                                $('#curriculoModal').modal('show');
                            } else {
                                // Tenta uma segunda alternativa com letras minúsculas
                                var fileNameLowercase = fileNameWithUnderscores.toLowerCase();
                                pathParts[pathParts.length - 1] = fileNameLowercase;
                                var alternativePathLowercase = pathParts.join('/');
                                
                                console.log('Tentando caminho alternativo em minúsculas:', alternativePathLowercase);
                                
                                fetch(alternativePathLowercase)
                                    .then(lowerResponse => {
                                        if (lowerResponse.ok) {
                                            // Arquivo alternativo em minúsculas encontrado
                                            iframe.src = alternativePathLowercase;
                                            $('#curriculoModal').modal('show');
                                        } else {
                                            // Nenhuma das alternativas funcionou
                                            alert('Não foi possível encontrar o currículo. Por favor, contate o suporte técnico.');
                                        }
                                    })
                                    .catch(error => {
                                        console.error('Erro ao verificar caminho alternativo em minúsculas:', error);
                                        alert('Ocorreu um erro ao tentar acessar o currículo.');
                                    });
                            }
                        })
                        .catch(error => {
                            console.error('Erro ao verificar caminho alternativo:', error);
                            alert('Ocorreu um erro ao tentar acessar o currículo.');
                        });
                }
            })
            .catch(error => {
                console.error('Erro ao verificar currículo:', error);
                alert('Ocorreu um erro ao tentar acessar o currículo.');
            });
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
