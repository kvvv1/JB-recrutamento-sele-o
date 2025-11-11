document.getElementById('select-indicated-cargo').addEventListener('click', function () {
    var checkboxes = document.getElementById('cargo-indicado-checkboxes');

    // Alterna a visibilidade
    if (checkboxes.style.display === 'none' || checkboxes.style.display === '') {
        checkboxes.style.display = 'grid'; // Mostra os checkboxes
    } else {
        checkboxes.style.display = 'none'; // Esconde os checkboxes
    }
});

function updateSelectedCargos() {
    let selectedCargos = [];
    document.querySelectorAll('.cargo-checkbox:checked').forEach(function (checkbox) {
        selectedCargos.push(checkbox.value);
    });
    displaySelectedCargos(selectedCargos);
}

function displaySelectedCargos(cargos) {
    const selectedCargosDiv = document.getElementById('selectedCargos');
    selectedCargosDiv.innerHTML = '';

    cargos.forEach(cargo => {
        const span = document.createElement('span');
        span.classList.add('badge', 'badge-primary', 'mr-2');
        span.innerHTML = `${cargo} <span class="remove-item" data-value="${cargo}">x</span>`;
        selectedCargosDiv.appendChild(span);
    });

    document.querySelectorAll('.remove-item').forEach(function (span) {
        span.addEventListener('click', function () {
            const value = this.getAttribute('data-value');
            document.querySelector(`input[value="${value}"]`).checked = false;
            updateSelectedCargos();
        });
    });
}

document.querySelectorAll('.cargo-checkbox').forEach(function (checkbox) {
    checkbox.addEventListener('change', updateSelectedCargos);
});
