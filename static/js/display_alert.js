// Função para garantir que o som de alerta seja pré-carregado corretamente
var alertSound = document.getElementById('alert-sound');

// Função para reproduzir o som de alerta
function playAlertSound() {
    alertSound.play().catch(function (error) {
        console.error('Erro ao tentar reproduzir o som: ', error);
        alertSound.load(); // Recarregar o som caso ocorra um erro
        alertSound.play().catch(function (error) {
            console.error('Erro ao tentar reproduzir o som após o recarregamento: ', error);
        });
    });
}

// Função para realizar a narração do ticket chamado
function narrateTicket(ticket) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Interrompe qualquer narração anterior
        var msg = new SpeechSynthesisUtterance(`Chamando ${ticket.name}, senha ${ticket.ticket_number}, para o guichê ${ticket.guiche}`);
        msg.lang = 'pt-BR';  // Definir a linguagem
        msg.rate = 1;        // Velocidade normal da fala
        msg.pitch = 1;       // Tom normal da voz
        msg.volume = 1;      // Volume máximo

        window.speechSynthesis.speak(msg); // Iniciar a narração
    } else {
        console.error('Este navegador não suporta Web Speech API.');
    }
}

// Receber evento do Socket.IO para atualizar o display e reproduzir o som/narração
var socket = io.connect('http://' + document.domain + ':' + location.port);

socket.on('update_display', function (data) {
    // Atualizar os elementos no display
    document.getElementById('current-ticket-number').textContent = data.current_ticket_number;
    document.getElementById('current-guiche').textContent = data.current_guiche;
    document.getElementById('current-name').textContent = data.current_name;
    document.getElementById('current-ticket-time').textContent = data.current_time || 'N/A';

    // Se o áudio deve ser reproduzido, tocar o som de alerta e narrar o ticket chamado
    if (data.play_audio) {
        playAlertSound();
        narrateTicket(data);
    }

    // Atualizar as chamadas recentes
    var recentCallsContainer = document.querySelector('.previous-calls .call-info-container');
    recentCallsContainer.innerHTML = ''; // Limpar as chamadas recentes existentes

    data.called_tickets.forEach(function (ticket) {
        var callInfo = document.createElement('div');
        callInfo.className = 'call-info';
        callInfo.innerHTML = `
            <div class="name">${ticket.name}</div>
            <div class="ticket-number">SENHA: ${ticket.ticket_number}</div>
            <div class="guiche-info">GUICHÊ: ${ticket.guiche}</div>
            <div class="call-time">${ticket.called_at}</div>
        `;
        recentCallsContainer.appendChild(callInfo);
    });
});

