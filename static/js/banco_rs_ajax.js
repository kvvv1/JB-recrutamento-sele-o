// Função para carregar os filtros e resultados via AJAX
function carregarFiltros(page = 1) {
    var formData = $('#filterForm').serialize() + '&page=' + page + '&items_per_page=' + $('#itemsPerPage').val();

    $.ajax({
        url: '/banco_rs',
        type: 'GET',
        data: formData,
        headers: {
            'Accept': 'application/json'
        },
        success: function (response) {
            $('#resultados').html(response.resultados);
            $('#pagination').html(response.pagination);
            $('#filtros-selecionados').html(response.filtros);

            // Reatribui os event listeners após o carregamento dos resultados
            reatribuirEventListeners();
        },
        error: function (error) {
            console.error("Erro ao carregar os filtros:", error);
        }
    });
}

// Listener para a mudança de itens por página
$('#itemsPerPage').on('change', function () {
    carregarFiltros(); // Recarrega os resultados via AJAX quando o número de itens por página é alterado
});

// Listener para a paginação via AJAX
$(document).on('click', '.pagination-link', function (e) {
    e.preventDefault();
    var page = $(this).data('page');
    carregarFiltros(page); // Carrega a página selecionada
});

// Função para reatribuir event listeners após o AJAX
function reatribuirEventListeners() {
    $('#itemsPerPage').on('change', function () {
        carregarFiltros(); // Atualiza a página ao mudar o número de itens por página
    });
}

// Inicializa o socket.io
var socket = io.connect('http://' + document.domain + ':' + location.port);

// Evento para atualizar situação em tempo real
socket.on('situacao_updated', function(data) {
    // Encontra todas as linhas da tabela
    const rows = document.querySelectorAll('#candidato-table tr');
    
    // Itera sobre as linhas procurando o CPF correspondente
    rows.forEach(row => {
        const checkboxCell = row.querySelector('td:nth-child(1) input[type="checkbox"]');
        if (checkboxCell && checkboxCell.value === data.cpf) {
            // Atualiza a célula de situação (7ª coluna)
            const situacaoCell = row.querySelector('td:nth-child(7)');
            if (situacaoCell) {
                situacaoCell.textContent = data.situacao;
                
                // Adiciona uma animação sutil para destacar a mudança
                situacaoCell.style.backgroundColor = '#ffd700';
                setTimeout(() => {
                    situacaoCell.style.backgroundColor = '';
                    situacaoCell.style.transition = 'background-color 1s ease';
                }, 100);
            }
        }
    });
});


