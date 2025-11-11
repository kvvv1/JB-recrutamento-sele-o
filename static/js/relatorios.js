document.addEventListener('DOMContentLoaded', function() {
    let periodoSelect = document.getElementById('filtro-periodo');
    let dataInicio = document.getElementById('data-inicio');
    let dataFim = document.getElementById('data-fim');
    let relatorioTabs = document.getElementById('relatorioTabs');
    let exportarBtn = document.getElementById('exportar-excel');
    let tipoAtual = 'quantitativo';
    let periodoAtual = 'HOJE';
    let chartRelatorio = null;

    // Mapeamento de nomes de colunas mais amigáveis
    const colunasTraducao = {
        // Quantitativo
        'total_registros': 'Total de Registros',
        'aprovados_rh': 'Aprovados RH',
        'reprovados_rh': 'Reprovados RH',
        'aprovados_sindicancia': 'Aprovados Sindicância',
        'reprovados_sindicancia': 'Reprovados Sindicância',
        'aprovados_gerencia': 'Aprovados Gerência',
        'reprovados_gerencia': 'Reprovados Gerência',
        'admitidos': 'Admitidos',
        'nao_avaliado': 'Não Avaliados',
        'em_verificacao': 'Em Verificação',
        'em_conversa': 'Em Conversa',
        'outros': 'Outros',
        'created_at': 'Data de Criação',
        
        // Diário
        'data_formatada': 'Data',
        'data_ordenacao': 'Ordem',
        'total_entrevistados': 'Total Entrevistados',
        'total_aprovados': 'Aprovados',
        'total_reprovados': 'Reprovados',
        'total_admitidos': 'Admitidos',
        'total_sem_avaliacao': 'Sem Avaliação',
        'total_em_verificacao': 'Em Verificação',
        'total_em_conversa': 'Em Conversa',
        'total_outros': 'Outros',
        
        // Semana
        'dia_da_semana': 'Dia da Semana',
        
        // Categoria
        'category': 'Categoria',
        
        // Aprovados x Reprovados
        'situacao': 'Situação',
        'total': 'Total',
        
        // Lista Aprovados/Reprovados
        'nome_completo': 'Nome Completo',
        'cpf': 'CPF',
        'recrutador': 'Recrutador',
        'data_entrevista': 'Data da Entrevista',
        'motivo_reprovacao_rh': 'Motivo da Reprovação',
        
        // Ranking Recrutadores
        
        // Tempo Espera/Atendimento
        'tempo_medio_espera_min': 'Tempo Médio de Espera (min)',
        'tempo_medio_atendimento_min': 'Tempo Médio de Atendimento (min)',
        
        // Mensal por Categoria
        'ano': 'Ano',
        'mes': 'Mês',
        'aprovados': 'Aprovados',
        'reprovados': 'Reprovados',
        
        // Linha do Tempo
        'data': 'Data'
    };

    // Ordem preferencial das colunas por tipo de relatório
    const ordemColunas = {
        'quantitativo': [
            'total_registros', 'aprovados_rh', 'reprovados_rh', 
            'aprovados_sindicancia', 'reprovados_sindicancia', 
            'aprovados_gerencia', 'reprovados_gerencia', 
            'admitidos', 'nao_avaliado', 'em_verificacao', 'em_conversa', 'outros'
        ],
        'diario': [
            'data_formatada', 'total_entrevistados', 'total_aprovados', 
            'total_reprovados', 'total_admitidos', 'total_sem_avaliacao', 
            'total_em_verificacao', 'total_em_conversa', 'total_outros'
        ],
        'semana': [
            'dia_da_semana', 'total_entrevistados', 'total_aprovados', 'total_reprovados'
        ],
        'categoria': [
            'category', 'total_entrevistados', 'total_aprovados', 'total_reprovados', 'total_admitidos'
        ],
        'aprovados_x_reprovados': [
            'situacao', 'total'
        ],
        'lista_aprovados': [
            'nome_completo', 'cpf', 'recrutador', 'situacao', 'data_entrevista'
        ],
        'lista_reprovados': [
            'nome_completo', 'cpf', 'recrutador', 'situacao', 'data_entrevista', 'motivo_reprovacao_rh'
        ],
        'ranking_recrutadores': [
            'recrutador', 'total_entrevistados', 'total_aprovados', 'total_reprovados', 
            'total_admitidos', 'total_sem_avaliacao', 'total_em_verificacao', 
            'total_em_conversa', 'total_outros'
        ],
        'tempo_espera_atendimento': [
            'category', 'tempo_medio_espera_min', 'tempo_medio_atendimento_min'
        ],
        'mensal_categoria': [
            'ano', 'mes', 'category', 'total_entrevistados', 'aprovados', 'reprovados', 'admitidos'
        ],
        'linha_tempo': [
            'data', 'total_entrevistados', 'aprovados', 'reprovados', 'admitidos'
        ]
    };

    // Configurações para os diferentes tipos de gráficos
    const configuracoesGraficos = {
        'quantitativo': {
            type: 'bar',
            title: 'Resumo Quantitativo',
            excludeCols: ['created_at', 'created_at_dt'],
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantidade'
                        }
                    }
                }
            }
        },
        'diario': {
            type: 'line',
            title: 'Evolução Diária',
            xAxisCol: 'data_formatada',
            valueCols: ['total_entrevistados', 'total_aprovados', 'total_reprovados', 'total_admitidos'],
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantidade'
                        }
                    }
                }
            }
        },
        'semana': {
            type: 'bar',
            title: 'Distribuição por Dia da Semana',
            xAxisCol: 'dia_da_semana',
            valueCols: ['total_entrevistados', 'total_aprovados', 'total_reprovados'],
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantidade'
                        }
                    }
                }
            }
        },
        'categoria': {
            type: 'bar',
            title: 'Distribuição por Categoria',
            xAxisCol: 'category',
            valueCols: ['total_entrevistados', 'total_aprovados', 'total_reprovados', 'total_admitidos'],
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantidade'
                        }
                    }
                }
            }
        },
        'aprovados_x_reprovados': {
            type: 'pie',
            title: 'Aprovados x Reprovados',
            labelCol: 'situacao',
            valueCol: 'total',
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Proporção de Aprovados e Reprovados'
                    }
                }
            }
        },
        'ranking_recrutadores': {
            type: 'horizontalBar',
            title: 'Desempenho dos Recrutadores',
            xAxisCol: 'recrutador',
            valueCols: ['total_aprovados', 'total_reprovados', 'total_admitidos'],
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantidade'
                        }
                    }
                }
            }
        },
        'tempo_espera_atendimento': {
            type: 'bar',
            title: 'Tempo Médio por Categoria',
            xAxisCol: 'category',
            valueCols: ['tempo_medio_espera_min', 'tempo_medio_atendimento_min'],
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Minutos'
                        }
                    }
                }
            }
        },
        'mensal_categoria': {
            type: 'line',
            title: 'Evolução Mensal por Categoria',
            xAxisCol: function(data) {
                // Combinando ano e mês para o eixo X
                return data.map(row => `${row.mes}/${row.ano}`);
            },
            valueCols: ['total_entrevistados', 'aprovados', 'reprovados', 'admitidos'],
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantidade'
                        }
                    }
                }
            }
        },
        'linha_tempo': {
            type: 'line',
            title: 'Evolução Temporal',
            xAxisCol: 'data',
            valueCols: ['total_entrevistados', 'aprovados', 'reprovados', 'admitidos'],
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantidade'
                        }
                    }
                }
            }
        }
    };

    // Cores para os gráficos
    const cores = [
        'rgba(171, 26, 24, 0.7)',   // Vermelho RS
        'rgba(23, 49, 69, 0.7)',     // Azul RS
        'rgba(142, 22, 21, 0.7)',    // Vermelho escuro
        'rgba(31, 73, 125, 0.7)',    // Azul escuro
        'rgba(255, 99, 132, 0.7)',   // Rosa
        'rgba(54, 162, 235, 0.7)',   // Azul
        'rgba(255, 206, 86, 0.7)',   // Amarelo
        'rgba(75, 192, 192, 0.7)',   // Verde água
        'rgba(153, 102, 255, 0.7)',  // Roxo
        'rgba(255, 159, 64, 0.7)'    // Laranja
    ];

    function carregarRelatorio(tipo) {
        tipoAtual = tipo;
        exportarBtn.style.display = 'none';
        document.getElementById('relatorio-content').innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary"></div> Carregando...</div>`;
  
        let period = periodoSelect.value;
        let url = `/indicadores/data?tipo=${tipoAtual}&period=${period}`;
        if (period === 'PERSONALIZADO') {
            url += `&date_start=${dataInicio.value}&date_end=${dataFim.value}`;
        }
  
        fetch(url)
            .then(res => res.json())
            .then(res => {
                exportarBtn.style.display = '';
                renderizarRelatorio(res.data, tipoAtual);
            })
            .catch(error => {
                document.getElementById('relatorio-content').innerHTML = `
                    <div class="alert alert-danger">
                        Erro ao carregar os dados: ${error.message || 'Erro desconhecido'}
                    </div>`;
            });
    }
  
    relatorioTabs.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function() {
            relatorioTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            carregarRelatorio(btn.getAttribute('data-tipo'));
        });
    });
  
    periodoSelect.addEventListener('change', function() {
        if (periodoSelect.value === 'PERSONALIZADO') {
            dataInicio.style.display = '';
            dataFim.style.display = '';
        } else {
            dataInicio.style.display = 'none';
            dataFim.style.display = 'none';
            carregarRelatorio(tipoAtual);
        }
    });
  
    [dataInicio, dataFim].forEach(input => {
        input.addEventListener('change', function() {
            if (periodoSelect.value === 'PERSONALIZADO' && dataInicio.value && dataFim.value) {
                carregarRelatorio(tipoAtual);
            }
        });
    });
  
    exportarBtn.addEventListener('click', function() {
        let url = `/indicadores/export?tipo=${tipoAtual}&period=${periodoSelect.value}`;
        if (periodoSelect.value === 'PERSONALIZADO') {
            url += `&date_start=${dataInicio.value}&date_end=${dataFim.value}`;
        }
        window.location.href = url;
    });
  
    // Função para traduzir o nome da coluna
    function traduzirColuna(coluna) {
        return colunasTraducao[coluna] || coluna.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Ordenar colunas conforme a configuração preferencial
    function ordenarColunas(colunas, tipo) {
        if (!ordemColunas[tipo]) {
            return colunas;
        }

        // Pegar as colunas na ordem definida
        let colunasOrdenadas = ordemColunas[tipo].filter(col => colunas.includes(col));
        
        // Adicionar quaisquer colunas extras que não estejam na configuração
        colunas.forEach(col => {
            if (!colunasOrdenadas.includes(col)) {
                colunasOrdenadas.push(col);
            }
        });
        
        return colunasOrdenadas;
    }

    // Função para gerar gráfico adequado ao tipo de relatório
    function gerarGrafico(data, tipo) {
        if (chartRelatorio) {
            chartRelatorio.destroy();
        }

        const config = configuracoesGraficos[tipo];
        if (!config) return;

        const ctx = document.getElementById('chartRelatorio').getContext('2d');
        
        // Configuração base do gráfico
        const chartConfig = {
            type: config.type === 'horizontalBar' ? 'bar' : config.type, // Compatibilidade com Chart.js v3+
            options: {
                ...config.options,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: config.title
                    }
                }
            }
        };

        // Configuração específica baseada no tipo de gráfico
        if (config.type === 'pie' || config.type === 'doughnut') {
            // Gráficos de pizza ou rosca
            const labels = data.map(item => item[config.labelCol]);
            const values = data.map(item => item[config.valueCol]);
            
            chartConfig.data = {
                labels: labels,
                datasets: [{
                    label: traduzirColuna(config.valueCol),
                    data: values,
                    backgroundColor: cores.slice(0, labels.length),
                    borderColor: cores.slice(0, labels.length).map(cor => cor.replace('0.7', '1')),
                    borderWidth: 1
                }]
            };
        } else if (config.type === 'bar' || config.type === 'line' || config.type === 'horizontalBar') {
            // Gráficos de barras ou linhas
            let labels = [];
            if (typeof config.xAxisCol === 'function') {
                labels = config.xAxisCol(data);
            } else {
                labels = data.map(item => item[config.xAxisCol]);
            }
            
            const datasets = [];
            
            if (config.valueCols) {
                // Múltiplas séries de dados
                config.valueCols.forEach((col, index) => {
                    datasets.push({
                        label: traduzirColuna(col),
                        data: data.map(item => item[col]),
                        backgroundColor: cores[index % cores.length],
                        borderColor: cores[index % cores.length].replace('0.7', '1'),
                        borderWidth: 1,
                        tension: config.type === 'line' ? 0.1 : undefined
                    });
                });
            } else if (tipo === 'quantitativo') {
                // Caso especial para o relatório quantitativo
                const row = data[0];
                const cols = Object.keys(row).filter(col => 
                    !config.excludeCols || !config.excludeCols.includes(col)
                );
                
                cols.forEach((col, index) => {
                    datasets.push({
                        label: traduzirColuna(col),
                        data: [row[col]],
                        backgroundColor: cores[index % cores.length],
                        borderColor: cores[index % cores.length].replace('0.7', '1'),
                        borderWidth: 1
                    });
                });
                
                // Para o relatório quantitativo, usamos apenas uma barra por métrica
                labels = cols.map(traduzirColuna);
                chartConfig.type = 'bar';
                chartConfig.data = {
                    labels: ['Métricas'],
                    datasets: cols.map((col, index) => ({
                        label: traduzirColuna(col),
                        data: [row[col]],
                        backgroundColor: cores[index % cores.length],
                        borderColor: cores[index % cores.length].replace('0.7', '1'),
                        borderWidth: 1
                    }))
                };
                return new Chart(ctx, chartConfig);
            }
            
            chartConfig.data = {
                labels: labels,
                datasets: datasets
            };
            
            // Configuração especial para gráfico de barras horizontais
            if (config.type === 'horizontalBar') {
                chartConfig.options.indexAxis = 'y';
            }
        }
        
        chartRelatorio = new Chart(ctx, chartConfig);
    }
  
    // Função para renderizar o relatório com dados formatados e ordenados
    function renderizarRelatorio(data, tipo) {
        let content = document.getElementById('relatorio-content');
        if (!data || data.length === 0) {
            content.innerHTML = '<div class="alert alert-warning">Nenhum dado encontrado para o período selecionado!</div>';
            return;
        }

        // Para relatórios de lista, não exibimos gráfico
        const semGrafico = ['lista_aprovados', 'lista_reprovados'];
        const mostrarGrafico = !semGrafico.includes(tipo);

        // Define título do relatório
        let tituloRelatorio = '';
        switch (tipo) {
            case 'quantitativo': tituloRelatorio = 'Resumo Quantitativo'; break;
            case 'diario': tituloRelatorio = 'Relatório Diário'; break;
            case 'semana': tituloRelatorio = 'Relatório por Dia da Semana'; break;
            case 'categoria': tituloRelatorio = 'Relatório por Categoria'; break;
            case 'aprovados_x_reprovados': tituloRelatorio = 'Aprovados x Reprovados'; break;
            case 'lista_aprovados': tituloRelatorio = 'Lista de Aprovados'; break;
            case 'lista_reprovados': tituloRelatorio = 'Lista de Reprovados'; break;
            case 'ranking_recrutadores': tituloRelatorio = 'Ranking de Recrutadores'; break;
            case 'tempo_espera_atendimento': tituloRelatorio = 'Tempo de Espera e Atendimento'; break;
            case 'mensal_categoria': tituloRelatorio = 'Relatório Mensal por Categoria'; break;
            case 'linha_tempo': tituloRelatorio = 'Linha do Tempo'; break;
            default: tituloRelatorio = 'Relatório';
        }

        // Renderiza o HTML
        let html = `<h4 class="mb-3">${tituloRelatorio}</h4>`;

        // Colunas do primeiro registro (todas as colunas disponíveis)
        let cols = Object.keys(data[0]);
        
        // Reordenar colunas conforme configuração
        cols = ordenarColunas(cols, tipo);

        // Renderiza tabela com as colunas traduzidas e ordenadas
        html += '<div class="table-responsive mb-4"><table class="table table-striped table-bordered"><thead class="thead-dark"><tr>';
        cols.forEach(col => {
            html += `<th>${traduzirColuna(col)}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        data.forEach(row => {
            html += '<tr>';
            cols.forEach(col => {
                // Formata valores numéricos e datas
                let value = row[col];
                if (typeof value === 'number') {
                    // Formata valores numéricos (2 casas decimais para tempo, inteiro para contagens)
                    if (col.includes('tempo_medio')) {
                        value = value.toFixed(2);
                    } else {
                        value = Math.round(value).toLocaleString('pt-BR');
                    }
                } else if (col === 'situacao' && tipo === 'aprovados_x_reprovados') {
                    // Destaca situações com cores
                    const classes = value.toLowerCase().includes('aprovado') ? 'text-success' : 'text-danger';
                    value = `<span class="${classes} font-weight-bold">${value}</span>`;
                }
                html += `<td>${value}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table></div>';

        // Adiciona canvas para o gráfico se necessário
        if (mostrarGrafico) {
            html += '<div class="chart-container" style="position: relative; height:400px; width:100%"><canvas id="chartRelatorio"></canvas></div>';
        }

        content.innerHTML = html;

        // Gera o gráfico apropriado para o tipo de relatório
        if (mostrarGrafico) {
            gerarGrafico(data, tipo);
        }
    }
  
    // Inicializa o relatório
    carregarRelatorio(tipoAtual);
});
