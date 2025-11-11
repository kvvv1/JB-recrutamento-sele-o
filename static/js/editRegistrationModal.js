function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); // Dia com dois dígitos
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês com dois dígitos (0-indexado)
    const year = date.getFullYear(); // Ano com 4 dígitos
    return `${day}/${month}/${year}`; // Formato dd/mm/yyyy
}    
    
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', function () {
            const registroId = this.getAttribute('data-id');
            openEditForm(registroId); // Função para carregar os dados
        });
    });

    function openEditForm(cpf) {
        fetch(`/get_registration/${cpf}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar os dados do candidato');
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                // Preenche os campos do modal com os dados retornados
                document.getElementById('edit-cpf').value = data.cpf;
                document.getElementById('edit-nome-completo').value = data.nome_completo || '';
                document.getElementById('edit-telefone').value = data.telefone || '';
                document.getElementById('edit-endereco').value = data.endereco || '';
                document.getElementById('edit-bairro').value = data.bairro || '';
                document.getElementById('edit-cidade').value = data.cidade || '';
                document.getElementById('edit-observacoes').value = data.observacoes || '';
                document.getElementById('edit-situacao').value = data.situacao || '';
                // Formata a data de nascimento
                const formattedDate = data.data_nasc ? formatDate(data.data_nasc) : '';
                document.getElementById('edit-data_nasc').value = formattedDate;                
                document.getElementById('edit-escolaridade').value = data.escolaridade || '';
                document.getElementById('edit-fumante').value = data.fumante || '';
                document.getElementById('edit-bebida').value = data.bebida || '';
                document.getElementById('edit-genero').value = data.genero || '';
                document.getElementById('edit-peso').value = data.peso || '';
                document.getElementById('edit-cor_pele').value = data.cor_pele || '';
                document.getElementById('edit-tatuagem').value = data.tatuagem || '';
                document.getElementById('edit-cursos').value = data.cursos || '';
                document.getElementById('edit-conhecimento_digitacao').value = data.conhecimento_digitacao || '';
                document.getElementById('edit-avaliacao_rh').value = data.avaliacao_rh || '';
                document.getElementById('edit-sindicancia').value = data.sindicancia || '';
                document.getElementById('edit-avaliacao_gerencia').value = data.avaliacao_gerencia || '';
                document.getElementById('edit-assinatura_gerencia').value = data.assinatura_gerencia || '';
                document.getElementById('edit-recrutador').value = data.recrutador || '';

                // Formata Regiões de Preferência
                const regioesPreferencia = data.regioes_preferencia
                    ? data.regioes_preferencia.split(',').join('\n')
                    : '';
                document.getElementById('edit-regioes_preferencia').value = regioesPreferencia;

                // Formata Disponibilidade de Horário
                const disponibilidadeHorario = data.disponibilidade_horario
                    ? data.disponibilidade_horario.split(',').join('\n')
                    : '';
                document.getElementById('edit-disponibilidade_horario').value = disponibilidadeHorario;

                // Formata Cargo Indicado
                const cargoIndicado = data.cargo_indicado
                    ? data.cargo_indicado.split(',').join('\n')
                    : '';
                document.getElementById('edit-cargo_indicado').value = cargoIndicado;


                // Abre o modal
                const modal = new bootstrap.Modal(document.getElementById('editRegistrationModal'));
                modal.show();
            })
            .catch(error => {
                console.error('Erro ao carregar os dados da ficha:', error);
                alert('Erro ao carregar os dados da ficha.');
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Seleciona o botão de fechar do modal
        const closeButton = document.querySelector('.btn-close[data-bs-dismiss="modal"]');
    
        if (closeButton) {
            closeButton.addEventListener('click', function () {
                // Fecha o modal explicitamente
                const modalElement = document.getElementById('editRegistrationModal');
                
                // Verifica se a instância do modal existe
                let bootstrapModal = bootstrap.Modal.getInstance(modalElement);
                
                if (!bootstrapModal) {
                    bootstrapModal = new bootstrap.Modal(modalElement); // Cria uma nova instância, se necessário
                }
    
                bootstrapModal.hide(); // Fecha o modal
            });
        }
    });
    