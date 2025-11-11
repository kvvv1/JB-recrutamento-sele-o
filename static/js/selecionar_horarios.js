document.getElementById('selectAllHorarios').addEventListener('change', function () {
    var checkboxes = document.querySelectorAll('.checkbox-horarios');
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].id !== 'selectAllHorarios') {  // Exclui o próprio checkbox de "Selecionar Todos"
            checkboxes[i].checked = this.checked;
        }
    }
});
