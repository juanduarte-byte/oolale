document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Lógica para el toggle del sidebar
    const menuToggle = document.getElementById('menu-toggle');
    const wrapper = document.getElementById('wrapper');
    if (menuToggle && wrapper) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            wrapper.classList.toggle('toggled');
        });
    }

    // Lógica para cerrar sesión
    const logoutButtons = document.querySelectorAll('#logoutButton, #logoutButtonDropdown');
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    });

    // Lógica para opciones del menú desplegable de usuario
    const dropdownItems = document.querySelectorAll('.dropdown-menu .dropdown-item');
    dropdownItems.forEach((item) => {
        const text = item.textContent.trim();
        if (text === 'Perfil') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                currentModuleTitle.textContent = 'Mi Perfil';
                loadModule('perfil');
                const dropdown = bootstrap.Dropdown.getInstance(document.getElementById('navbarDropdown'));
                if (dropdown) dropdown.hide();
            });
        } else if (text === 'Configuración') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                currentModuleTitle.textContent = 'Configuración';
                loadModule('configuracion');
                const dropdown = bootstrap.Dropdown.getInstance(document.getElementById('navbarDropdown'));
                if (dropdown) dropdown.hide();
            });
        }
    });

    // Lógica para cargar contenido de módulos
    const navLinks = document.querySelectorAll('.sidebar .nav-link[data-module]');
    const moduleContent = document.getElementById('moduleContent');
    const currentModuleTitle = document.getElementById('currentModuleTitle');
    const dashboardMainContent = document.getElementById('dashboard-main-content');

    // Función para limpiar y cargar un nuevo script
    const loadScript = (moduleName) => {
        const oldScript = document.getElementById('module-script');
        if (oldScript) {
            oldScript.remove();
        }

        const script = document.createElement('script');
        script.id = 'module-script';
        script.src = `js/${moduleName}.js`;
        document.body.appendChild(script);
    };

    const loadModule = async (moduleName) => {
        try {
            const response = await fetch(`modules/${moduleName}.html`);
            if (!response.ok) {
                throw new Error(`No se pudo cargar el módulo ${moduleName}`);
            }
            const html = await response.text();
            moduleContent.innerHTML = html;
            if (dashboardMainContent) dashboardMainContent.classList.add('d-none');

            loadScript(moduleName);

        } catch (error) {
            console.error('Error loading module:', error);
            moduleContent.innerHTML = `<div class="alert alert-danger">Error al cargar el contenido del módulo: ${moduleName}.html. Verifique que el archivo exista.</div>`;
        }
    };

    // Función para mostrar el contenido principal del dashboard
    const showDashboardMain = () => {
        if (dashboardMainContent) dashboardMainContent.classList.remove('d-none');
        moduleContent.innerHTML = '';
        currentModuleTitle.textContent = 'Dashboard';
        navLinks.forEach(nav => nav.classList.remove('active'));

        const dashboardLink = document.querySelector('.nav-link[data-module="dashboard"]');
        if (dashboardLink) {
            dashboardLink.classList.add('active');
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');

            const moduleName = link.dataset.module;
            if (moduleName === 'dashboard') {
                showDashboardMain();
            } else if (moduleName) {
                currentModuleTitle.textContent = link.textContent.trim();
                loadModule(moduleName);
            }
        });
    });

    // Al cargar la página
    const moduleFromHash = window.location.hash.substring(1);
    if (moduleFromHash && document.querySelector(`[data-module="${moduleFromHash}"]`)) {
        document.querySelector(`[data-module="${moduleFromHash}"]`).click();
    } else {
        const dashboardLink = document.querySelector('[data-module="dashboard"]');
        if (dashboardLink) {
            dashboardLink.classList.add('active');
        }
        showDashboardMain();
    }

    // Función para actualizar las tarjetas de estadísticas
    const updateDashboardCards = async () => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const endpoints = {
                '/api/usuarios': 'usersCount',
                '/api/eventos': 'eventsCount',
                '/api/mensajes': 'messagesCount',
                '/api/reportes': 'reportsCount',
            };

            for (const [endpoint, elementId] of Object.entries(endpoints)) {
                // Verificar permisos antes de llamar
                // (O simplemente intentar y manejar el error de forma silenciosa si es 403)
                try {
                    const response = await fetch(endpoint, { headers });
                    if (!response.ok) {
                        // Si falla, mostrar 0 o un indicador silencioso, o 'Error'
                        // console.error(`Error al obtener datos de ${endpoint}: ${response.statusText}`);
                        const countElement = document.getElementById(elementId);
                        if (countElement) countElement.textContent = '-';
                        continue;
                    }
                    const data = await response.json();
                    const countElement = document.getElementById(elementId);
                    if (countElement) {
                        const count = Array.isArray(data) ? data.length : (data.total || data.count || (data.data && Array.isArray(data.data) ? data.data.length : 0));
                        countElement.textContent = count;
                    }
                } catch (err) {
                    // Ignorar errores puntuales de red en tarjetas
                }
            }
            updateChart();
        } catch (error) {
            console.error('Error al actualizar las tarjetas del dashboard:', error);
        }
    };

    // --- Lógica del Gráfico ---
    let statsChart = null;
    const updateChart = () => {
        const ctx = document.getElementById('statsChart');
        if (!ctx) return;

        const usersCount = parseInt(document.getElementById('usersCount').textContent) || 0;
        const eventsCount = parseInt(document.getElementById('eventsCount').textContent) || 0;
        const messagesCount = parseInt(document.getElementById('messagesCount').textContent) || 0;
        const reportsCount = parseInt(document.getElementById('reportsCount').textContent) || 0;

        const data = {
            labels: ['Usuarios', 'Eventos', 'Mensajes', 'Reportes'],
            datasets: [{
                label: 'Total',
                data: [usersCount, eventsCount, messagesCount, reportsCount],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        };

        if (statsChart) {
            statsChart.data = data;
            statsChart.update();
        } else {
            statsChart = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: {
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { display: false } }
                }
            });
        }
    };

    // --- Lógica del Bloc de Notas ---
    const notesContainer = document.getElementById('notes-container');
    const noteForm = document.getElementById('noteForm');
    const noteInput = document.getElementById('noteInput');

    const fetchNotes = async () => {
        if (!notesContainer) return;
        try {
            const response = await fetch('/api/notes', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) return;
            const notes = await response.json();
            notesContainer.innerHTML = notes.map(note => `
                <p class="mb-1">
                    <strong class="text-primary">${note.author ? note.author.split('@')[0] : 'Anónimo'}</strong>: ${note.text}
                    <br>
                    <small class="text-muted">${new Date(note.timestamp).toLocaleString()}</small>
                </p>
            `).join('');
            notesContainer.scrollTop = notesContainer.scrollHeight;
        } catch (error) {
            // console.error(error);
        }
    };

    if (noteForm) {
        noteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = noteInput.value.trim();
            if (text) {
                try {
                    const response = await fetch('/api/notes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ text })
                    });
                    if (!response.ok) throw new Error('Error al guardar nota');
                    noteInput.value = '';
                    fetchNotes();
                } catch (error) {
                    mostrarNotificacionAdmin('Error', 'No se pudo guardar la nota', 'danger');
                }
            }
        });
    }

    updateDashboardCards();
    fetchNotes();
    setInterval(fetchNotes, 15000);

    // --- SISTEMA DE NOTIFICACIONES ADMIN ---
    window.mostrarNotificacionAdmin = function (titulo, mensaje, tipo = 'info') {
        const toastContainer = document.getElementById('toastContainerAdmin') || createToastContainer();
        const toastId = 'toast-' + Date.now();
        const icon = typeToIcon(tipo);

        const html = `
            <div id="${toastId}" class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header text-${tipo}">
                    <i class="bi bi-${icon} me-2"></i>
                    <strong class="me-auto">${titulo}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${mensaje}
                </div>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = html;
        toastContainer.appendChild(div.firstElementChild);

        // Auto remove
        setTimeout(() => {
            const el = document.getElementById(toastId);
            if (el) {
                el.classList.remove('show');
                setTimeout(() => el.remove(), 500);
            }
        }, 5000);
    };

    function createToastContainer() {
        const div = document.createElement('div');
        div.id = 'toastContainerAdmin';
        div.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        div.style.zIndex = '1100';
        document.body.appendChild(div);
        return div;
    }

    function typeToIcon(type) {
        switch (type) {
            case 'success': return 'check-circle-fill';
            case 'danger': return 'exclamation-triangle-fill';
            case 'warning': return 'exclamation-circle-fill';
            default: return 'info-circle-fill';
        }
    }
});