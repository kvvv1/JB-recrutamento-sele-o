document.getElementById('selectAll').addEventListener('click', function() {
    const checkboxes = document.querySelectorAll('.select-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
    toggleGeneratePdfButton();
});

document.querySelectorAll('.select-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', toggleGeneratePdfButton);
});

function toggleGeneratePdfButton() {
    const selectedCheckboxes = document.querySelectorAll('.select-checkbox:checked');
    const openPdfModalButton = document.getElementById('openPdfModalButton');
    
    if (selectedCheckboxes.length > 0) {
        openPdfModalButton.style.display = 'block'; // Exibe o botão
    } else {
        openPdfModalButton.style.display = 'none'; // Oculta o botão
    }
}

document.getElementById('generatePdfButton').addEventListener('click', function() {
    const selectedCheckboxes = document.querySelectorAll('.select-checkbox:checked');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Estilo do PDF
    const headerColor = '#AB1A18';
    const textColor = '#FFFFFF';
    const borderColor = '#8E1615';

    // Cabeçalho da tabela
    doc.setFillColor(headerColor);
    doc.setTextColor(textColor);
    doc.rect(10, 10, 190, 10, 'F'); // Fundo do cabeçalho
    doc.text('Nome Completo', 15, 16);
    doc.text('CPF', 70, 16);
    doc.text('Data de Nascimento', 120, 16);

    let yPosition = 30;
    doc.setTextColor(0, 0, 0); // Cor do texto do conteúdo

    selectedCheckboxes.forEach((checkbox) => {
        const row = checkbox.closest('tr');
        const nome = row.cells[1].textContent; // Nome
        const cpf = row.cells[2].textContent; // CPF
        const dataNasc = row.cells[3].textContent; // Data de nascimento (ajuste o índice se necessário)

        // Quebra automática para nomes longos com limite de largura de 50 unidades
        const splitNome = doc.splitTextToSize(nome, 50);

        // Calcular altura necessária para a linha de acordo com o nome quebrado
        const lineHeight = 10 * splitNome.length;

        // Desenha as células com altura adaptável
        doc.setDrawColor(borderColor); // Cor da borda
        doc.rect(10, yPosition - 5, 190, lineHeight);  // Ajusta a altura da linha conforme o nome
        doc.line(60, yPosition - 5, 60, yPosition + lineHeight - 5);  // Linha divisória entre Nome Completo e CPF
        doc.line(110, yPosition - 5, 110, yPosition + lineHeight - 5);  // Linha divisória entre CPF e Data de Nascimento

        // Escreve o conteúdo com a quebra de linha automática no nome
        doc.text(splitNome, 15, yPosition);  // Nome com quebra de linha automática
        doc.text(cpf, 70, yPosition);        // CPF (mantém-se na mesma linha)
        doc.text(dataNasc, 120, yPosition);  // Data de Nascimento (mantém-se na mesma linha)

        // Atualiza a posição Y com base na altura da linha
        yPosition += lineHeight + 5;

        // Verifica se precisa adicionar uma nova página
        if (yPosition > 280) {
            doc.addPage();
            yPosition = 30;

            // Redesenha o cabeçalho na nova página
            doc.setFillColor(headerColor);
            doc.setTextColor(textColor);
            doc.rect(10, 10, 190, 10, 'F');
            doc.text('Nome Completo', 15, 16);
            doc.text('CPF', 70, 16);
            doc.text('Data de Nascimento', 120, 16);
            doc.setTextColor(0, 0, 0); // Cor do texto do conteúdo
        }
    });

    // Abre o PDF em uma nova guia
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');

    // Fecha o modal após gerar o PDF
    const pdfModal = document.getElementById('pdfModal');
    const modalInstance = bootstrap.Modal.getInstance(pdfModal);
    modalInstance.hide();
});
