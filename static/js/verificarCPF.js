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
                    document.getElementById('telefone').value = data.telefone;
                    document.getElementById('estado_nasc').value = data.estado_nasc;
                    preencherCidades(data.estado_nasc);
                    document.getElementById('cidade_nasc').value = data.cidade_nasc;
                    document.getElementById('data_nasc').value = data.data_nasc;
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
                    document.getElementById('cargo2').checked = true;  // Seleciona o checkbox 'cargo1'
                    document.getElementById('cargo3').checked = true;  // Seleciona o checkbox 'cargo1'
                    document.getElementById('cargo4').checked = true;  // Seleciona o checkbox 'cargo1'
                    document.getElementById('cargo5').checked = true;  // Seleciona o checkbox 'cargo1'
                    document.getElementById('cargo6').checked = true;  // Seleciona o checkbox 'cargo1'
                    document.getElementById('cargo7').checked = true;  // Seleciona o checkbox 'cargo1'
                    document.getElementById('cargo8').checked = true;  // Seleciona o checkbox 'cargo1'

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
                    document.getElementById('regiao_barreiro').checked = data.regioes_preferencia.includes('Região Barreiro');
                    document.getElementById('regiao_centro_sul').checked = data.regioes_preferencia.includes('Região Centro Sul');
                    document.getElementById('regiao_leste').checked = data.regioes_preferencia.includes('Região Leste');
                    document.getElementById('regiao_nordeste').checked = data.regioes_preferencia.includes('Região Nordeste');
                    document.getElementById('regiao_noroeste').checked = data.regioes_preferencia.includes('Região Noroeste');
                    document.getElementById('regiao_norte').checked = data.regioes_preferencia.includes('Região Norte');
                    document.getElementById('regiao_oeste').checked = data.regioes_preferencia.includes('Região Oeste');
                    document.getElementById('regiao_pampulha').checked = data.regioes_preferencia.includes('Região Pampulha');
                    document.getElementById('regiao_venda_nova').checked = data.regioes_preferencia.includes('Região Venda Nova');
                    document.getElementById('regiao_metropolitana').checked = data.regioes_preferencia.includes('Região Metropolitana');
                    document.getElementById('todas').checked = data.regioes_preferencia.includes('Todas');
                    document.getElementById('disponibilidade_horario').value = data.disponibilidade_horario;
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
                    // Supondo que você esteja buscando os dados para preencher o formulário:
                    document.getElementById('bom').checked = data.conhecimento_digitacao === 'Bom';
                    document.getElementById('regular').checked = data.conhecimento_digitacao === 'Regular';
                    document.getElementById('ruim').checked = data.conhecimento_digitacao === 'Ruim';
                    document.getElementById('pcd').value = data.pcd;
                    document.getElementById('vacina').value = data.vacina;
                    document.getElementById('certificado').value = data.certificado;
                    document.getElementById('escolaridade').value = data.escolaridade;
                    document.getElementById('idade_filho_1').value = data.idade_filho_1;
                    document.getElementById('idade_filho_2').value = data.idade_filho_2;
                    document.getElementById('idade_filho_3').value = data.idade_filho_3;
                    document.getElementById('idade_filho_4').value = data.idade_filho_4;
                    document.getElementById('idade_filho_5').value = data.idade_filho_5;
                    document.getElementById('idade_filho_6').value = data.idade_filho_6;
                    document.getElementById('idade_filho_7').value = data.idade_filho_7;
                    document.getElementById('idade_filho_8').value = data.idade_filho_8;
                    document.getElementById('idade_filho_9').value = data.idade_filho_9;
                    document.getElementById('idade_filho_10').value = data.idade_filho_10;

                    




                    // Carregar os valores das rotas de trabalho a partir de 'data'
                    document.getElementById('rota1').checked = data.rota_trabalho.includes('Rota 1');
                    document.getElementById('rota2').checked = data.rota_trabalho.includes('Rota 2');
                    document.getElementById('rota3').checked = data.rota_trabalho.includes('Rota 3');
                    document.getElementById('rota4').checked = data.rota_trabalho.includes('Rota 4');
                    document.getElementById('rota5').checked = data.rota_trabalho.includes('Rota 5');
                    document.getElementById('rota6').checked = data.rota_trabalho.includes('Rota 6');
                    document.getElementById('rota7').checked = data.rota_trabalho.includes('Rota 7');
                    document.getElementById('banco_candidatos').checked = data.rota_trabalho.includes('Banco de Candidatos');

                }
            });
    }
});



