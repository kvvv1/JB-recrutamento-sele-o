 // Verificação do CPF e preenchimento dos dados automaticamente
 document.getElementById('cpf').addEventListener('change', function () {
    var cpf = this.value;
    if (cpf) {
        fetch(`/verificar_cpf?cpf=${cpf}`)
            .then(response => response.json())
            .then(data => {
                if (data.exists) {
                    // Preencher os campos do formulário com os dados existentes
                    document.getElementById('name').value = data.name;
                    document.getElementById('estado_civil').value = data.estado_civil;
                    document.getElementById('registro_id').value = data.id;
                    document.getElementById('cargo_pretendido1').checked = data.cargo_pretendido.includes('Auxiliar de Serviços Gerais');
                    document.getElementById('cargo_pretendido2').checked = data.cargo_pretendido.includes('Porteiro');
                    document.getElementById('cargo_pretendido3').checked = data.cargo_pretendido.includes('Zelador');
                    document.getElementById('cep').value = data.cep;
                    document.getElementById('endereco').value = data.endereco;
                    document.getElementById('numero').value = data.numero;
                    document.getElementById('complemento').value = data.complemento;
                    document.getElementById('bairro').value = data.bairro;
                    document.getElementById('cidade').value = data.cidade;
                    document.getElementById('telefone').value = data.telefone || data.telefones || '';  // ✅ Agora cobre os dois casos
                    if (document.getElementById('telefone_recado')) {
                        document.getElementById('telefone_recado').value = data.telefone_recado || '';  // ✅ Preenche o campo de telefone para recado
                    }
                    document.getElementById('email').value = data.email || '';  // ✅ Preenche o campo de e-mail
                    document.getElementById('telefones').value = data.telefones;
                    document.getElementById('estado_nasc').value = data.estado_nasc;
                    preencherCidades(data.estado_nasc);
                    document.getElementById('cidade_nasc').value = data.cidade_nasc;
                    // Normaliza data_nasc para YYYY-MM-DD
                    (function() {
                        const raw = data.data_nasc || '';
                        let ymd = '';
                        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
                            ymd = raw.slice(0,10);
                        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
                            const d = raw.slice(0,2), m = raw.slice(3,5), y = raw.slice(6,10);
                            ymd = `${y}-${m}-${d}`;
                        }
                        document.getElementById('data_nasc').value = ymd;
                    })();
                    document.getElementById('idade').value = data.idade;
                    document.getElementById('numero_filhos').value = data.filhos;
                    document.getElementById('fumante_sim').checked = data.fumante == 'Sim';
                    document.getElementById('fumante_nao').checked = data.fumante == 'Não';
                    document.getElementById('bebida_sim').checked = data.bebida == 'Sim';
                    document.getElementById('bebida_nao').checked = data.bebida == 'Não';
                    
                    document.getElementById('alergia').value = data.alergia;
                    document.getElementById('medicamento_sim').checked = data.medicamento_constante == 'Sim';
                    document.getElementById('medicamento_nao').checked = data.medicamento_constante == 'Não';
                    document.getElementById('cargo1').checked = true;  // Seleciona o checkbox 'cargo1'
                    document.getElementById('cargo2').checked = true;  // Seleciona o checkbox 'cargo2'
                    document.getElementById('cargo3').checked = true;  // Seleciona o checkbox 'cargo3'
                    document.getElementById('cargo4').checked = true;  // Seleciona o checkbox 'cargo4'
                    document.getElementById('cargo5').checked = true;  // Seleciona o checkbox 'cargo5'
                    document.getElementById('cargo6').checked = true;  // Seleciona o checkbox 'cargo6'
                    document.getElementById('cargo7').checked = true;  // Seleciona o checkbox 'cargo7'
                    document.getElementById('cargo8').checked = true;  // Seleciona o checkbox 'cargo8'
                    document.getElementById('cargo9').checked = true;  // Seleciona o checkbox 'cargo9'
                    document.getElementById('cargo10').checked = true;  // Seleciona o checkbox 'cargo10'
                    document.getElementById('cargo11').checked = true;  // Seleciona o checkbox 'cargo11'
                    document.getElementById('cargo12').checked = true;  // Seleciona o checkbox 'cargo12'


                    document.getElementById('qual_medicamento').value = data.qual_medicamento;
                    document.getElementById('genero').value = data.genero;
                    document.getElementById('peso').value = data.peso;
                    document.getElementById('cor_pele').value = data.cor_pele;
                    document.getElementById('tatuagem').value = data.tatuagem;
                    document.getElementById('perfil').value = data.perfil;
                    document.getElementById('cargo_indicado1').checked = data.cargo_indicado.includes('Auxiliar de Serviços Gerais');
                    document.getElementById('cargo_indicado2').checked = data.cargo_indicado.includes('Porteiro');
                    document.getElementById('cargo_indicado3').checked = data.cargo_indicado.includes('Zelador');
                    document.getElementById('identidade').value = data.identidade;
                    document.getElementById('cursos').value = data.cursos_realizados;
                    // Garante que 'data.regioes_preferencia' seja um array, evitando erro caso seja null ou undefined
                    const regioes = data.regioes_preferencia ? data.regioes_preferencia.split(', ') : [];

                    document.getElementById('regiao_barreiro').checked = regioes.includes('REGIÃO BARREIRO');
                    document.getElementById('regiao_centro_sul').checked = regioes.includes('REGIÃO CENTRO SUL');
                    document.getElementById('regiao_leste').checked = regioes.includes('REGIÃO LESTE');
                    document.getElementById('regiao_nordeste').checked = regioes.includes('REGIÃO NORDESTE');
                    document.getElementById('regiao_noroeste').checked = regioes.includes('REGIÃO NOROESTE');
                    document.getElementById('regiao_norte').checked = regioes.includes('REGIÃO NORTE');
                    document.getElementById('regiao_oeste').checked = regioes.includes('REGIÃO OESTE');
                    document.getElementById('regiao_pampulha').checked = regioes.includes('REGIÃO PAMPULHA');
                    document.getElementById('regiao_venda_nova').checked = regioes.includes('REGIÃO VENDA NOVA');
                    document.getElementById('regiao_betim_contagem').checked = regioes.includes('REGIÃO BETIM/CONTAGEM');
                    document.getElementById('regiao_nova_lima').checked = regioes.includes('REGIÃO NOVA LIMA');
                    document.getElementById('outros_municipios').checked = regioes.includes('OUTROS MUNICÍPIOS');
                    document.getElementById('todas').checked = regioes.includes('Todas');
                    document.getElementById('disponibilidade_horario').value = data.disponibilidade_horario;
                    // Verifica se há disponibilidade de horário no banco de dados e transforma em um array seguro
                    const disponibilidade = data.disponibilidade_horario 
                    ? data.disponibilidade_horario.toUpperCase().trim().split(', ') 
                    : [];
                                    
                    // Atualiza os checkboxes conforme os dados armazenados no banco de dados
                    document.getElementById('disponibilidade1').checked = disponibilidade.includes('44H (HORARIO COMERCIAL)');
                    document.getElementById('disponibilidade2').checked = disponibilidade.includes('12X36 DIA');
                    document.getElementById('disponibilidade3').checked = disponibilidade.includes('12X36 NOITE');
                    document.getElementById('disponibilidade4').checked = disponibilidade.includes('FEIRISTA');
                                    
                    // Se todas as opções estiverem marcadas, marca automaticamente "Selecionar Todos"
                    document.getElementById('selectAllHorarios').checked = disponibilidade.length === 4;

                    document.getElementById('empresa1').value = data.empresa1;
                    document.getElementById('cidade1').value = data.cidade1;
                    document.getElementById('estado1').value = data.estado1;
                    document.getElementById('funcao1').value = data.funcao1;
                    document.getElementById('data_admissao1').value = data.data_admissao1;
                    document.getElementById('data_saida1').value = data.data_saida1;
                    document.getElementById('motivo_saida1').value = data.motivo_saida1;
                    document.getElementById('salario1').value = data.salario1;
                    document.getElementById('empresa2').value = data.empresa2;
                    document.getElementById('cidade2').value = data.cidade2;
                    document.getElementById('estado2').value = data.estado2;
                    document.getElementById('funcao2').value = data.funcao2;
                    document.getElementById('data_admissao2').value = data.data_admissao2;
                    document.getElementById('data_saida2').value = data.data_saida2;
                    document.getElementById('motivo_saida2').value = data.motivo_saida2;
                    document.getElementById('salario2').value = data.salario2;
                    document.getElementById('empresa3').value = data.empresa3;
                    document.getElementById('cidade3').value = data.cidade3;
                    document.getElementById('estado3').value = data.estado3;
                    document.getElementById('funcao3').value = data.funcao3;
                    document.getElementById('data_admissao3').value = data.data_admissao3;
                    document.getElementById('data_saida3').value = data.data_saida3;
                    document.getElementById('motivo_saida3').value = data.motivo_saida3;
                    document.getElementById('salario3').value = data.salario3;
                    document.getElementById('empregos_informais').value = data.empregos_informais;
                    document.getElementById('observacoes').value = data.observacoes;
                    document.getElementById('admitido').value = data.admitido;
                    document.getElementById('tempo_permanencia1_anos').value = data.tempo_permanencia1_anos;
                    document.getElementById('tempo_permanencia1_meses').value = data.tempo_permanencia1_meses;
                    document.getElementById('tempo_permanencia1_dias').value = data.tempo_permanencia1_dias;
                    document.getElementById('tempo_permanencia2_anos').value = data.tempo_permanencia2_anos;
                    document.getElementById('tempo_permanencia2_meses').value = data.tempo_permanencia2_meses;
                    document.getElementById('tempo_permanencia2_dias').value = data.tempo_permanencia2_dias;
                    document.getElementById('tempo_permanencia3_anos').value = data.tempo_permanencia3_anos;
                    document.getElementById('tempo_permanencia3_meses').value = data.tempo_permanencia3_meses;
                    document.getElementById('tempo_permanencia3_dias').value = data.tempo_permanencia3_dias;
                    document.getElementById('atividades_empresa1').value = data.atividades_empresa1;
                    document.getElementById('atividades_empresa2').value = data.atividades_empresa2;
                    document.getElementById('atividades_empresa3').value = data.atividades_empresa3;
                    document.getElementById('bom').checked = data.conhecimento_digitacao === 'Bom';
                    document.getElementById('regular').checked = data.conhecimento_digitacao === 'Regular';
                    document.getElementById('ruim').checked = data.conhecimento_digitacao === 'Ruim';
                    document.getElementById('pcd').value = data.pcd;
                    document.getElementById('escolaridade').value = data.escolaridade;
                    document.getElementById('admitido').value = data.admitido;

                }
            });
    }
});



