document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const toggleBtn = document.getElementById('toggle-btn');

    // Carrega o estado salvo no localStorage
    let isCollapsed = localStorage.getItem('sidebarState') === 'collapsed';

    // Aplica o estado correto no carregamento
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        content.classList.add('collapsed');
    }

    // Função para alternar o estado do menu
    toggleBtn.addEventListener('click', function () {
        isCollapsed = !isCollapsed;
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            content.classList.add('collapsed');
            localStorage.setItem('sidebarState', 'collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            content.classList.remove('collapsed');
            localStorage.setItem('sidebarState', 'expanded');
        }
    });

    // Função para lidar com o envio de tickets para o DP
    document.querySelectorAll('.send-dp-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            const ticketId = this.getAttribute('data-id');
            sendTicketToDP(ticketId);
        });
    });

    // Função para enviar um ticket para o Departamento Pessoal
    function sendTicketToDP(ticketId) {
        // Mostrar indicador de carregamento
        document.getElementById('loading-ticket').style.display = 'flex';

        // Fazer requisição para enviar o ticket para o DP
        fetch(`/send_to_dp/${ticketId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Esconder indicador de carregamento
            document.getElementById('loading-ticket').style.display = 'none';
            
            if (data.success) {
                alert('Ticket enviado para o Departamento Pessoal com sucesso!');
                
                // Mover o ticket para a lista de tickets em atendimento
                // ou simplesmente recarregar a página para refletir as mudanças
                window.location.reload();
            } else {
                alert('Erro ao enviar ticket para o DP: ' + data.message);
            }
        })
        .catch(error => {
            document.getElementById('loading-ticket').style.display = 'none';
            console.error('Erro:', error);
            alert('Erro ao enviar ticket para o DP. Consulte o console para mais detalhes.');
        });
    }
});
