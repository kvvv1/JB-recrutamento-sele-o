
    document.addEventListener('DOMContentLoaded', function () {
        const selectAllCheckbox = document.getElementById('selectAll');
        const openPdfModalButton = document.getElementById('openPdfModalButton');
        const checkboxes = document.querySelectorAll('.select-checkbox');
        const itemsPerPageSelect = document.getElementById('itemsPerPage');

        function toggleGeneratePdfButton() {
            const selectedCheckboxes = document.querySelectorAll('.select-checkbox:checked');
            openPdfModalButton.style.display = selectedCheckboxes.length > 0 ? 'block' : 'none';
        }

        selectAllCheckbox?.addEventListener('change', function () {
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            toggleGeneratePdfButton();
        });

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', toggleGeneratePdfButton);
        });

        toggleGeneratePdfButton(); // Verifica o estado ao carregar a tabela

        document.getElementById('itemsPerPage').addEventListener('change', function () {
            const params = new URLSearchParams(window.location.search);
            params.set('items_per_page', this.value);
            params.set('page', 1); // Redefine para a primeira página ao alterar itens por página
            window.location.search = params.toString();
        });

    });
