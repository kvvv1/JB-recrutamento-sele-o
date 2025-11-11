document.addEventListener('DOMContentLoaded', function () {
    const selectAllCheckbox = document.getElementById('selectAll');
    const openPdfModalButton = document.getElementById('openPdfModalButton');
    const generatePdfButton = document.getElementById('generatePdfButton');
    const checkboxes = document.querySelectorAll('.select-checkbox');

    // Verifica e alterna a exibição do botão
    function toggleGeneratePdfButton() {
        const selectedCheckboxes = document.querySelectorAll('.select-checkbox:checked');
        openPdfModalButton.style.display = selectedCheckboxes.length > 0 ? 'block' : 'none';
    }

    // Listener para o checkbox "Selecionar todos"
    selectAllCheckbox?.addEventListener('change', function () {
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
        toggleGeneratePdfButton();
    });

    // Listener para cada checkbox individual
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', toggleGeneratePdfButton);
    });

    // Listener para o botão de geração de PDF
    generatePdfButton?.addEventListener('click', function () {
        const selectedCheckboxes = document.querySelectorAll('.select-checkbox:checked');
        const selectedCpfs = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);

        console.log("CPFs selecionados para gerar PDF:", selectedCpfs);

        // Fazendo a solicitação para obter os dados do backend
        fetch('/get_registration_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ selected_cpfs: selectedCpfs })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Dados recebidos do backend:", data);

            if (data.error) {
                alert('Erro ao gerar PDF: ' + data.error);
                return;
            }

            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert('Biblioteca jsPDF não carregada corretamente. Verifique as dependências.');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const headerColor = '#AB1A18';
            const textColor = '#FFFFFF';
            const borderColor = '#8E1615';

            doc.setFillColor(headerColor);
            doc.setTextColor(textColor);
            doc.rect(10, 10, 190, 10, 'F');
            doc.text('Nome Completo', 15, 16);
            doc.text('CPF', 70, 16);
            doc.text('Data de Nascimento', 120, 16);

            let yPosition = 30;
            doc.setTextColor(0, 0, 0);

            if (data.length === 0) {
                doc.text('Nenhum candidato encontrado com os CPFs informados.', 15, yPosition);
            } else {
                data.forEach((item) => {
                    console.log("Processando item:", item);

                    const splitNome = doc.splitTextToSize(item.nome_completo || "Nome não disponível", 50);
                    const lineHeight = 10 * splitNome.length;

                    // Usa a data já formatada recebida do backend
                    const formattedDate = item.data_nasc || "Não informada";
                    const formattedCpf = item.cpf || "Não informado";
                    
                    console.log(`Data final para o PDF: ${formattedDate}`);

                    doc.setDrawColor(borderColor);
                    doc.rect(10, yPosition - 5, 190, lineHeight);
                    doc.line(60, yPosition - 5, 60, yPosition + lineHeight - 5);
                    doc.line(110, yPosition - 5, 110, yPosition + lineHeight - 5);

                    doc.text(splitNome, 15, yPosition);
                    doc.text(formattedCpf, 70, yPosition);
                    doc.text(formattedDate, 120, yPosition);

                    yPosition += lineHeight + 5;

                    if (yPosition > 280) {
                        doc.addPage();
                        yPosition = 30;
                        doc.setFillColor(headerColor);
                        doc.setTextColor(textColor);
                        doc.rect(10, 10, 190, 10, 'F');
                        doc.text('Nome Completo', 15, 16);
                        doc.text('CPF', 70, 16);
                        doc.text('Data de Nascimento', 120, 16);
                        doc.setTextColor(0, 0, 0);
                    }
                });
            }

            const pdfUrl = doc.output('bloburl');
            console.log("PDF gerado com sucesso, URL:", pdfUrl);
            window.open(pdfUrl, '_blank');

            const pdfModal = document.getElementById('pdfModal');
            const modalInstance = bootstrap.Modal.getInstance(pdfModal);
            modalInstance.hide();
        })
        .catch(error => {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar o PDF. Verifique o console para mais detalhes.');
        });
    });

    // Garante que o botão seja verificado ao carregar a página
    toggleGeneratePdfButton();
});
