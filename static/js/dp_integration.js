// dp_integration.js

function sendToDP(ticketId) {
    if (!confirm("Deseja realmente enviar este ticket para o Departamento Pessoal?")) return;

    fetch(`/send_to_dp/${ticketId}`, {
        method: "POST"
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Ticket enviado para o DP com sucesso!");

            // Remove o ticket da lista "Em Espera"
            let waitingRow = document.querySelector(`#ticket-list-waiting tr[data-id="${ticketId}"]`);
            let detailsRow = document.querySelector(`#details-${ticketId}`);
            if (waitingRow) waitingRow.remove();
            if (detailsRow) detailsRow.remove();
        } else {
            alert("Erro ao enviar para o DP: " + (data.message || "Erro desconhecido."));
        }
    })
    .catch(error => {
        alert("Erro ao enviar para o DP: " + error);
    });
}

// Adiciona os eventos aos botões "Enviar para DP"
function attachSendToDPEvents() {
    document.querySelectorAll('.btn-send-dp').forEach(button => {
        button.addEventListener('click', function () {
            let ticketId = this.getAttribute('data-id');
            sendToDP(ticketId);
        });
    });
}

// Rodar sempre que a página carregar e após atualizar a lista
document.addEventListener('DOMContentLoaded', attachSendToDPEvents);

// Caso você use SocketIO ou adicione tickets dinamicamente, 
// chame attachSendToDPEvents() sempre após adicionar um novo ticket à lista!
