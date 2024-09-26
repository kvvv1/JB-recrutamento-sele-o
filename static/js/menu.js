document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    const toggleBtn = document.getElementById('toggle-btn');

    // Carrega o estado salvo no localStorage
    let isCollapsed = localStorage.getItem('sidebarState') === 'collapsed';

    // Aplica o estado correto no carregamento
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        content.classList.add('collapsed');
    }

    // Função para alternar o estado do menu
    toggleBtn.addEventListener('click', function () {
        isCollapsed = !isCollapsed;
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            content.classList.add('collapsed');
            localStorage.setItem('sidebarState', 'collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            content.classList.remove('collapsed');
            localStorage.setItem('sidebarState', 'expanded');
        }
    });
});
