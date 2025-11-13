document.addEventListener('DOMContentLoaded', function() {
    // Variáveis para armazenar os gráficos
    let ticketsChart, completedTicketsChart, recruiterPerformanceChart;
    let averageWaitTimeChart, averageServiceTimeChart, waitVsServiceTimeChart;
    
    // Helper: formata Date para YYYY-MM-DD usando horário local
    function toLocalYMD(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    
    // Configuração do Relatório de Situação
    const btnRelatorioSituacao = document.getElementById('btn-relatorio-situacao');
    const btnConfirmarExportacao = document.getElementById('btn-confirmar-exportacao');
    
    // Inicializar o modal com data padrão (início do ano até hoje)
    if (btnRelatorioSituacao && btnConfirmarExportacao) {
        const hoje = new Date();
        const inicioAno = new Date(hoje.getFullYear(), 0, 1); // 1º de janeiro do ano atual
        
        const dataInicialInput = document.getElementById('data-inicial-situacao');
        const dataFinalInput = document.getElementById('data-final-situacao');
        
        if (dataInicialInput && dataFinalInput) {
            dataInicialInput.value = toLocalYMD(inicioAno);
            dataFinalInput.value = toLocalYMD(hoje);
        }
        
        btnConfirmarExportacao.addEventListener('click', function() {
            const dataInicial = dataInicialInput.value;
            const dataFinal = dataFinalInput.value;
            
            if (!dataInicial || !dataFinal) {
                alert('Por favor, selecione as datas inicial e final.');
                return;
            }
            
            // Criar URL para exportação com os parâmetros de data
            const url = `/exportar_relatorio_situacao?data_inicial=${dataInicial}&data_final=${dataFinal}`;
            
            // Redirecionar para a URL de exportação
            window.location.href = url;
            
            // Fechar o modal (usando Bootstrap)
            const modalRelatorioSituacao = bootstrap.Modal.getInstance(document.getElementById('modalRelatorioSituacao'));
            if (modalRelatorioSituacao) {
                modalRelatorioSituacao.hide();
            }
        });
    }
    
    // Mapeamento de guichê para nomes (vigente a partir de 21/08/2025)
    const DATA_CORTE_MAPEAMENTO = '2025-08-21';
    const guicheParaNomeAtual = {
        "1": "Guilherme",
        "2": "Samira",
        "3": "Rafaella",
        "4": "Wilson",
        "5": "Grasielle",
        "6": "Nara"
    };
    function labelGuiche(guiche, dataReferencia) {
        const g = (guiche || '').toString().trim();
        if (!g) return 'Guichê N/D';
        if (dataReferencia >= DATA_CORTE_MAPEAMENTO && guicheParaNomeAtual[g]) {
            return `${guicheParaNomeAtual[g]}`;
        }
        return `Guichê ${g}`;
    }
    
    // Variável para armazenar a data selecionada atualmente
    let dataAtualSelecionada = toLocalYMD(new Date()); // Data atual por padrão
    
    // Variável para armazenar a categoria selecionada
    let categoriaSelecionada = "ALL"; // Todas as categorias por padrão
    
    // Elemento para mostrar a data selecionada
    const dataInfoElement = document.createElement('div');
    dataInfoElement.className = 'alert alert-info mt-3';
    dataInfoElement.style.textAlign = 'center';
    dataInfoElement.innerHTML = `<strong>Data Selecionada:</strong> ${formatarData(dataAtualSelecionada)} | <strong>Categoria:</strong> Todas`;
    
    // Inicializar o calendário
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        events: '/api/get-calendar-events', // Endpoint para puxar eventos do calendário (quantidade de pessoas)
        dateClick: function(info) {
            var date = info.dateStr;
            dataAtualSelecionada = date;
            
            // Atualizar o seletor de data
            document.getElementById('calendarSelect').value = date;
            
            // Atualizar a informação da data selecionada
            dataInfoElement.innerHTML = `<strong>Data Selecionada:</strong> ${formatarData(date)} | <strong>Categoria:</strong> ${getNomeCategoria(categoriaSelecionada)}`;
            
            // Realçar a data selecionada
            const anteriorSelecionado = document.querySelector('.fc-day-selected');
            if (anteriorSelecionado) {
                anteriorSelecionado.classList.remove('fc-day-selected');
            }
            info.dayEl.classList.add('fc-day-selected');
            
            loadIndicators(date, categoriaSelecionada); // Carrega os indicadores para o dia selecionado
        }
    });
    calendar.render();
    
    // Inserir informação de data após o calendário
    calendarEl.parentNode.insertBefore(dataInfoElement, calendarEl.nextSibling);
    
    // Adicionar estilo CSS para o dia selecionado
    const style = document.createElement('style');
    style.textContent = '.fc-day-selected { background-color: rgba(0, 123, 255, 0.2) !important; }';
    document.head.appendChild(style);

    // Função para formatar a data no padrão brasileiro
    function formatarData(dataStr) {
        const dataParts = dataStr.split('-');
        const data = new Date(dataParts[0], dataParts[1] - 1, dataParts[2]);
        return data.toLocaleDateString('pt-BR');
    }

    // Função para obter o nome da categoria para exibição
    function getNomeCategoria(categoria) {
        if (!categoria || categoria === "ALL") {
            return "Todas";
        }
        return categoria;
    }

    // Função para carregar os indicadores com filtros
    function loadIndicators(date, category, period = null) {
        let url = `/api/get-indicators?date=${date}`;
        
        if (category && category !== "ALL") {
            url += `&category=${category}`;
        }
        
        if (period) {
            url += `&period=${period}`;
        }
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                updateCharts(data); // Atualiza os gráficos com os dados recebidos
            })
            .catch(error => {
                console.error('Erro ao carregar os indicadores:', error);
            });
    }

    // Inicializar todos os gráficos
    function initCharts() {
        const ctxTickets = document.getElementById('ticketsChart').getContext('2d');
        ticketsChart = new Chart(ctxTickets, {
            type: 'bar',
            data: {
                labels: [], // Aqui vão as categorias de tickets
                datasets: [{
                    label: 'Senhas Emitidas',
                    data: [], // Aqui vão os dados de tickets emitidos
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        const ctxCompletedTickets = document.getElementById('completedTicketsChart').getContext('2d');
        completedTicketsChart = new Chart(ctxCompletedTickets, {
            type: 'bar',
            data: {
                labels: [], // Categorias de tickets
                datasets: [{
                    label: 'Senhas Concluídas',
                    data: [], // Dados de tickets concluídos
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        const ctxRecruiterPerformance = document.getElementById('recruiterPerformanceChart').getContext('2d');
        recruiterPerformanceChart = new Chart(ctxRecruiterPerformance, {
            type: 'pie',
            data: {
                labels: [], // Recrutadores
                datasets: [{
                    label: 'Desempenho dos Recrutadores',
                    data: [], // Dados de desempenho
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true
            }
        });

        const ctxAverageWaitTime = document.getElementById('averageWaitTimeChart').getContext('2d');
        averageWaitTimeChart = new Chart(ctxAverageWaitTime, {
            type: 'line',
            data: {
                labels: [], // Categorias
                datasets: [{
                    label: 'Tempo Médio de Espera',
                    data: [], // Dados de tempo médio de espera
                    fill: false,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        const ctxAverageServiceTime = document.getElementById('averageServiceTimeChart').getContext('2d');
        averageServiceTimeChart = new Chart(ctxAverageServiceTime, {
            type: 'line',
            data: {
                labels: [], // Categorias
                datasets: [{
                    label: 'Tempo Médio de Atendimento',
                    data: [], // Dados de tempo médio de atendimento
                    fill: false,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        const ctxWaitVsServiceTime = document.getElementById('waitVsServiceTimeChart').getContext('2d');
        waitVsServiceTimeChart = new Chart(ctxWaitVsServiceTime, {
            type: 'line',
            data: {
                labels: [], // Categorias
                datasets: [{
                    label: 'Tempo de Espera (minutos)',
                    data: [], // Dados de tempo de espera
                    fill: false,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    tension: 0.1
                }, {
                    label: 'Tempo de Atendimento (minutos)',
                    data: [], // Dados de tempo de atendimento
                    fill: false,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Função para atualizar os gráficos com os novos dados
    function updateCharts(data) {
        ticketsChart.data.labels = data.categories;
        ticketsChart.data.datasets[0].data = data.ticketsIssued;
        ticketsChart.update();

        completedTicketsChart.data.labels = data.categories;
        completedTicketsChart.data.datasets[0].data = data.ticketsCompleted;
        completedTicketsChart.update();
        
        // Mapear os números de guichê para nomes (após a data de corte) e filtrar valores nulos
        const nomesRecrutadores = [];
        const desempenhoRecrutadores = [];
        
        for (let i = 0; i < data.recruiters.length; i++) {
            const guiche = data.recruiters[i];
            const desempenho = data.recruiterPerformance[i];
            
            if (!guiche) continue;
            nomesRecrutadores.push(labelGuiche(guiche, dataAtualSelecionada));
            desempenhoRecrutadores.push(desempenho);
        }

        recruiterPerformanceChart.data.labels = nomesRecrutadores;
        recruiterPerformanceChart.data.datasets[0].data = desempenhoRecrutadores;
        recruiterPerformanceChart.update();

        averageWaitTimeChart.data.labels = data.categories;
        averageWaitTimeChart.data.datasets[0].data = data.averageWaitTimes;
        averageWaitTimeChart.update();

        averageServiceTimeChart.data.labels = data.categories;
        averageServiceTimeChart.data.datasets[0].data = data.averageServiceTimes;
        averageServiceTimeChart.update();

        waitVsServiceTimeChart.data.labels = data.categories;
        waitVsServiceTimeChart.data.datasets[0].data = data.waitTimes;
        waitVsServiceTimeChart.data.datasets[1].data = data.serviceTimes;
        waitVsServiceTimeChart.update();
    }

    // Inicializar gráficos quando a página carrega
    initCharts();
    
    // Carregar dados do dia atual por padrão
    loadIndicators(dataAtualSelecionada, categoriaSelecionada);
    
    // Quando a data é alterada no seletor do calendário
    document.getElementById('calendarSelect').addEventListener('change', function() {
        const novaData = this.value;
        dataAtualSelecionada = novaData;
        
        // Atualizar a informação da data selecionada
        dataInfoElement.innerHTML = `<strong>Data Selecionada:</strong> ${formatarData(novaData)} | <strong>Categoria:</strong> ${getNomeCategoria(categoriaSelecionada)}`;
        
        // Atualizar a seleção no calendário
        calendar.gotoDate(novaData);
        
        // Obter o elemento da data no calendário e adicionar a classe
        setTimeout(() => {
            const dataElements = document.querySelectorAll('.fc-daygrid-day');
            dataElements.forEach(el => {
                el.classList.remove('fc-day-selected');
                const dataAttr = el.getAttribute('data-date');
                if (dataAttr === novaData) {
                    el.classList.add('fc-day-selected');
                }
            });
        }, 100);
        
        loadIndicators(novaData, categoriaSelecionada);
    });
    
    // Lidar com seleção de período predefinido
    document.getElementById('predefinedPeriodSelect').addEventListener('change', function() {
        const periodoSelecionado = this.value;
        let dataConsulta = new Date();
        let periodo = null;
        
        switch(periodoSelecionado) {
            case 'HOJE':
                // Usar apenas a data atual, sem período
                break;
            case '3DIAS':
                periodo = '3DIAS';
                dataConsulta.setDate(dataConsulta.getDate() - 3);
                break;
            case 'SEMANA':
                periodo = 'SEMANA';
                dataConsulta.setDate(dataConsulta.getDate() - 7);
                break;
            case 'MES':
                periodo = 'MES';
                dataConsulta.setMonth(dataConsulta.getMonth() - 1);
                break;
            case 'ANO':
                periodo = 'ANO';
                dataConsulta.setFullYear(dataConsulta.getFullYear() - 1);
                break;
        }
        
        const dataFormatada = toLocalYMD(dataConsulta);
        dataAtualSelecionada = dataFormatada;
        
        // Atualizar o valor do calendário
        document.getElementById('calendarSelect').value = dataFormatada;
        
        // Atualizar a informação da data selecionada com o período
        let textoData = formatarData(dataFormatada);
        if (periodo) {
            switch (periodo) {
                case '3DIAS':
                    textoData = `Últimos 3 Dias (até ${formatarData(toLocalYMD(new Date()))})`;
                    break;
                case 'SEMANA':
                    textoData = `Última Semana (até ${formatarData(toLocalYMD(new Date()))})`;
                    break;
                case 'MES':
                    textoData = `Último Mês (até ${formatarData(toLocalYMD(new Date()))})`;
                    break;
                case 'ANO':
                    textoData = `Último Ano (até ${formatarData(toLocalYMD(new Date()))})`;
                    break;
            }
        }
        
        dataInfoElement.innerHTML = `<strong>Período Selecionado:</strong> ${textoData} | <strong>Categoria:</strong> ${getNomeCategoria(categoriaSelecionada)}`;
        
        // Atualizar a seleção no calendário
        calendar.gotoDate(dataFormatada);
        
        // Obter o elemento da data no calendário e adicionar a classe
        setTimeout(() => {
            const dataElements = document.querySelectorAll('.fc-daygrid-day');
            dataElements.forEach(el => {
                el.classList.remove('fc-day-selected');
                const dataAttr = el.getAttribute('data-date');
                if (dataAttr === dataFormatada) {
                    el.classList.add('fc-day-selected');
                }
            });
        }, 100);
        
        // Carregar os indicadores com o período selecionado
        loadIndicators(dataFormatada, categoriaSelecionada, periodo);
    });
    
    // Lidar com seleção de categoria
    document.getElementById('categorySelect').addEventListener('change', function() {
        categoriaSelecionada = this.value;
        
        // Atualizar a informação da categoria selecionada
        dataInfoElement.innerHTML = `<strong>Data Selecionada:</strong> ${formatarData(dataAtualSelecionada)} | <strong>Categoria:</strong> ${getNomeCategoria(categoriaSelecionada)}`;
        
        loadIndicators(dataAtualSelecionada, categoriaSelecionada);
    });
});
