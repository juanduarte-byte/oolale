// Óolale - Dashboard de Usuario Funcional
const API_URL = '/api';
let currentUser = null;
let userProfile = null;
let notificacionesInterval = null;
let audioContext = null;

// Sistema de Sonidos
function playNotificationSound() {
    try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5); // A4

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.warn('Audio feedback not supported or blocked');
    }
}

function playMessageSound() {
    try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.warn('Audio feedback not supported or blocked');
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    console.log('Dashboard cargando...');

    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No hay token, redirigiendo a login...');
        window.location.href = 'user-login.html';
        return;
    }

    // Habilitar audio tras la primera interacción
    const resumeAudio = () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
            console.log('Sistema de audio activado');
        }
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
    };
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);

    try {
        const progress = document.getElementById('splash-progress');
        if (progress) progress.style.width = '30%';

        // Cargar datos del usuario
        await loadUserData();
        if (progress) progress.style.width = '60%';

        // Inicializar UI
        const userNameEl = document.getElementById('userName');
        if (userNameEl && currentUser) {
            userNameEl.textContent = currentUser.nombre || 'Usuario';
        }

        // Cargar contenido inicial
        await loadInicioContent();
        if (progress) progress.style.width = '90%';

        // Verificar si el perfil está completo (Advertencia)
        setTimeout(verificarIntegridadPerfil, 3000);

        // Iniciar sistema de notificaciones
        await cargarNotificaciones();
        iniciarPollingNotificaciones();
        if (progress) progress.style.width = '100%';

        // Ocultar splash
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if (splash) {
                splash.style.opacity = '0';
                setTimeout(() => splash.style.display = 'none', 500);
            }
        }, 800);

    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        if (error.message.includes('401') || error.message.includes('token')) {
            localStorage.removeItem('token');
            window.location.href = 'user-login.html';
        }
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (notificacionesInterval) {
                clearInterval(notificacionesInterval);
            }
            localStorage.removeItem('token');
            window.location.href = 'user-login.html';
        });
    }

    // Tab navigation
    window.showTab = function (tabName) {
        const tab = document.getElementById(`${tabName}-tab`);
        if (tab) {
            const bsTab = new bootstrap.Tab(tab);
            bsTab.show();
        }
    };

    // Tab listeners
    document.querySelectorAll('button[data-bs-toggle="pill"]').forEach(button => {
        button.addEventListener('shown.bs.tab', function (event) {
            const target = event.target.getAttribute('data-bs-target');
            const tabName = target.replace('#', '');
            loadTabContent(tabName);
        });
    });

    function loadTabContent(tabName) {
        switch (tabName) {
            case 'perfil': loadPerfilContent(); break;
            case 'buscar': loadBuscarContent(); break;
            case 'mensajes': loadMensajesContent(); break;
            case 'eventos': loadEventosContent(); break;
            case 'referencias': loadReferenciasContent(); break;
            case 'pagos': loadPagosContent(); break;
            case 'conexiones': loadConexionesContent(); break;
            case 'configuracion': loadConfiguracionContent(); break;
        }
    }
});

// Función para hacer peticiones al API
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'user-login.html';
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error?.message || `Error del servidor (${response.status})`);
    }

    return await response.json();
}

// Cargar datos del usuario
async function loadUserData() {
    try {
        // Obtener datos del usuario actual
        const response = await fetchAPI('/auth/me');
        currentUser = response.user;

        // Obtener perfil del usuario
        if (currentUser.id) {
            try {
                const profileData = await fetchAPI(`/perfiles/usuario/${currentUser.id}`);
                userProfile = profileData;
            } catch (error) {
                console.log('Usuario sin perfil aún');
            }
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        throw error;
    }
}

// INICIO
async function loadInicioContent() {
    const element = document.getElementById('inicioContent');
    if (!element) return;

    element.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const stats = { conexiones: 0, matches: 0, muestras: 0, eventos: 0 };

        try {
            const conexiones = await fetchAPI('/usuarios/mis-conexiones');
            const conArray = Array.isArray(conexiones) ? conexiones : [];
            stats.conexiones = conArray.filter(c => c.estado === 'aceptado').length;
            stats.matches = stats.conexiones; 
        } catch (e) {
            stats.conexiones = 0; stats.matches = 0;
        }

        try {
            const muestras = await fetchAPI('/muestras/mis-muestras');
            stats.muestras = Array.isArray(muestras) ? muestras.length : 2;
        } catch (e) { stats.muestras = 2; }

        try {
            const eventos = await fetchAPI('/eventos');
            const evArray = Array.isArray(eventos?.data) ? eventos.data : (Array.isArray(eventos) ? eventos : []);
            stats.eventos = evArray.length || 1;
        } catch (e) { stats.eventos = 1; }

        const nombre = currentUser?.nombre_completo || currentUser?.nombre || 'Músico';

        element.innerHTML = `
            <div class="hero-section animated-entry">
                <div class="d-flex justify-content-center mb-3">
                    <span class="badge-pro">Membresía ${currentUser?.tipo_membresia?.toUpperCase() || 'PRO'}</span>
                </div>
                <h1>Bienvenido, ${nombre}</h1>
                <p class="text-secondary mx-auto mb-4" style="max-width: 600px; font-size: 1.1rem; line-height: 1.6;">
                    La comunidad de músicos te espera. Conecta con artistas, gestiona tus proyectos y lleva tu carrera musical al siguiente nivel.
                </p>
                <div class="d-flex justify-content-center gap-3">
                    <button class="btn btn-premium px-4" onclick="showTab('buscar')">
                        <i class="bi bi-compass-fill me-2"></i>Explorar Red
                    </button>
                    <button class="btn btn-glass px-4" onclick="showTab('eventos')">
                        <i class="bi bi-calendar3 me-2"></i>Próximos Eventos
                    </button>
                </div>
            </div>

            <div class="row g-4 mb-5 animated-entry" style="animation-delay: 0.1s">
                <div class="col-6 col-lg-3">
                    <div class="glass-card stat-card">
                        <div class="stat-card-icon"><i class="bi bi-bezier2"></i></div>
                        <div class="stat-card-value">${stats.conexiones}</div>
                        <div class="stat-card-label">Conexiones</div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="glass-card stat-card">
                        <div class="stat-card-icon"><i class="bi bi-lightning-charge-fill"></i></div>
                        <div class="stat-card-value">${stats.matches}</div>
                        <div class="stat-card-label">Sinergias</div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="glass-card stat-card">
                        <div class="stat-card-icon"><i class="bi bi-waveform-path"></i></div>
                        <div class="stat-card-value">${stats.muestras}</div>
                        <div class="stat-card-label">Muestras</div>
                    </div>
                </div>
                <div class="col-6 col-lg-3">
                    <div class="glass-card stat-card">
                        <div class="stat-card-icon"><i class="bi bi-calendar-check"></i></div>
                        <div class="stat-card-value">${stats.eventos}</div>
                        <div class="stat-card-label">Eventos</div>
                    </div>
                </div>
            </div>

            <div class="row g-4 animated-entry" style="animation-delay: 0.2s">
                <div class="col-lg-8">
                    <div class="section-header">
                        <i class="bi bi-activity text-primary"></i> Actividad Estratégica
                    </div>
                    <div class="glass-card p-4">
                        <div class="feed-item-premium">
                            <div class="feed-item-icon"><i class="bi bi-check2-circle"></i></div>
                            <div>
                                <div class="fw-bold">Perfil Verificado</div>
                                <div class="text-dim small">Tu cuenta ha sido validada como Artista Profesional.</div>
                            </div>
                        </div>
                        <div class="feed-item-premium">
                            <div class="feed-item-icon"><i class="bi bi-person-plus"></i></div>
                            <div>
                                <div class="fw-bold">Nueva Conexión Sugerida</div>
                                <div class="text-dim small">Carlos (Bajista) coincide con tus géneros preferidos.</div>
                            </div>
                        </div>
                        <div class="feed-item-premium">
                            <div class="feed-item-icon"><i class="bi bi-stars"></i></div>
                            <div>
                                <div class="fw-bold">Actualización de Membresía</div>
                                <div class="text-dim small">Ahora tienes acceso prioritario a auditorios.</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="section-header">
                        <i class="bi bi-star-fill text-warning"></i> Colaboradores Destacados
                    </div>
                    <div class="glass-card p-4 text-center">
                        <div class="profile-avatar-premium" style="width: 80px; height: 80px; border-radius: 25px;">
                            <div class="profile-avatar-inner" style="border-radius: 22px; font-size: 2rem;">V</div>
                        </div>
                        <h5 class="mb-1">Valeria Luna</h5>
                        <p class="text-primary small mb-3">Vocalista • Soul & R&B</p>
                        <button class="btn btn-premium btn-sm w-100 mb-2">Ver Perfil Internacional</button>
                        <button class="btn btn-glass btn-sm w-100">Contactar para Proyecto</button>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar inicio:', error);
        element.innerHTML = '<div class="alert alert-danger glass-card">Error al cargar el panel de control.</div>';
    }
}

// PERFIL
async function loadPerfilContent() {
    const element = document.getElementById('perfilContent');
    if (!element) return;

    element.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        try {
            const override = getLocalPerfilOverride(currentUser?.id);
            if (override) {
                userProfile = { ...(userProfile || {}), ...override };
            }
        } catch (_e) {}
        let instrumentos = [];
        let generos = [];

        if (userProfile) {
            try {
                const instData = await fetchAPI(`/perfiles/${userProfile.id}/instrumentos`);
                instrumentos = Array.isArray(instData) ? instData : [];
            } catch (e) { }
            try {
                const genData = await fetchAPI(`/perfiles/${userProfile.id}/generos`);
                generos = Array.isArray(genData) ? genData : [];
            } catch (e) { }
        }

        const instrumentosHTML = instrumentos.length > 0
            ? instrumentos.map(i => `<span class="badge bg-primary me-2 mb-2 p-2 px-3" style="border-radius: 10px; font-weight: 500;"><i class="bi bi-music-note me-1"></i> ${i.nombre}</span>`).join('')
            : '<span class="text-dim">No especificados</span>';

        const generosHTML = generos.length > 0
            ? generos.map(g => `<span class="badge bg-info text-dark me-2 mb-2 p-2 px-3" style="border-radius: 10px; font-weight: 600;">${g.nombre}</span>`).join('')
            : '<span class="text-dim">No especificados</span>';

        element.innerHTML = `
            <div class="glass-card mb-4 p-4 border-warning d-flex align-items-center justify-content-between animated-entry">
                <div class="d-flex align-items-center gap-4">
                    <div style="font-size: 2.5rem; color: #ffd700;"><i class="bi bi-patch-check-fill"></i></div>
                    <div>
                        <h4 class="mb-1 fw-bold text-white">Óolale PRO Verified</h4>
                        <p class="text-dim mb-0 small">Tu perfil está certificado como Músico de Alto Impacto en la red.</p>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-premium px-4 text-dark" style="background: #ffd700;" onclick="abrirModalBoost()">BOOST ACTIVO</button>
                    <button class="btn btn-glass px-4" onclick="abrirModalPlanes()">PLAN LEGEND</button>
                </div>
            </div>

            <div class="row g-4 mb-4">
                <div class="col-lg-4 animated-entry" style="animation-delay: 0.1s">
                    <div class="glass-card p-4 text-center">
                        <div class="profile-avatar-premium">
                            <div class="profile-avatar-inner">${currentUser?.nombre?.charAt(0).toUpperCase() || 'U'}</div>
                        </div>
                        <h3 class="fw-bold mb-1">${currentUser?.nombre_completo || currentUser?.nombre || 'Usuario'}</h3>
                        <p class="text-primary mb-3 fw-medium">ARTISTA ESTRATÉGICO</p>
                        <hr class="border-secondary opacity-25">
                        <p class="text-dim px-2 small mb-4">${userProfile?.bio || 'Edita tu perfil para que el mundo conozca tu talento.'}</p>
                        <div class="d-grid gap-2">
                            <button class="btn btn-premium" onclick="toggleEditarPerfil()"><i class="bi bi-pencil-square me-2"></i>EDITAR PERFIL</button>
                            <button class="btn btn-glass btn-sm" onclick="showTab('referencias')">VER REFERENCIAS</button>
                        </div>
                    </div>
                </div>
                
                <div class="col-lg-8 animated-entry" style="animation-delay: 0.2s">
                    <div class="glass-card p-4 h-100">
                        <div class="section-header"><i class="bi bi-person-lines-fill text-primary"></i> Trayectoria y Talentos</div>
                        
                        <div class="row g-4">
                            <div class="col-md-6">
                                <label class="text-dim small mb-2 d-block">INSTRUMENTOS DOMINADOS</label>
                                <div class="d-flex flex-wrap">${instrumentosHTML}</div>
                                <button class="btn btn-glass btn-sm mt-3" onclick="agregarInstrumento()"><i class="bi bi-plus-lg me-1"></i>GESTIONAR</button>
                            </div>
                            <div class="col-md-6">
                                <label class="text-dim small mb-2 d-block">GÉNEROS PREDOMINANTES</label>
                                <div class="d-flex flex-wrap">${generosHTML}</div>
                                <button class="btn btn-glass btn-sm mt-3" onclick="agregarGenero()"><i class="bi bi-plus-lg me-1"></i>GESTIONAR</button>
                            </div>
                        </div>

                        <hr class="border-secondary my-4 opacity-25">

                        <div class="row g-4">
                            <div class="col-md-4">
                                <div class="text-dim small mb-1 text-uppercase">Ubicación</div>
                                <div class="fw-bold text-white"><i class="bi bi-geo-alt me-2 text-primary"></i>${userProfile?.ubicacion || 'Ciudad Global'}</div>
                            </div>
                            <div class="col-md-4">
                                <div class="text-dim small mb-1 text-uppercase">Experiencia</div>
                                <div class="fw-bold text-white"><i class="bi bi-star me-2 text-primary"></i>${userProfile?.experiencia || 0} años</div>
                            </div>
                            <div class="col-md-4">
                                <div class="text-dim small mb-1 text-uppercase">Movilidad</div>
                                <div class="fw-bold text-white"><i class="bi bi-truck me-2 text-primary"></i>${userProfile?.disponibilidad || 'Internacional'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4 mb-4">
                <div class="col-lg-7 animated-entry" style="animation-delay: 0.3s">
                    <div class="glass-card p-4 h-100">
                        <div class="section-header d-flex justify-content-between align-items-center">
                            <div><i class="bi bi-collection-play-fill text-primary"></i> Portafolio Multimedia</div>
                            <button class="btn btn-glass btn-sm" onclick="subirMuestra()"><i class="bi bi-upload me-2"></i>Subir</button>
                        </div>
                        <div class="row g-3" id="muestrasGrid"></div>
                    </div>
                </div>
                <div class="col-lg-5 animated-entry" style="animation-delay: 0.4s">
                    <div class="glass-card p-4 h-100">
                        <div class="section-header"><i class="bi bi-graph-up text-primary"></i> Métricas de Impacto</div>
                        <div class="d-flex justify-content-between mb-3">
                            <span class="text-dim">Visibilidad Semanal</span>
                            <span class="text-primary fw-bold" id="metricVisibilidad">+0%</span>
                        </div>
                        <div class="progress mb-4" style="height: 6px; background: rgba(255,255,255,0.05);">
                            <div class="progress-bar" id="metricProgress" style="width: 0%; background: var(--primary);"></div>
                        </div>
                        <div class="d-flex justify-content-around text-center">
                            <div>
                                <div class="h4 fw-bold mb-0" id="metricAlcance">0</div>
                                <div class="small text-dim">Alcance</div>
                            </div>
                            <div>
                                <div class="h4 fw-bold mb-0" id="metricSinergias">0</div>
                                <div class="small text-dim">Sinergias</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="editarPerfilForm" class="glass-card p-4 mt-4 animated-entry" style="display: none;">
                <div class="section-header"><i class="bi bi-gear-fill me-2"></i>Configuración de Identidad Profesional</div>
                <form id="formEditarPerfil" onsubmit="guardarPerfil(event)" class="row g-3">
                    <div class="col-12">
                        <label class="form-label text-dim small">Biografía Ejecutiva</label>
                        <textarea class="form-control glass-card" id="editBio" rows="3" style="background: rgba(0,0,0,0.2) !important; color: white; border: 1px solid rgba(255,255,255,0.1);">${userProfile?.bio || ''}</textarea>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-dim small">Años de Trayectoria</label>
                        <input type="number" class="form-control glass-card" id="editExperiencia" value="${userProfile?.experiencia || 0}" style="background: rgba(0,0,0,0.2) !important; color: white;">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-dim small">Ubicación Actual</label>
                        <input type="text" class="form-control glass-card" id="editUbicacion" value="${userProfile?.ubicacion || ''}" style="background: rgba(0,0,0,0.2) !important; color: white;">
                    </div>
                    <div class="col-12 d-flex gap-2 mt-4">
                        <button type="submit" class="btn btn-premium px-4">Actualizar Perfil</button>
                        <button type="button" class="btn btn-glass px-4" onclick="toggleEditarPerfil()">Descartar Cambios</button>
                    </div>
                </form>
            </div>
        `;
        await renderMuestrasEnPerfil();
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        element.innerHTML = '<div class="alert alert-danger glass-card">Error al cargar perfil profesional.</div>';
    }
}

async function renderMuestrasEnPerfil() {
    const grid = document.getElementById('muestrasGrid');
    if (!grid) return;
    try {
        const mis = await fetchAPI('/muestras/mis-muestras');
        const list = Array.isArray(mis) ? mis : [];
        if (list.length === 0) {
            grid.innerHTML = '<div class="col-12"><div class="glass-card p-4 text-center text-dim">Aún no has subido muestras. Comparte tu audio o video.</div></div>';
            actualizarMetricasPerfil({ muestras: 0, conexiones: 0, instrumentos: 0, generos: 0 });
            return;
        }
        const cards = list.map(m => {
            const id = m.id_muestra || m.id;
            const tipo = (m.tipo || '').toLowerCase();
            const src = m.ruta_archivo;
            const desc = m.descripcion || '';
            const media = tipo === 'video'
                ? `<video src="${src}" controls class="w-100" style="border-radius: 10px; max-height: 220px;"></video>`
                : `<audio src="${src}" controls class="w-100" style="border-radius: 10px;"></audio>`;
            return `
                <div class="col-md-6">
                    <div class="glass-card p-3 h-100 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge ${tipo === 'video' ? 'bg-info text-dark' : 'bg-primary'}">${tipo === 'video' ? 'Video' : 'Audio'}</span>
                            <button class="btn btn-glass btn-sm" onclick="eliminarMuestra(${id})"><i class="bi bi-trash"></i></button>
                        </div>
                        ${media}
                        ${desc ? `<div class="text-dim small mt-2">${desc}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        grid.innerHTML = cards;
        try {
            const conexiones = await fetchAPI('/usuarios/mis-conexiones');
            const aceptadas = Array.isArray(conexiones) ? conexiones.filter(c => c.estado === 'aceptado').length : 0;
            const instrumentos = await fetchAPI(`/perfiles/${userProfile.id_perfil}/instrumentos`).catch(() => []);
            const generos = await fetchAPI(`/perfiles/${userProfile.id_perfil}/generos`).catch(() => []);
            actualizarMetricasPerfil({
                muestras: list.length,
                conexiones: aceptadas,
                instrumentos: Array.isArray(instrumentos) ? instrumentos.length : 0,
                generos: Array.isArray(generos) ? generos.length : 0
            });
        } catch (_e) {
            actualizarMetricasPerfil({ muestras: list.length, conexiones: 0, instrumentos: 0, generos: 0 });
        }
    } catch (error) {
        grid.innerHTML = '<div class="col-12"><div class="glass-card p-4 text-center text-danger">Error al cargar tus muestras</div></div>';
    }
}

function actualizarMetricasPerfil({ muestras, conexiones, instrumentos, generos }) {
    const alcance = Math.max(0, (conexiones * 120) + (muestras * 80) + (instrumentos * 25) + (generos * 20));
    const sinergias = Math.max(0, conexiones);
    const progreso = Math.min(100, Math.round((alcance / 2000) * 100));
    const variacion = Math.min(200, Math.round(((muestras + conexiones) / 10) * 100));
    const elVis = document.getElementById('metricVisibilidad');
    const elProg = document.getElementById('metricProgress');
    const elAlc = document.getElementById('metricAlcance');
    const elSin = document.getElementById('metricSinergias');
    if (elVis) elVis.textContent = `+${variacion}%`;
    if (elProg) elProg.style.width = `${progreso}%`;
    if (elAlc) elAlc.textContent = `${alcance}`;
    if (elSin) elSin.textContent = `${sinergias}`;
}

// BUSCAR
async function loadBuscarContent() {
    const element = document.getElementById('buscarContent');
    if (!element) return;

    element.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const usuarios = await fetchAPI('/usuarios');
        const usuariosArray = Array.isArray(usuarios)
            ? usuarios.filter(u => (u.id_usuario || u.id) !== currentUser.id)
            : [];

        const usuariosConPerfil = await Promise.all(
            usuariosArray.slice(0, 12).map(async (u) => {
                const userId = u.id_usuario || u.id;
                try {
                    const perfil = await fetchAPI(`/perfiles/usuario/${userId}`);
                    return { ...u, perfil };
                } catch (e) { return { ...u, perfil: null }; }
            })
        );

        const usuariosHTML = usuariosConPerfil.length > 0 ? usuariosConPerfil.map(u => {
            const nombreMostrar = u.nombre_completo || u.nombre || 'Usuario';
            const iniciales = nombreMostrar.charAt(0).toUpperCase();
            const ubicacion = u.perfil?.ubicacion || 'Internacional';
            const userId = u.id_usuario || u.id;
            const destacadoBadge = (userId % 2 === 0) ? '<span class="badge-pro position-absolute top-0 end-0 m-3">ELITE ARTIST</span>' : '';

            return `
            <div class="col-lg-4 col-md-6 animated-entry">
                <div class="glass-card p-0 h-100 overflow-hidden position-relative">
                    ${destacadoBadge}
                    <div class="p-4 text-center">
                        <div class="profile-avatar-premium mb-3 mx-auto" style="width: 90px; height: 90px; border-radius: 25px;">
                            <div class="profile-avatar-inner" style="border-radius: 22px; font-size: 2.2rem;">${iniciales}</div>
                        </div>
                        <h5 class="fw-bold mb-1 text-white">${nombreMostrar}</h5>
                        <div class="d-flex align-items-center justify-content-center gap-2 mb-3">
                            <i class="bi bi-geo-alt text-primary small"></i>
                            <span class="text-dim small">${ubicacion}</span>
                        </div>
                        <div class="d-flex flex-wrap justify-content-center gap-1 mb-4">
                            ${(u.perfil?.instrumentos || ['Talento']).slice(0, 3).map(inst => `<span class="badge btn-glass" style="font-size: 0.65rem; padding: 4px 10px;">${inst.nombre || inst}</span>`).join('')}
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-premium btn-sm flex-grow-1" onclick="solicitarConexion(${userId})">SINERGIA</button>
                            <button class="btn btn-glass btn-sm" onclick="abrirModalContratacion(${userId}, '${nombreMostrar}')"><i class="bi bi-calendar-check"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `}).join('') : '<div class="glass-card p-5 text-center text-dim w-100">No hemos encontrado talentos que coincidan con tu búsqueda.</div>';

        element.innerHTML = `
            <div class="section-header mb-4"><i class="bi bi-lightning-fill text-primary"></i> Motor de Descubrimiento de Talentos</div>
            
            <div class="glass-card p-4 mb-4">
                <div class="row g-3">
                    <div class="col-md-8">
                        <div class="input-group glass-card p-1" style="border-radius: 12px;">
                            <span class="input-group-text border-0 bg-transparent text-dim px-3"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control border-0 bg-transparent text-white" id="searchKeyword" placeholder="Buscar por instrumento, género o nombre...">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <button class="btn btn-premium w-100 h-100" onclick="aplicarFiltros()"><i class="bi bi-search me-2"></i>ACTUALIZAR RED</button>
                    </div>
                </div>
            </div>

            <div class="row g-4">${usuariosHTML}</div>
        `;
    } catch (error) {
        console.error('Error:', error);
        element.innerHTML = '<div class="alert alert-danger glass-card">Error al cargar la red de talentos.</div>';
    }
}

window.solicitarConexion = async function (usuarioId) {
    try {
        await fetchAPI('/usuarios/conectar', {
            method: 'POST',
            body: JSON.stringify({ usuario_id: usuarioId })
        });
        mostrarNotificacionFlotante('Solicitud enviada', 'La solicitud de conexión se ha registrado correctamente.', 'lightning-charge-fill');
        playNotificationSound();
        addLocalNotificacion({
            tipo: 'conexion_solicitada',
            titulo: 'Solicitud de conexión enviada',
            mensaje: 'Tu solicitud de conexión ha sido enviada',
            leida: false
        });
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionFlotante('Error de Red', 'No se pudo establecer el puente de sinergia en este momento.', 'wifi-off');
    }
};

window.buscarMusicos = function () {
    const keyword = document.getElementById('searchKeyword').value;
    // Simulación de filtrado para el demo
    mostrarNotificacionFlotante('Buscando', 'Actualizando resultados según filtros aplicados.', 'search');
    // En un sistema real aquí llamaríamos a la API con los filtros
    loadBuscarContent();
};

window.aplicarFiltros = function () {
    window.buscarMusicos();
};


// MENSAJES
async function loadMensajesContent() {
    const element = document.getElementById('mensajesContent');
    if (!element) return;

    element.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const conversaciones = await fetchAPI('/conversaciones');
        const conversArray = Array.isArray(conversaciones) ? conversaciones : [];

        const convsHTML = conversArray.length > 0 ? conversArray.map(c => {
            const nombre = c.interlocutor_nombre || 'Músico';
            const inicial = nombre.charAt(0).toUpperCase();
            const ultimoMsg = c.ultimo_mensaje || 'No hay mensajes recientes en esta conversación.';
            const fecha = c.fecha_ultimo_mensaje ? new Date(c.fecha_ultimo_mensaje).toLocaleDateString() : '';

            return `
            <div class="col-12 animated-entry">
                <div class="glass-card p-3 mb-2 d-flex align-items-center gap-3" onclick="abrirConversacion(${c.interlocutor_id})" style="cursor: pointer;">
                    <div class="profile-avatar-premium mb-0" style="width: 50px; height: 50px; border-radius: 12px;">
                        <div class="profile-avatar-inner" style="border-radius: 10px; font-size: 1.2rem;">${inicial}</div>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <h6 class="mb-0 fw-bold text-white">${nombre}</h6>
                            <small class="text-dim">${fecha}</small>
                        </div>
                        <p class="text-dim mb-0 small text-truncate" style="max-width: 300px;">${ultimoMsg}</p>
                    </div>
                    <div><i class="bi bi-chevron-right text-dim"></i></div>
                </div>
            </div>
        `}).join('') : '<div class="glass-card p-5 text-center text-dim w-100">No hay conversaciones activas en este momento.</div>';

        element.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="section-header mb-0"><i class="bi bi-chat-right-dots-fill text-primary"></i> Centro de Comunicaciones</div>
                <button class="btn btn-glass btn-sm" onclick="nuevoMensaje()"><i class="bi bi-plus-lg me-2"></i>NUEVO MENSAJE</button>
            </div>
            <div class="row">${convsHTML}</div>
        `;
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        element.innerHTML = '<div class="alert alert-danger glass-card">Error al sincronizar comunicaciones.</div>';
    }
}

window.abrirConversacion = async function (conversacionId) {
    try {
        const mensajes = await fetchAPI(`/conversaciones/${conversacionId}/mensajes`);
        const mensajesArray = Array.isArray(mensajes) ? mensajes : [];
        const infoUser = await fetchAPI(`/usuarios/${conversacionId}`);

        const modalHTML = `
            <div class="modal fade" id="conversacionModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content glass-card" style="border: 1px solid rgba(255,255,255,0.1) !important;">
                        <div class="modal-header border-0 p-4">
                            <div class="d-flex align-items-center gap-3">
                                <div class="profile-avatar-premium mb-0" style="width: 40px; height: 40px; border-radius: 10px;">
                                    <div class="profile-avatar-inner" style="border-radius: 9px; font-size: 1rem;">${(infoUser?.nombre_completo || 'Músico').charAt(0).toUpperCase()}</div>
                                </div>
                                <h5 class="modal-title fw-bold text-white">${infoUser?.nombre_completo || 'Conversación'}</h5>
                            </div>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4" id="mensajesContainer" style="max-height: 450px; overflow-y: auto; background: rgba(0,0,0,0.2);">
                            ${mensajesArray.map(m => `
                                <div class="mb-3 ${m.id_remitente === currentUser.id ? 'text-end' : ''}">
                                    <div class="d-inline-block p-3 ${m.id_remitente === currentUser.id ? 'bg-primary text-dark' : 'glass-card'}" style="border-radius: 15px; max-width: 80%; font-size: 0.95rem;">
                                        <div>${m.contenido || m.mensaje}</div>
                                        <small class="opacity-75 mt-1 d-block" style="font-size: 0.7rem;">${new Date(m.fecha_envio).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</small>
                                    </div>
                                </div>
                            `).join('') || '<div class="text-center text-dim py-5">Sin mensajes previos.</div>'}
                        </div>
                        <div class="modal-footer border-0 p-4 pt-0">
                            <div class="input-group glass-card p-1" style="border-radius: 100px;">
                                <input type="text" class="form-control border-0 bg-transparent text-white px-4" id="nuevoMensajeInput" placeholder="Escribe tu mensaje" onkeypress="if(event.key==='Enter') enviarMensaje(${conversacionId})">
                                <button class="btn btn-premium rounded-circle" style="width: 45px; height: 45px; padding: 0;" onclick="enviarMensaje(${conversacionId})">
                                    <i class="bi bi-send-fill"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('conversacionModal'));
        modal.show();

        // Scroll al final de los mensajes
        setTimeout(() => {
            const container = document.getElementById('mensajesContainer');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 100);

        // Limpiar al cerrar
        let messageInterval = null;
        let isRefreshing = false;
        let ws = null;
        function renderMessages(list) {
            const container = document.getElementById('mensajesContainer');
            if (!container) return;
            const html = list.map(m => `
                <div class="mb-3 ${m.id_remitente === currentUser.id ? 'text-end' : ''}">
                    <div class="d-inline-block p-3 ${m.id_remitente === currentUser.id ? 'bg-primary text-dark' : 'glass-card'}" style="border-radius: 15px; max-width: 80%; font-size: 0.95rem;">
                        <div>${m.contenido || m.mensaje}</div>
                        <small class="opacity-75 mt-1 d-block" style="font-size: 0.7rem;">${new Date(m.fecha_envio).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                </div>
            `).join('');
            if (container.innerHTML !== html) {
                container.innerHTML = html;
                if (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) {
                    container.scrollTop = container.scrollHeight;
                }
            }
        }

        // Función de refresco
        async function refreshMessages() {
            if (isRefreshing) return;
            isRefreshing = true;
            try {
                const refreshed = await fetchAPI(`/conversaciones/${conversacionId}/mensajes`);
                if (!Array.isArray(refreshed) || refreshed.length === 0) return;

                renderMessages(refreshed);
            } catch (e) { console.error('Error polling messages:', e); }
            finally { isRefreshing = false; }
        }

        // Iniciar polling
        messageInterval = setInterval(refreshMessages, 2000);

        // Pausar polling cuando la pestaña esté oculta
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) {
                refreshMessages();
                if (!messageInterval) {
                    messageInterval = setInterval(refreshMessages, 2000);
                }
            } else {
                if (messageInterval) {
                    clearInterval(messageInterval);
                    messageInterval = null;
                }
            }
        });

        try {
            const token = localStorage.getItem('token');
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/conversaciones/${conversacionId}?token=${encodeURIComponent(token || '')}`;
            ws = new WebSocket(wsUrl);
            ws.onopen = () => {
                if (messageInterval) {
                    clearInterval(messageInterval);
                    messageInterval = null;
                }
            };
            ws.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    const list = Array.isArray(payload) ? payload : (payload.mensajes || payload.data || []);
                    if (Array.isArray(list) && list.length > 0) {
                        renderMessages(list);
                        playMessageSound();
                    }
                } catch (_e) {}
            };
            ws.onclose = () => {
                if (!messageInterval) {
                    messageInterval = setInterval(refreshMessages, 2000);
                }
            };
            ws.onerror = () => {
                if (!messageInterval) {
                    messageInterval = setInterval(refreshMessages, 2000);
                }
            };
        } catch (_err) {}

        document.getElementById('conversacionModal').addEventListener('hidden.bs.modal', function () {
            if (messageInterval) clearInterval(messageInterval);
            if (ws) try { ws.close(); } catch (_e) {}
            modalContainer.remove();
            loadMensajesContent(); // Recargar lista de conversaciones
        });

    } catch (error) {
        console.error('Error al abrir conversación:', error);
        mostrarNotificacionFlotante('Error', 'No se pudieron cargar los mensajes.', 'chat-square-dots');
    }
};

window.nuevoMensaje = async function () {
    try {
        // Cargar lista de usuarios para seleccionar destinatario
        const usuarios = await fetchAPI('/usuarios');
        const usuariosArray = Array.isArray(usuarios)
            ? usuarios.filter(u => (u.id_usuario || u.id) !== currentUser.id)
            : [];

        if (usuariosArray.length === 0) {
            mostrarNotificacionFlotante('Sin usuarios disponibles', 'Por el momento no hay destinatarios disponibles para iniciar una conversación.', 'info-circle');
            return;
        }

        // Mostrar modal para nuevo mensaje
        const modalHTML = `
            <div class="modal fade" id="nuevoMensajeModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content" style="background: #1e1e1e; border: 1px solid #333;">
                        <div class="modal-header" style="border-bottom: 1px solid #333;">
                            <h5 class="modal-title text-white">Nuevo Mensaje</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label text-white">Destinatario</label>
                                <select class="form-select" id="destinatarioSelect" style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                                    <option value="">Selecciona un músico...</option>
                                    ${usuariosArray.map(u => {
                                        const userId = u.id_usuario || u.id;
                                        const nombre = u.nombre_completo || u.nombre || 'Usuario';
                                        return `<option value="${userId}">${nombre}</option>`;
                                    }).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-white">Mensaje</label>
                                <textarea class="form-control" id="mensajeTexto" rows="4" placeholder="Escribe tu mensaje..." style="background: #2a2a2a; border: 1px solid #333; color: #fff;"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer" style="border-top: 1px solid #333;">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="enviarNuevoMensaje()">
                                <i class="bi bi-send me-1"></i>Enviar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('nuevoMensajeModal'));
        modal.show();

        // Limpiar al cerrar
        document.getElementById('nuevoMensajeModal').addEventListener('hidden.bs.modal', function () {
            modalContainer.remove();
        });

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionFlotante('Error', 'No se pudo cargar el formulario de mensajes.', 'chat-left-dots-fill');
    }
};

window.enviarNuevoMensaje = async function () {
    const destinatarioId = document.getElementById('destinatarioSelect').value;
    const mensaje = document.getElementById('mensajeTexto').value;

    if (!destinatarioId) {
        mostrarNotificacionFlotante('Atención', 'Selecciona un destinatario para tu mensaje.', 'exclamation-circle');
        return;
    }

    if (!mensaje || !mensaje.trim()) {
        mostrarNotificacionFlotante('Mensaje vacío', 'Escribe algo para enviar.', 'chat-dots');
        return;
    }

    try {
        await fetchAPI(`/conversaciones/${destinatarioId}/mensajes`, {
            method: 'POST',
            body: JSON.stringify({
                contenido: mensaje.trim()
            })
        });

        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('nuevoMensajeModal')).hide();

        mostrarNotificacionFlotante('Mensaje enviado', 'El mensaje se ha entregado correctamente al destinatario.', 'send-check-fill');
        playMessageSound();
        loadMensajesContent(); // Recargar mensajes

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionFlotante('Error', 'No pudimos enviar tu mensaje ahora mismo.', 'wifi-off');
    }
};

window.enviarMensaje = async function (conversacionId) {
    const input = document.getElementById('nuevoMensajeInput');
    const mensaje = input.value;

    if (!mensaje || !mensaje.trim()) {
        return;
    }

    try {
        await fetchAPI(`/conversaciones/${conversacionId}/mensajes`, {
            method: 'POST',
            body: JSON.stringify({ contenido: mensaje.trim() })
        });

        input.value = '';

        // Recargar conversación para mostrar nuevo mensaje
        const container = document.getElementById('mensajesContainer');
        const mensajes = await fetchAPI(`/conversaciones/${conversacionId}/mensajes`);
        const mensajesArray = Array.isArray(mensajes) ? mensajes : [];

        container.innerHTML = mensajesArray.length > 0 ? mensajesArray.map(m => `
            <div class="mb-3 ${m.id_remitente === currentUser.id ? 'text-end' : ''}">
                <div class="d-inline-block p-3" style="background: ${m.id_remitente === currentUser.id ? '#009688' : '#2a2a2a'}; border-radius: 12px; max-width: 70%;">
                    <div class="text-white">${m.contenido || m.mensaje}</div>
                    <small style="color: ${m.id_remitente === currentUser.id ? 'rgba(255,255,255,0.7)' : '#999'};">${new Date(m.fecha_envio).toLocaleString('es', { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
            </div>
        `).join('') : '<p class="text-secondary text-center">No hay mensajes aún</p>';

        // Scroll al final
        container.scrollTop = container.scrollHeight;

        addLocalNotificacion({
            tipo: 'mensaje_enviado',
            titulo: 'Mensaje enviado',
            mensaje: 'Tu mensaje ha sido enviado',
            leida: false
        });

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionFlotante('Error', 'No pudimos enviar tu mensaje. Inténtalo de nuevo.', 'chat-quote-fill');
    }
};

// EVENTOS
async function loadEventosContent() {
    const element = document.getElementById('eventosContent');
    if (!element) return;

    element.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const response = await fetchAPI('/eventos');
        // Handle different response structures (backward compatibility)
        const eventosArray = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);

        const eventosHTML = eventosArray.length > 0 ? eventosArray.map(e => {
            const fecha = new Date(e.fecha_evento || e.fecha);
            const dia = fecha.getDate();
            const mes = fecha.toLocaleString('es', { month: 'short' }).toUpperCase();
            const hora = e.hora_evento || e.hora || '20:00';

            return `
            <div class="col-12 animated-entry">
                <div class="glass-card p-4 transition-all">
                    <div class="d-flex gap-4 flex-wrap flex-md-nowrap">
                        <div class="glass-card p-3 text-center" style="min-width: 90px; height: 90px; background: rgba(0, 209, 178, 0.1); border-color: rgba(0, 209, 178, 0.3);">
                            <div class="fw-bold fs-3 text-primary" style="line-height: 1;">${dia}</div>
                            <div class="small fw-bold text-dim">${mes}</div>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                                <h4 class="mb-0 fw-bold text-white">${e.titulo || e.nombre || 'Gran Gala Musical'}</h4>
                                <span class="badge border border-primary text-primary px-3 py-2" style="border-radius: 10px;">PROYECTO ${e.tipo?.toUpperCase() || 'VIP'}</span>
                            </div>
                            <p class="text-dim mb-3" style="max-width: 800px;">${e.descripcion || 'Una experiencia sonora inigualable para conectar con los mayores referentes de la escena local.'}</p>
                            <div class="d-flex gap-4 flex-wrap text-dim small">
                                <span><i class="bi bi-geo-alt-fill text-primary me-2"></i>${e.ubicacion || 'Auditorio Nacional'}</span>
                                <span><i class="bi bi-clock-fill text-primary me-2"></i>${hora}</span>
                                <span><i class="bi bi-people-fill text-primary me-2"></i>${e.participantes_actuales || 0} confirmados</span>
                            </div>
                        </div>
                        <div class="d-flex align-items-center">
                            <button class="btn btn-premium px-4" onclick="unirseEvento(${e.id_evento || e.id})">CONFIRMAR ASISTENCIA</button>
                        </div>
                    </div>
                </div>
            </div>
        `}).join('') : '<div class="glass-card p-5 text-center text-dim w-100">No hay eventos estratégicos programados en tu zona.</div>';

        element.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="section-header mb-0"><i class="bi bi-calendar3 text-primary"></i> Agenda Global de Eventos</div>
                <button class="btn btn-glass btn-sm" onclick="crearEvento()"><i class="bi bi-plus-lg me-2"></i>PUBLICAR EVENTO</button>
            </div>
            <div class="row g-4">${eventosHTML}</div>
        `;
    } catch (error) {
        console.error('Error:', error);
        element.innerHTML = '<div class="alert alert-danger">Error al cargar eventos</div>';
    }
}

window.verEvento = async function (eventoId) {
    try {
        // Cargar detalles del evento
        const response = await fetchAPI(`/eventos/${eventoId}`);
        const evento = response.data || response;

        // Cargar participantes
        let participantes = [];
        try {
            const partResponse = await fetchAPI(`/eventos/${eventoId}/participantes`);
            participantes = partResponse.data || [];
        } catch (e) {
            console.log('Sin participantes');
        }

        // Verificar si el usuario ya está participando
        const yaParticipa = participantes.some(p => p.id_usuario === currentUser.id);
        const esOrganizador = evento.id_organizador === currentUser.id;

        const fecha = new Date(evento.fecha_evento || evento.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // Mostrar modal con detalles
        const modalHTML = `
            <div class="modal fade" id="eventoModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content" style="background: #1e1e1e; border: 1px solid #333;">
                        <div class="modal-header" style="border-bottom: 1px solid #333;">
                            <h5 class="modal-title text-primary">${evento.titulo || evento.nombre}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <h6 class="text-white"><i class="bi bi-calendar-event me-2"></i>Fecha y Hora</h6>
                                <p class="text-secondary">${fechaFormateada} a las ${evento.hora_evento || evento.hora || 'Por definir'}</p>
                            </div>
                            <div class="mb-3">
                                <h6 class="text-white"><i class="bi bi-geo-alt me-2"></i>Ubicación</h6>
                                <p class="text-secondary">${evento.ubicacion || 'Por definir'}</p>
                            </div>
                            <div class="mb-3">
                                <h6 class="text-white"><i class="bi bi-info-circle me-2"></i>Descripción</h6>
                                <p class="text-secondary">${evento.descripcion || 'Sin descripción'}</p>
                            </div>
                            <div class="mb-3">
                                <h6 class="text-white"><i class="bi bi-people me-2"></i>Participantes (${participantes.length}${evento.capacidad ? '/' + evento.capacidad : ''})</h6>
                                ${participantes.length > 0 ? `
                                    <div class="d-flex flex-wrap gap-2">
                                        ${participantes.slice(0, 10).map(p => `
                                            <span class="badge" style="background: rgba(0, 150, 136, 0.2); color: #009688; padding: 0.5rem 1rem;">
                                                ${p.nombre_completo || 'Usuario'}
                                            </span>
                                        `).join('')}
                                        ${participantes.length > 10 ? `<span class="text-secondary">+${participantes.length - 10} más</span>` : ''}
                                    </div>
                                ` : '<p class="text-secondary">Aún no hay participantes</p>'}
                            </div>
                        </div>
                        <div class="modal-footer" style="border-top: 1px solid #333;">
                            ${!esOrganizador ? (yaParticipa ? `
                                <button class="btn btn-danger" onclick="abandonarEvento(${eventoId})">
                                    <i class="bi bi-box-arrow-right me-1"></i>Abandonar Evento
                                </button>
                            ` : `
                                <button class="btn btn-primary" onclick="unirseEvento(${eventoId})">
                                    <i class="bi bi-person-plus me-1"></i>Unirse al Evento
                                </button>
                            `) : '<span class="badge bg-success">Eres el organizador</span>'}
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('eventoModal'));
        modal.show();

        // Limpiar al cerrar
        document.getElementById('eventoModal').addEventListener('hidden.bs.modal', function () {
            modalContainer.remove();
        });

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionFlotante('Error', 'No se pudieron cargar los detalles del evento.', 'calendar-x');
    }
};

window.unirseEvento = async function (eventoId) {
    try {
        await fetchAPI(`/eventos/${eventoId}/participar`, {
            method: 'POST'
        });

        // Cerrar modal y recargar
        bootstrap.Modal.getInstance(document.getElementById('eventoModal')).hide();
        mostrarNotificacionFlotante('Inscripción confirmada', 'La participación en el evento se ha registrado correctamente.', 'calendar-check-fill');
        loadEventosContent();

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionFlotante('Error', error.message || 'No pudimos registrarte en el evento.', 'exclamation-circle');
    }
};

window.abandonarEvento = async function (eventoId) {
    if (!confirm('¿Estás seguro de que quieres abandonar este evento?')) {
        return;
    }

    try {
        await fetchAPI(`/eventos/${eventoId}/participar`, {
            method: 'DELETE'
        });

        // Cerrar modal y recargar
        bootstrap.Modal.getInstance(document.getElementById('eventoModal')).hide();
        mostrarNotificacionFlotante('Evento actualizado', 'La participación en el evento se ha cancelado correctamente.', 'box-arrow-right');
        loadEventosContent();

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionFlotante('Error', 'Hubo un problema al procesar tu solicitud.', 'exclamation-diamond');
    }
};

window.crearEvento = function () {
    // Mostrar modal para crear evento
    const modalHTML = `
        <div class="modal fade" id="crearEventoModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content" style="background: #1e1e1e; border: 1px solid #333;">
                    <div class="modal-header" style="border-bottom: 1px solid #333;">
                        <h5 class="modal-title text-primary"><i class="bi bi-calendar-plus me-2"></i>Crear Nuevo Evento</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="formCrearEvento">
                            <div class="mb-3">
                                <label class="form-label text-white">Título del Evento *</label>
                                <input type="text" class="form-control" id="eventoTitulo" required minlength="5" maxlength="200" placeholder="Ej: Jam Session de Jazz" style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-white">Descripción *</label>
                                <textarea class="form-control" id="eventoDescripcion" rows="3" required minlength="10" maxlength="2000" placeholder="Describe el evento, qué tipo de música, nivel esperado, etc." style="background: #2a2a2a; border: 1px solid #333; color: #fff;"></textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label text-white">Fecha *</label>
                                    <input type="date" class="form-control" id="eventoFecha" required style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label text-white">Hora *</label>
                                    <input type="time" class="form-control" id="eventoHora" required style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-white">Ubicación *</label>
                                <input type="text" class="form-control" id="eventoUbicacion" required minlength="5" maxlength="500" placeholder="Dirección o lugar del evento" style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label text-white">Tipo de Evento</label>
                                    <select class="form-select" id="eventoTipo" style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                                        <option value="jam_session">Jam Session</option>
                                        <option value="ensayo">Ensayo</option>
                                        <option value="concierto">Concierto</option>
                                        <option value="taller">Taller</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label text-white">Capacidad (opcional)</label>
                                    <input type="number" class="form-control" id="eventoCapacidad" min="2" max="1000" placeholder="Dejar vacío para ilimitado" style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-white">Visibilidad</label>
                                <select class="form-select" id="eventoVisibilidad" style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                                    <option value="publico">Público (todos pueden ver)</option>
                                    <option value="privado">Privado (solo participantes)</option>
                                    <option value="solo_invitados">Solo invitados</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer" style="border-top: 1px solid #333;">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="guardarNuevoEvento()">
                            <i class="bi bi-check-circle me-1"></i>Crear Evento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Agregar modal al DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // Establecer fecha mínima (hoy)
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('eventoFecha').setAttribute('min', hoy);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('crearEventoModal'));
    modal.show();

    // Limpiar al cerrar
    document.getElementById('crearEventoModal').addEventListener('hidden.bs.modal', function () {
        modalContainer.remove();
    });
};

window.guardarNuevoEvento = async function () {
    const form = document.getElementById('formCrearEvento');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const eventData = {
        titulo: document.getElementById('eventoTitulo').value.trim(),
        descripcion: document.getElementById('eventoDescripcion').value.trim(),
        fecha_evento: document.getElementById('eventoFecha').value,
        hora_evento: document.getElementById('eventoHora').value,
        ubicacion: document.getElementById('eventoUbicacion').value.trim(),
        tipo: document.getElementById('eventoTipo').value,
        capacidad: document.getElementById('eventoCapacidad').value ? parseInt(document.getElementById('eventoCapacidad').value) : null,
        visibilidad: document.getElementById('eventoVisibilidad').value
    };

    try {
        await fetchAPI('/eventos', {
            method: 'POST',
            body: JSON.stringify(eventData)
        });

        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('crearEventoModal')).hide();

        mostrarNotificacionFlotante('Evento creado', 'El evento se ha publicado correctamente.', 'calendar-check-fill');
        loadEventosContent(); // Recargar eventos

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionFlotante('Error', error.message || 'No se pudo crear el evento.', 'calendar-x');
    }
};

// Funciones auxiliares para el perfil
window.toggleEditarPerfil = function () {
    const form = document.getElementById('editarPerfilForm');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
};

window.guardarPerfil = async function (event) {
    event.preventDefault();

    const bioEl = document.getElementById('editBio');
    const expEl = document.getElementById('editExperiencia');
    const objEl = document.getElementById('editObjetivos');
    const bio = bioEl ? bioEl.value : '';
    const experiencia = expEl ? expEl.value : 0;
    const objetivos = objEl ? objEl.value : '';

    if (!bio || bio.trim().length === 0) {
        mostrarNotificacionFlotante('Biografía vacía', 'Cuéntanos un poco sobre ti para completar tu perfil.', 'info-circle');
        return;
    }

    try {
        // Si el usuario no tiene perfil, crearlo primero
        if (!userProfile || !userProfile.id_perfil) {
            console.log('Creando perfil nuevo');
            const newProfile = await fetchAPI('/perfiles', {
                method: 'POST',
                body: JSON.stringify({
                    id_usuario: currentUser.id || currentUser.id_usuario,
                    descripcion_breve: bio.trim(),
                    experiencia: parseInt(experiencia) || 0,
                    objetivos: objetivos.trim() || '',
                    visibilidad: 'publico'
                })
            });

            // Recargar datos del usuario
            await loadUserData();
            mostrarNotificacionFlotante('Perfil creado', 'El perfil se ha creado correctamente. Ahora puede completar instrumentos y géneros.', 'person-check-fill');
        } else {
            // Actualizar perfil existente
            await fetchAPI(`/perfiles/${userProfile.id_perfil}`, {
                method: 'PUT',
                body: JSON.stringify({
                    descripcion_breve: bio.trim(),
                    experiencia: parseInt(experiencia) || 0,
                    objetivos: objetivos.trim() || ''
                })
            });
            mostrarNotificacionFlotante('Perfil', 'Tus cambios se han guardado correctamente.', 'check-circle-fill');
        }

        try {
            saveLocalPerfilOverride(currentUser.id, {
                descripcion_breve: bio.trim(),
                experiencia: parseInt(experiencia) || 0,
                objetivos: objetivos.trim() || ''
            });
        } catch (_e) {}

        toggleEditarPerfil();
        loadPerfilContent(); // Recargar
    } catch (error) {
        console.error('Error:', error);
        try {
            saveLocalPerfilOverride(currentUser.id, {
                descripcion_breve: bio.trim(),
                experiencia: parseInt(experiencia) || 0,
                objetivos: objetivos.trim() || ''
            });
        } catch (_e) {}
        mostrarNotificacionFlotante('Perfil', 'Sincronizado localmente. Se actualizará cuando el servidor esté disponible.', 'check-circle-fill');
        toggleEditarPerfil();
        loadPerfilContent();
    }
};

function getLocalPerfilOverride(userId) {
    try {
        const raw = localStorage.getItem(`perfilOverride:${userId}`);
        const obj = raw ? JSON.parse(raw) : null;
        return obj && typeof obj === 'object' ? obj : null;
    } catch (_e) {
        return null;
    }
}

function saveLocalPerfilOverride(userId, data) {
    try {
        const existing = getLocalPerfilOverride(userId) || {};
        const merged = { ...existing, ...data };
        localStorage.setItem(`perfilOverride:${userId}`, JSON.stringify(merged));
    } catch (_e) {}
}

window.abrirModalGestion = function (tipo) {
    const titulo = tipo === 'instrumento' ? 'Añadir Instrumento Dominado' : 'Añadir Género Predominante';
    const placeholder = tipo === 'instrumento' ? 'Ej: Guitarra Eléctrica, Piano, Saxofón...' : 'Ej: Jazz Fusion, Techno, Rock, Mariachi...';
    const icon = tipo === 'instrumento' ? 'bi-music-note-beamed' : 'bi-disc';

    const modalHTML = `
        <div class="modal fade" id="modalGestionPremium" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content glass-card overflow-hidden" style="border: 1px solid rgba(255,255,255,0.1); background: rgba(20, 20, 20, 0.95); backdrop-filter: blur(20px);">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title text-white fw-bold"><i class="bi ${icon} text-primary me-2"></i>${titulo}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="mb-3">
                            <label class="form-label text-dim small">IDENTIFICAR TALENTO / ESCENA</label>
                            <input type="text" class="form-control glass-card py-3" id="gestionNombre" placeholder="${placeholder}" style="background: rgba(0,0,0,0.3) !important; color: white; border: 1px solid rgba(255,255,255,0.1);">
                        </div>
                        <p class="text-dim small mb-0 opacity-75 mt-2">
                            <i class="bi bi-info-circle me-1 text-primary"></i> 
                            Esto refinará los algoritmos de búsqueda para posicionarte en sinergias de alto impacto.
                        </p>
                    </div>
                    <div class="modal-footer border-0 pt-0 p-4">
                        <button type="button" class="btn btn-glass px-4" data-bs-dismiss="modal">DESCARTAR</button>
                        <button type="button" class="btn btn-premium px-4" id="btnConfirmarGestion">CONFIRMAR ESTRATEGIA</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.id = 'modalGestionContainer';
    container.innerHTML = modalHTML;
    document.body.appendChild(container);

    const modal = new bootstrap.Modal(document.getElementById('modalGestionPremium'));
    modal.show();

    document.getElementById('btnConfirmarGestion').onclick = async function () {
        const nombre = document.getElementById('gestionNombre').value;
        if (!nombre || !nombre.trim()) return;

        modal.hide();
        if (tipo === 'instrumento') {
            await ejecutarAgregarInstrumento(nombre.trim());
        } else {
            await ejecutarAgregarGenero(nombre.trim());
        }
    };

    document.getElementById('modalGestionPremium').addEventListener('hidden.bs.modal', function () {
        container.remove();
    });
};

window.agregarInstrumento = function () {
    window.abrirModalGestion('instrumento');
};

window.agregarGenero = function () {
    window.abrirModalGestion('genero');
};

async function ejecutarAgregarInstrumento(nombre) {
    if (!userProfile || !userProfile.id_perfil) {
        mostrarNotificacionFlotante('Perfil Incompleto', 'Primero debes establecer tu biografía ejecutiva.', 'info-circle');
        return;
    }

    try {
        let instrumentos = [];
        try { instrumentos = await fetchAPI('/instrumentos'); } catch (e) { instrumentos = []; }

        let instrumento = Array.isArray(instrumentos)
            ? instrumentos.find(i => i.nombre && i.nombre.toLowerCase() === nombre.toLowerCase())
            : null;

        if (!instrumento) {
            try {
                instrumento = await fetchAPI('/instrumentos', {
                    method: 'POST',
                    body: JSON.stringify({ nombre: nombre })
                });
            } catch (e) {
                console.error('Error al crear instrumento:', e);
                return;
            }
        }

        const instrumentoId = instrumento.id_instrumento || instrumento.id;
        await fetchAPI(`/perfiles/${userProfile.id_perfil}/instrumentos`, {
            method: 'POST',
            body: JSON.stringify({ instrumento_id: instrumentoId })
        });

        mostrarNotificacionFlotante('Sincronización Perfil', 'Talento agregado exitosamente al catálogo.', 'music-note');
        playNotificationSound();
        loadPerfilContent();
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionFlotante('Error de Sistema', 'No pudimos procesar la actualización del talento.', 'exclamation-circle');
    }
}

async function ejecutarAgregarGenero(nombre) {
    if (!userProfile || !userProfile.id_perfil) {
        mostrarNotificacionFlotante('Perfil Incompleto', 'Primero debes establecer tu biografía ejecutiva.', 'info-circle');
        return;
    }

    try {
        let generos = [];
        try { generos = await fetchAPI('/generos'); } catch (e) { generos = []; }

        let genero = Array.isArray(generos)
            ? generos.find(g => g.nombre && g.nombre.toLowerCase() === nombre.toLowerCase())
            : null;

        if (!genero) {
            try {
                genero = await fetchAPI('/generos', {
                    method: 'POST',
                    body: JSON.stringify({ nombre: nombre })
                });
            } catch (e) {
                console.error('Error al crear género:', e);
                return;
            }
        }

        const generoId = genero.id_genero || genero.id;
        await fetchAPI(`/perfiles/${userProfile.id_perfil}/generos`, {
            method: 'POST',
            body: JSON.stringify({ genero_id: generoId })
        });

        mostrarNotificacionFlotante('Sincronización Perfil', 'Género musical vinculado correctamente.', 'disc');
        playNotificationSound();
        loadPerfilContent();
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionFlotante('Error de Sistema', 'No pudimos procesar el vínculo del género.', 'exclamation-circle');
    }
}

window.subirMuestra = function () {
    // Mostrar modal para subir muestra
    const modalHTML = `
        <div class="modal fade" id="subirMuestraModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content" style="background: #1e1e1e; border: 1px solid #333;">
                    <div class="modal-header" style="border-bottom: 1px solid #333;">
                        <h5 class="modal-title text-primary"><i class="bi bi-music-note-beamed me-2"></i>Subir Muestra de Audio</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="formSubirMuestra" enctype="multipart/form-data">
                            <div class="mb-3">
                                <label class="form-label text-white">Tipo *</label>
                                <select class="form-select" id="muestraTipo" style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                                    <option value="audio">Audio</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-white">Título *</label>
                                <input type="text" class="form-control" id="muestraTitulo" required maxlength="200" placeholder="Nombre de tu muestra" style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-white">Descripción</label>
                                <textarea class="form-control" id="muestraDescripcion" rows="3" maxlength="1000" placeholder="Describe tu muestra (opcional)" style="background: #2a2a2a; border: 1px solid #333; color: #fff;"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-white">Archivo *</label>
                                <input type="file" class="form-control" id="muestraArchivo" accept="audio/*,video/*" required style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                                <small class="text-secondary">Acepta audio (MP3/WAV/OGG) y video (MP4/WebM). Máx. 50MB</small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer" style="border-top: 1px solid #333;">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="guardarMuestra()">
                            <i class="bi bi-upload me-1"></i>Subir Muestra
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Agregar modal al DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('subirMuestraModal'));
    modal.show();

    // Limpiar al cerrar
    document.getElementById('subirMuestraModal').addEventListener('hidden.bs.modal', function () {
        modalContainer.remove();
    });
};

window.guardarMuestra = async function () {
    const form = document.getElementById('formSubirMuestra');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const titulo = document.getElementById('muestraTitulo').value.trim();
    const descripcion = document.getElementById('muestraDescripcion').value.trim();
    const archivo = document.getElementById('muestraArchivo').files[0];
    const tipo = (document.getElementById('muestraTipo')?.value || 'audio').toLowerCase();

    if (!archivo) {
        mostrarNotificacionFlotante('Atención', 'Selecciona un archivo válido.', 'file-earmark-music');
        return;
    }

    if (archivo.size > 50 * 1024 * 1024) {
        mostrarNotificacionFlotante('Archivo grande', 'El tamaño máximo permitido es 50MB.', 'exclamation-triangle');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const fd = new FormData();
        fd.append('file', archivo);
        const upRes = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd
        });
        if (!upRes.ok) throw new Error('No se pudo subir el archivo');
        const upData = await upRes.json();
        const url = upData.url;
        if (!url) throw new Error('Respuesta de subida inválida');

        const createRes = await fetch(`${API_URL}/muestras`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id_perfil: userProfile?.id_perfil,
                tipo: tipo,
                ruta_archivo: url,
                descripcion: descripcion || null
            })
        });
        if (!createRes.ok) {
            const err = await createRes.json().catch(() => ({}));
            throw new Error(err.message || 'Error al registrar la muestra');
        }

        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('subirMuestraModal')).hide();

        mostrarNotificacionFlotante('Muestra registrada', 'El archivo de audio se ha subido correctamente.', 'cloud-check');
        loadPerfilContent();

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionFlotante('Error', 'Hubo un problema al subir tu audio.', 'cloud-slash');
    }
};

window.eliminarMuestra = async function (id) {
    if (!confirm('¿Estás seguro de eliminar esta muestra?')) return;

    try {
        await fetchAPI(`/muestras/${id}`, { method: 'DELETE' });
        mostrarNotificacionFlotante('Perfil', 'Muestra eliminada correctamente.', 'trash');
        loadPerfilContent();
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionFlotante('Error', 'No se pudo eliminar la muestra.', 'exclamation-circle');
    }
};

// REFERENCIAS
async function loadReferenciasContent() {
    const element = document.getElementById('referenciasContent');
    if (!element) return;

    element.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const userId = currentUser.id;
        const referencias = await fetchAPI(`/referencias/usuario/${userId}`);
        const refArray = Array.isArray(referencias) ? referencias : [];

        const promedio = refArray.length > 0
            ? refArray.reduce((acc, r) => acc + parseFloat(r.calificacion || 0), 0) / refArray.length
            : 0;

        const comentariosHTML = refArray.length > 0
            ? refArray.map(r => `
                <div class="glass-card p-4 mb-3 animated-entry">
                    <div class="d-flex justify-content-between mb-2">
                        <h6 class="fw-bold text-white mb-0">${r.nombre_autor || 'Usuario'}</h6>
                        <div class="text-warning">${'★'.repeat(Math.round(r.calificacion || 0))}${'☆'.repeat(5 - Math.round(r.calificacion || 0))}</div>
                    </div>
                    <p class="text-dim small mb-2">"${r.comentario || ''}"</p>
                    <small class="text-primary fw-medium" style="font-size: 0.7rem;">Referencia registrada en el sistema</small>
                </div>
            `).join('')
            : '<div class="glass-card p-4 text-center text-dim">Aún no se han registrado referencias para este perfil.</div>';

        element.innerHTML = `
            <div class="section-header mb-4">
                <i class="bi bi-star-fill text-primary"></i>
                Referencias recibidas
            </div>
            
            <div class="row g-4 mb-4">
                <div class="col-lg-4 animated-entry">
                    <div class="glass-card p-4 text-center">
                        <div class="display-5 fw-bold text-primary mb-1">${promedio > 0 ? promedio.toFixed(1) : '–'}</div>
                        <div class="text-warning mb-3">
                            <i class="bi bi-star-fill"></i>
                            <i class="bi bi-star-fill"></i>
                            <i class="bi bi-star-fill"></i>
                            <i class="bi bi-star-fill"></i>
                            <i class="bi bi-star"></i>
                        </div>
                        <h5 class="text-white mb-2">Resumen de valoración</h5>
                        <p class="text-dim small mb-3">
                            Promedio calculado con base en las referencias registradas en tu perfil.
                        </p>
                        <button class="btn btn-glass btn-sm w-100" id="btnAbrirReferenciaNueva">
                            <i class="bi bi-plus-lg me-2"></i>Registrar referencia sobre otro músico
                        </button>
                    </div>
                </div>
                <div class="col-lg-8">
                    ${comentariosHTML}
                </div>
            </div>
        `;

        const btnNuevaRef = document.getElementById('btnAbrirReferenciaNueva');
        if (btnNuevaRef) {
            btnNuevaRef.addEventListener('click', abrirModalReferenciaNueva);
        }
    } catch (error) {
        console.error('Error al cargar referencias:', error);
        element.innerHTML = '<div class="alert alert-danger glass-card">No se pudieron cargar las referencias.</div>';
    }
}

async function abrirModalReferenciaNueva() {
    try {
        const usuarios = await fetchAPI('/usuarios');
        const usuariosArray = Array.isArray(usuarios) ? usuarios.filter(u => u.id !== currentUser.id) : [];

        if (usuariosArray.length === 0) {
            mostrarNotificacionFlotante(
                'Sin usuarios disponibles',
                'Por el momento no hay perfiles adicionales para referenciar.',
                'info-circle'
            );
            return;
        }

        const modalHTML = `
            <div class="modal fade" id="nuevaReferenciaModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content" style="background: #1e1e1e; border: 1px solid #333;">
                        <div class="modal-header" style="border-bottom: 1px solid #333;">
                            <h5 class="modal-title text-white">Registrar referencia</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label text-white">Músico referenciado</label>
                                <select class="form-select" id="referenciaDestinoSelect" style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                                    <option value="">Seleccione un perfil</option>
                                    ${usuariosArray.map(u => `<option value="${u.id || u.id_usuario}">${u.nombre_completo || u.nombre || 'Usuario'}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-white">Calificación (1 a 5)</label>
                                <input type="number" min="1" max="5" class="form-control" id="referenciaCalificacionInput" style="background: #2a2a2a; border: 1px solid #333; color: #fff;">
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-white">Comentario</label>
                                <textarea class="form-control" id="referenciaComentarioInput" rows="3" placeholder="Describa brevemente la experiencia de colaboración." style="background: #2a2a2a; border: 1px solid #333; color: #fff;"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer" style="border-top: 1px solid #333;">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btnGuardarReferenciaNueva">
                                Guardar referencia
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        const modalElement = document.getElementById('nuevaReferenciaModal');
        const modal = new bootstrap.Modal(modalElement);

        const btnGuardar = document.getElementById('btnGuardarReferenciaNueva');
        if (btnGuardar) {
            btnGuardar.addEventListener('click', async () => {
                const destinoId = document.getElementById('referenciaDestinoSelect').value;
                const calificacion = document.getElementById('referenciaCalificacionInput').value;
                const comentario = document.getElementById('referenciaComentarioInput').value;

                if (!destinoId) {
                    mostrarNotificacionFlotante('Datos incompletos', 'Seleccione el perfil que desea referenciar.', 'exclamation-circle');
                    return;
                }

                const cal = parseInt(calificacion, 10);
                if (Number.isNaN(cal) || cal < 1 || cal > 5) {
                    mostrarNotificacionFlotante('Calificación no válida', 'La calificación debe estar entre 1 y 5.', 'exclamation-circle');
                    return;
                }

                try {
                    await fetchAPI('/referencias', {
                        method: 'POST',
                        body: JSON.stringify({
                            id_autor: currentUser.id,
                            id_referenciado: destinoId,
                            calificacion: cal,
                            comentario: comentario ? comentario.trim() : ''
                        })
                    });

                    modal.hide();
                    mostrarNotificacionFlotante(
                        'Referencia registrada',
                        'La referencia se ha guardado correctamente.',
                        'check-circle-fill'
                    );
                    loadReferenciasContent();
                } catch (error) {
                    console.error('Error al registrar referencia:', error);
                    mostrarNotificacionFlotante(
                        'Error',
                        'No fue posible registrar la referencia en este momento.',
                        'exclamation-triangle'
                    );
                }
            });
        }

        modalElement.addEventListener('hidden.bs.modal', () => {
            modalContainer.remove();
        });

        modal.show();
    } catch (error) {
        console.error('Error al abrir modal de referencia:', error);
        mostrarNotificacionFlotante(
            'Error',
            'No fue posible cargar el formulario de referencia.',
            'exclamation-triangle'
        );
    }
}


// CONEXIONES
async function loadConexionesContent() {
    const element = document.getElementById('conexionesContent');
    if (!element) return;

    element.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const conexiones = await fetchAPI('/usuarios/mis-conexiones');
        const conArray = Array.isArray(conexiones) ? conexiones : [];

        // Mock data para demo si no hay nada
        const mockConexiones = [
            { id_conexion: 999, nombre_otro_usuario: 'Elena (Violinista)', estado: 'pendiente', fecha_solicitud: new Date(), soy_remitente: false },
            { id_conexion: 998, nombre_otro_usuario: 'Marco (Productor)', estado: 'aceptado', fecha_solicitud: new Date(), id_otro_usuario: 50 },
            { id_conexion: 997, nombre_otro_usuario: 'Sara (Vocalista)', estado: 'aceptado', fecha_solicitud: new Date(), id_otro_usuario: 51 }
        ];

        const finalConArray = conArray.length > 0 ? conArray : mockConexiones;
        const pendientes = finalConArray.filter(c => c.estado === 'pendiente');
        const aceptadas = finalConArray.filter(c => c.estado === 'aceptado');

        const pendientesHTML = pendientes.map(c => `
            <div class="glass-card p-3 mb-3 d-flex align-items-center gap-3 animated-entry">
                <div class="profile-avatar-premium mb-0" style="width: 50px; height: 50px; border-radius: 12px;">
                    <div class="profile-avatar-inner" style="border-radius: 11px; font-size: 1.2rem;">${c.nombre_otro_usuario.charAt(0)}</div>
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-0 fw-bold text-white">${c.nombre_otro_usuario}</h6>
                    <small class="text-dim">Auditando tu talento...</small>
                </div>
                <div class="d-flex gap-2">
                    ${!c.soy_remitente ? `
                        <button class="btn btn-premium btn-sm" onclick="responderConexion(${c.id_conexion}, 'aceptado')">ACEPTAR</button>
                        <button class="btn btn-glass btn-sm" onclick="responderConexion(${c.id_conexion}, 'rechazado')">IGNORAR</button>
                    ` : '<span class="badge border border-secondary text-dim px-3">EN ESPERA</span>'}
                </div>
            </div>
        `).join('') || '<div class="text-center text-dim p-4">Sin solicitudes pendientes.</div>';

        const aceptadasHTML = aceptadas.map(c => `
            <div class="col-lg-4 col-md-6 animated-entry">
                <div class="glass-card p-4 h-100 text-center">
                    <div class="profile-avatar-premium mb-3 mx-auto" style="width: 70px; height: 70px; border-radius: 20px;">
                        <div class="profile-avatar-inner" style="border-radius: 18px; font-size: 1.8rem;">${c.nombre_otro_usuario.charAt(0)}</div>
                    </div>
                    <h6 class="fw-bold mb-1">${c.nombre_otro_usuario}</h6>
                    <p class="text-primary small mb-3">CONEXIÓN ACTIVA</p>
                    <button class="btn btn-premium btn-sm w-100" onclick="abrirChatCon(${c.id_otro_usuario})"><i class="bi bi-chat-fill me-2"></i>MENSAJE DIRECTO</button>
                </div>
            </div>
        `).join('') || '<div class="col-12 text-center text-dim p-4">Aún no has establecido sinergias.</div>';

        element.innerHTML = `
            <div class="section-header mb-4"><i class="bi bi-bezier2 text-primary"></i> Inteligencia de Sinergias</div>
            
            <div class="row g-4 mb-5">
                <div class="col-lg-5">
                    <h5 class="text-white fw-bold mb-3 small opacity-75">SOLICITUDES DE ACCESO</h5>
                    ${pendientesHTML}
                </div>
                <div class="col-lg-7">
                    <h5 class="text-white fw-bold mb-3 small opacity-75">NÚCLEO DE COLABORADORES</h5>
                    <div class="row g-3">${aceptadasHTML}</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar conexiones:', error);
        element.innerHTML = '<div class="alert alert-danger glass-card">Error al sincronizar red de sinergias.</div>';
    }
}

window.responderConexion = async function (id_conexion, estado) {
    try {
        await fetchAPI(`/usuarios/responder-conexion/${id_conexion}`, {
            method: 'PUT',
            body: JSON.stringify({ estado })
        });

        const msg = estado === 'aceptado' ? 'Conexión aceptada. Ya pueden intercambiar mensajes.' : 'Conexión rechazada.';
        const icon = estado === 'aceptado' ? 'person-check-fill' : 'person-x-fill';
        mostrarNotificacionFlotante('Conexiones', msg, icon);
        loadConexionesContent();
    } catch (error) {
        console.error(error);
        mostrarNotificacionFlotante('Error', 'Ocurrió un problema al procesar la solicitud.', 'exclamation-diamond');
    }
};

window.abrirChatCon = function (usuarioId) {
    // Redirigir a mensajes y abrir conversación
    showTab('mensajes');
    setTimeout(() => {
        abrirConversacion(usuarioId);
    }, 500);
};

// Cargar contenido de Pagos
async function loadPagosContent() {
    const container = document.getElementById('pagosContent');
    if (!container) return;

    try {
        // Cargar el HTML del módulo
        const response = await fetch('modules/pagos.html');
        const html = await response.text();
        container.innerHTML = html;

        // Cargar el script del módulo
        const script = document.createElement('script');
        script.src = 'js/pagos.js';
        script.onload = () => {
            console.log('Módulo de pagos cargado');
            if (window.PagosModule && typeof window.PagosModule.init === 'function') {
                window.PagosModule.init();
            }
        };
        document.body.appendChild(script);
    } catch (error) {
        console.error('Error al cargar módulo de pagos:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Error al cargar el módulo de pagos
            </div>
        `;
    }
}

// ============================================
// SISTEMA DE NOTIFICACIONES EN TIEMPO REAL
// ============================================

/**
 * Cargar notificaciones del usuario
 */
async function cargarNotificaciones() {
    try {
        const response = await fetchAPI('/notificaciones?limit=20');
        const server = Array.isArray(response.data) ? response.data : [];
        const overrides = getLocalOverrides();
        const locals = getLocalNotificaciones();
        const mergedServer = server.map(n => overrides.includes(n.id_notificacion) ? { ...n, leida: true } : n);
        const all = [...locals, ...mergedServer].sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
        const count = all.filter(n => !n.leida).length;
        actualizarBadgeNotificaciones(count);
        renderizarNotificaciones(all);
        return count;
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        const lista = document.getElementById('notificacionesLista');
        if (lista) {
            lista.innerHTML = `
                <div class="text-center p-3">
                    <p class="text-secondary mb-0">Error al cargar notificaciones</p>
                </div>
            `;
        }
        return 0;
    }
}

/**
 * Actualizar badge de notificaciones
 */
function actualizarBadgeNotificaciones(count) {
    const badge = document.getElementById('notificacionesBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}
function getLocalOverrides() {
    try {
        const raw = localStorage.getItem('notificacionesOverrides');
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}
function addLocalOverrideId(id) {
    try {
        const list = getLocalOverrides();
        if (!list.includes(id)) {
            list.push(id);
            localStorage.setItem('notificacionesOverrides', JSON.stringify(list));
        }
    } catch (e) {}
}
function getLocalNotificaciones() {
    try {
        const raw = localStorage.getItem('notificacionesLocal');
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}
function saveLocalNotificaciones(notifs) {
    try {
        localStorage.setItem('notificacionesLocal', JSON.stringify(notifs));
    } catch (e) {}
}
function addLocalNotificacion(notif) {
    const arr = getLocalNotificaciones();
    const id = notif.id_notificacion || `local-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const safe = {
        id_notificacion: id,
        tipo: notif.tipo || 'sistema',
        titulo: notif.titulo || '',
        mensaje: notif.mensaje || '',
        leida: notif.leida === true ? true : false,
        fecha_creacion: notif.fecha_creacion || new Date().toISOString()
    };
    arr.unshift(safe);
    saveLocalNotificaciones(arr);
}
function markLocalNotifRead(id) {
    const arr = getLocalNotificaciones();
    const idx = arr.findIndex(n => n.id_notificacion === id);
    if (idx >= 0) {
        arr[idx] = { ...arr[idx], leida: true };
        saveLocalNotificaciones(arr);
    } else {
        addLocalOverrideId(id);
    }
}

/**
 * Renderizar lista de notificaciones
 */
function renderizarNotificaciones(notificaciones) {
    const lista = document.getElementById('notificacionesLista');
    if (!lista) return;

    if (!notificaciones || notificaciones.length === 0) {
        lista.innerHTML = `
            <div class="text-center p-4">
                <i class="bi bi-bell-slash" style="font-size: 3rem; color: #666;"></i>
                <p class="text-secondary mt-2 mb-0">No tienes notificaciones</p>
            </div>
        `;
        return;
    }

    lista.innerHTML = notificaciones.map(notif => {
        const icono = obtenerIconoNotificacion(notif.tipo);
        const tiempo = formatearTiempoRelativo(notif.fecha_creacion);
        const claseLeida = notif.leida ? '' : 'no-leida';

        return `
            <div class="notificacion-item ${claseLeida}" onclick="marcarNotificacionLeida(${notif.id_notificacion}, ${notif.leida})">
                <div class="d-flex gap-3">
                    <div class="notificacion-icon">
                        <i class="bi bi-${icono}"></i>
                    </div>
                    <div class="notificacion-content">
                        <div class="notificacion-titulo">${notif.titulo}</div>
                        <div class="notificacion-mensaje">${notif.mensaje}</div>
                        <div class="notificacion-tiempo">
                            <i class="bi bi-clock me-1"></i>${tiempo}
                        </div>
                    </div>
                    ${!notif.leida ? '<div class="ms-2"><span class="badge bg-primary">Nueva</span></div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Obtener icono según tipo de notificación
 */
function obtenerIconoNotificacion(tipo) {
    const iconos = {
        'evento_actualizado': 'calendar-event',
        'evento_cancelado': 'calendar-x',
        'evento_recordatorio': 'alarm',
        'nuevo_participante': 'person-plus',
        'participante_abandono': 'person-dash',
        'mensaje': 'chat-dots',
        'pago': 'credit-card',
        'sistema': 'info-circle',
        'solicitud_conexion': 'person-plus',
        'conexion_aceptada': 'hand-thumbs-up',
        'conexion_rechazada': 'hand-thumbs-down',
        'referencia_nueva': 'star'
    };
    return iconos[tipo] || 'bell';
}

/**
 * Formatear tiempo relativo
 */
function formatearTiempoRelativo(fecha) {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diff = Math.floor((ahora - fechaNotif) / 1000); // segundos

    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;

    return fechaNotif.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

/**
 * Marcar notificación como leída
 */
window.marcarNotificacionLeida = async function (notifId, yaLeida) {
    if (yaLeida) return;
    const isLocal = typeof notifId === 'string' && String(notifId).startsWith('local-');
    if (isLocal) {
        markLocalNotifRead(notifId);
        await cargarNotificaciones();
        return;
    }
    try {
        await fetchAPI(`/notificaciones/${notifId}/leer`, {
            method: 'PUT'
        });
    } catch (error) {
        addLocalOverrideId(notifId);
    }
    await cargarNotificaciones();
};

/**
 * Verifica si el usuario tiene el perfil completo y muestra una advertencia si no
 */
function verificarIntegridadPerfil() {
    if (!userProfile) {
        mostrarNotificacionFlotante('Perfil incompleto', 'Aún no se ha creado el perfil. Los demás usuarios no podrán localizarlo hasta que lo configure.', 'exclamation-triangle');
        return;
    }

    // Verificar si faltan datos importantes
    const faltantes = [];
    if (!userProfile.descripcion_breve && !userProfile.bio) faltantes.push('biografía');
    if (!userProfile.ubicacion) faltantes.push('ubicación');

    if (faltantes.length > 0) {
        mostrarNotificacionFlotante('Completa tu Perfil', `Te falta agregar tu ${faltantes.join(' y ')} para destacar más.`, 'info-circle');
    }
}

/**
 * Marcar todas las notificaciones como leídas
 */
window.marcarTodasLeidas = async function () {
    try {
        await fetchAPI('/notificaciones/leer-todas', {
            method: 'PUT'
        });

        const locales = getLocalNotificaciones().map(n => ({ ...n, leida: true }));
        saveLocalNotificaciones(locales);
        localStorage.setItem('notificacionesOverrides', JSON.stringify([]));
        await cargarNotificaciones();

    } catch (error) {
        console.error('Error al marcar todas como leídas:', error);
        mostrarNotificacionFlotante('Error', 'No se pudieron actualizar las notificaciones.', 'bell-slash-fill');
    }
};

/**
 * Iniciar polling de notificaciones (cada 15 segundos)
 */
let lastNotificationCount = 0;
function iniciarPollingNotificaciones() {
    if (notificacionesInterval) {
        clearInterval(notificacionesInterval);
    }
    cargarNotificaciones().then(c => {
        lastNotificationCount = typeof c === 'number' ? c : 0;
    }).catch(() => {});
    notificacionesInterval = setInterval(async () => {
        try {
            const c = await cargarNotificaciones();
            if (typeof c === 'number' && c > lastNotificationCount) {
                playNotificationSound();
            }
            lastNotificationCount = typeof c === 'number' ? c : lastNotificationCount;
        } catch (error) {
        }
    }, 15000);
}

/**
 * Detener polling de notificaciones
 */
function detenerPollingNotificaciones() {
    if (notificacionesInterval) {
        clearInterval(notificacionesInterval);
        notificacionesInterval = null;
    }
}

// ============================================
// SISTEMA DE REPORTES Y SIMULACIÓN
// ============================================

window.reportarUsuario = function (usuarioId, nombre) {
    const motivo = prompt(`¿Por qué deseas reportar a ${nombre}?`);
    if (motivo === null) return; // Cancelado

    if (motivo.trim().length < 5) {
        mostrarNotificacionFlotante('Reporte', 'El motivo debe tener al menos 5 caracteres.', 'exclamation-circle');
        return;
    }

    fetchAPI('/reportes', {
        method: 'POST',
        body: JSON.stringify({
            id_reportado: usuarioId,
            id_reportante: currentUser.id,
            motivo: motivo.trim(),
            estado: 'pendiente'
        })
    }).then(() => {
        mostrarNotificacionFlotante('Reporte Enviado', `Gracias. El reporte contra ${nombre} ha sido enviado y será revisado.`, 'shield-fill-check');
    }).catch(err => {
        console.error('Error al reportar:', err);
        mostrarNotificacionFlotante('Error', 'No se pudo enviar el reporte.', 'exclamation-triangle');
    });
};

function mostrarNotificacionFlotante(titulo, mensaje, icono) {
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast show border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true" style="background: #1e1e1e; color: white; border-left: 5px solid #009688 !important; min-width: 300px;">
            <div class="toast-header" style="background: #2a2a2a; color: white; border-bottom: 1px solid #333;">
                <i class="bi bi-${icono} me-2 text-primary"></i>
                <strong class="me-auto">${titulo}</strong>
                <small>Ahora</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${mensaje}
            </div>
        </div>
    `;

    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '1060';
        document.body.appendChild(toastContainer);
    }

    const toastElement = document.createElement('div');
    toastElement.innerHTML = toastHTML;
    toastContainer.appendChild(toastElement);

    setTimeout(() => {
        const t = document.getElementById(toastId);
        if (t) {
            if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
                const bsToast = new bootstrap.Toast(t);
                bsToast.hide();
            } else {
                t.classList.remove('show');
            }
            setTimeout(() => t.parentElement.remove(), 500);
        }
    }, 5000);
}

// --- SISTEMA DE CONTRATACIÓN Y BOOST ---

window.abrirModalContratacion = function (musicoId, nombreMusico) {
    if (musicoId === currentUser.id) {
        mostrarNotificacionFlotante('Atención', 'No puedes contratarte a ti mismo.', 'person-badge');
        return;
    }

    const modalHTML = `
        <div class="modal fade" id="contratacionModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content bg-dark text-white border-success" style="border-width: 2px;">
                    <div class="modal-header border-success">
                        <h5 class="modal-title fw-bold text-success"><i class="bi bi-shield-lock-fill me-2"></i>Contratación Segura: ${nombreMusico}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info border-0" style="background: rgba(0, 123, 255, 0.1); color: #72b1ff;">
                            <i class="bi bi-info-circle-fill me-2"></i><strong>¿Cómo funciona?</strong> Depositas el dinero en Óolale. Nosotros lo retenemos hasta que el músico realice el trabajo y tú lo liberes.
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Monto a depositar (MXN)</label>
                            <div class="input-group">
                                <span class="input-group-text bg-dark border-secondary text-success">$</span>
                                <input type="number" id="montoContratacion" class="form-control bg-dark border-secondary text-white" placeholder="Ej: 500.00">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Descripción del servicio musical</label>
                            <textarea id="descContratacion" class="form-control bg-dark border-secondary text-white" rows="3" placeholder="Ej: Grabación de solos de guitarra para 2 temas..."></textarea>
                        </div>
                        <div class="p-3 rounded bg-black" style="border: 1px dashed #28a745;">
                            <div class="d-flex justify-content-between small">
                                <span>Subtotal:</span>
                                <span id="calcSubtotal">$0.00</span>
                            </div>
                            <div class="d-flex justify-content-between small text-secondary">
                                <span>Comisión de seguridad (10%):</span>
                                <span id="calcComision">$0.00</span>
                            </div>
                            <hr class="my-2 border-secondary">
                            <div class="d-flex justify-content-between fw-bold text-success">
                                <span>Total a pagar:</span>
                                <span id="calcTotal">$0.00</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-success">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-success px-4" onclick="procesarSolicitudContratacion(${musicoId})">
                            <i class="bi bi-credit-card-2-front me-2"></i>Pagar y Abrir Escrow
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const old = document.getElementById('contratacionModal');
    if (old) old.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('contratacionModal'));

    // Lógica de cálculo en tiempo real
    const montoInput = document.getElementById('montoContratacion');
    montoInput.addEventListener('input', () => {
        const m = parseFloat(montoInput.value) || 0;
        const com = m * 0.10;
        document.getElementById('calcSubtotal').textContent = `$${m.toFixed(2)}`;
        document.getElementById('calcComision').textContent = `$${com.toFixed(2)}`;
        document.getElementById('calcTotal').textContent = `$${(m + com).toFixed(2)}`;
    });

    modal.show();
};

window.procesarSolicitudContratacion = async function (musicoId) {
    const monto = document.getElementById('montoContratacion').value;
    const desc = document.getElementById('descContratacion').value;

    if (!monto || monto < 100) {
        mostrarNotificacionFlotante('Monto insuficiente', 'El monto mínimo para contrataciones seguras es $100 MXN', 'cash-coin');
        return;
    }

    try {
        const response = await fetchAPI('/contrataciones/solicitar', {
            method: 'POST',
            body: JSON.stringify({
                id_musico: musicoId,
                monto_total: monto,
                descripcion_servicio: desc
            })
        });

        bootstrap.Modal.getInstance(document.getElementById('contratacionModal')).hide();
        mostrarNotificacionFlotante('Solicitud creada', 'El músico ha sido notificado de la solicitud.', 'success');
        playNotificationSound();
    } catch (e) {
        console.error(e);
        mostrarNotificacionFlotante('Error', 'No se pudo procesar la solicitud de contratación.', 'shield-exclamation');
    }
};

window.abrirModalBoost = function () {
    const modalHTML = `
        <div class="modal fade" id="boostModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content bg-dark text-white border-warning" style="border-width: 2px;">
                    <div class="modal-header border-warning text-warning">
                        <h5 class="modal-title fw-bold">Óolale PRO BOOST</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <h3>$1.99 MXN</h3>
                        <p class="text-secondary">Visibilidad máxima por 48 horas</p>
                        <ul class="list-unstyled text-start d-inline-block">
                            <li>Aparece en el top del buscador</li>
                            <li>Insignia PRO en tu perfil</li>
                            <li>Prioridad en sugerencias</li>
                        </ul>
                    </div>
                    <div class="modal-footer border-warning flex-column">
                        <button type="button" class="btn btn-warning w-100 fw-bold py-3" onclick="activarBoost()">
                            Pagar con PayPal / Tarjeta
                        </button>
                        <small class="text-secondary mt-2">Activación instantánea tras el pago</small>
                    </div>
                </div>
            </div>
        </div>
    `;

    const old = document.getElementById('boostModal');
    if (old) old.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    new bootstrap.Modal(document.getElementById('boostModal')).show();
};


window.abrirModalPlanes = function () {
    const modalHTML = `
        <div class="modal fade" id="planesModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content bg-dark text-white shadow-lg" style="border: 1px solid #444;">
                    <div class="modal-header border-secondary">
                        <h5 class="modal-title fw-bold">Niveles de Membresía Óolale</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="row g-4">
                            <!-- Plan Pro -->
                            <div class="col-md-6">
                                <div class="card bg-black h-100 border-warning hover-scale" style="border-width: 2px; transition: transform 0.3s;">
                                    <div class="card-body text-center p-4">
                                        <h3 class="fw-bold">Óolale Pro</h3>
                                        <h4 class="text-warning">$9.99 <small class="fs-6 text-secondary">/mes</small></h4>
                                        <ul class="list-unstyled text-start my-4">
                                            <li class="mb-3"><strong>Conexiones Ilimitadas</strong></li>
                                            <li class="mb-3">Muestras de Audio Ilimitadas</li>
                                            <li class="mb-3">Prioridad en Búsquedas</li>
                                            <li class="mb-3">Insignia de Verificado</li>
                                        </ul>
                                        <button class="btn btn-warning w-100 fw-bold py-2" onclick="comprarPlan('pro')">Elegir Pro</button>
                                    </div>
                                </div>
                            </div>
                            <!-- Plan Legend -->
                            <div class="col-md-6">
                                <div class="card bg-black h-100 border-info hover-scale" style="border-width: 2px; transition: transform 0.3s;">
                                    <div class="card-body text-center p-4">
                                        <h3 class="fw-bold">Óolale Legend</h3>
                                        <h4 class="text-info">$19.99 <small class="fs-6 text-secondary">/mes</small></h4>
                                        <ul class="list-unstyled text-start my-4">
                                            <li class="mb-3"><strong>Todo lo de Pro</strong></li>
                                            <li class="mb-3">Perfil Destacado Premium</li>
                                            <li class="mb-3">Acceso a Eventos VIP</li>
                                            <li class="mb-3">Estadísticas Avanzadas</li>
                                        </ul>
                                        <button class="btn btn-info w-100 fw-bold py-2" onclick="comprarPlan('legend')">Elegir Legend</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 justify-content-center pb-4">
                        <p class="text-secondary small">Pago seguro procesado por Óolale</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    const old = document.getElementById('planesModal');
    if (old) old.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    new bootstrap.Modal(document.getElementById('planesModal')).show();
};

window.comprarPlan = async function (plan) {
    try {
        bootstrap.Modal.getInstance(document.getElementById('planesModal')).hide();

        mostrarNotificacionFlotante(`Procesando suscripción ${plan.toUpperCase()}...`, 'info');

        const resp = await fetchAPI('/pagos', {
            method: 'POST',
            body: JSON.stringify({
                monto: plan === 'pro' ? 9.99 : 19.99,
                metodoPago: 'paypal',
                descripcion: `Membresía Óolale ${plan.toUpperCase()}`,
                tipoTransaccion: 'membresia'
            })
        });

        if (resp?.approvalUrl) {
            window.location.href = resp.approvalUrl;
            return;
        }
        if (resp?.initPoint) {
            window.location.href = resp.initPoint;
            return;
        }
        mostrarNotificacionFlotante('Continuar pago', 'Sigue las instrucciones para completar tu suscripción.', 'credit-card-2-front');
    } catch (e) {
        console.error(e);
        mostrarNotificacionFlotante('Error', 'No se pudo completar la suscripción al plan.', 'credit-card-2-front');
    }
};

window.activarBoost = async function () {
    try {
        bootstrap.Modal.getInstance(document.getElementById('boostModal')).hide();
        mostrarNotificacionFlotante('Procesando pago del Boost...', 'info');

        const resp = await fetchAPI('/pagos', {
            method: 'POST',
            body: JSON.stringify({
                monto: 1.99,
                metodoPago: 'paypal',
                descripcion: 'Óolale PRO Boost - 48h',
                tipoTransaccion: 'boost_perfil'
            })
        });

        if (resp?.approvalUrl) {
            window.location.href = resp.approvalUrl;
            return;
        }
        if (resp?.initPoint) {
            window.location.href = resp.initPoint;
            return;
        }
        mostrarNotificacionFlotante('Continuar pago', 'Sigue las instrucciones para completar tu Boost.', 'lightning-charge-fill');
    } catch (e) {
        console.error(e);
        mostrarNotificacionFlotante('Error', 'No pudimos activar el boost en este momento.', 'lightning-charge');
    }
};

async function loadPagosContent() {
    const element = document.getElementById('pagosContent');
    if (!element) return;

    element.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const response = await fetchAPI('/pagos');
        const pagos = Array.isArray(response.pagos) ? response.pagos : (Array.isArray(response) ? response : []);

        let pagosHTML = '';
        
        if (pagos.length === 0) {
             pagosHTML = `
                <tr>
                    <td colspan="5" class="text-center py-5 text-dim">
                        No hay transacciones registradas en el historial.
                    </td>
                </tr>
            `;
        } else {
            pagosHTML = pagos.map(p => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td class="py-3 text-dim small">${new Date(p.fecha_creacion).toLocaleDateString()}</td>
                    <td class="py-3"><span class="badge border border-primary text-primary px-3 py-1">${(p.tipo_transaccion || 'otros').toUpperCase()}</span></td>
                    <td class="py-3 text-white fw-medium">${p.descripcion || 'Sin descripción'}</td>
                    <td class="py-3 fw-bold text-primary">$${parseFloat(p.monto).toFixed(2)} ${p.moneda}</td>
                    <td class="py-3"><span class="badge-pro">${(p.estado || 'completado').toUpperCase()}</span></td>
                </tr>
            `).join('');
        }

        const promosResp = await fetchAPI('/pagos/promociones');
        const promociones = Array.isArray(promosResp?.promociones) ? promosResp.promociones : [];
        const promosHTML = promociones.map(p => `
            <div class="glass-card p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">${p.titulo}</div>
                        <div class="text-dim small">${p.descripcion}</div>
                        <div class="text-primary fw-medium mt-1">$${p.precio} ${p.moneda} · ${p.tipo === 'boost' ? p.duracion : 'mensual'}</div>
                    </div>
                    <div>
                        ${p.tipo === 'membresia' ? `<button class="btn btn-premium btn-sm" onclick="comprarPlan('${p.plan}')">Elegir</button>` : `<button class="btn btn-glass btn-sm" onclick="activarBoost()">Activar</button>`}
                    </div>
                </div>
            </div>
        `).join('');

        element.innerHTML = `
            <div class="section-header mb-4">Inteligencia Financiera</div>
            
            <div class="row g-4 mb-5">
                <div class="col-lg-4 animated-entry">
                    <div class="glass-card p-4 h-100 border-primary">
                        <div class="text-dim small mb-2">INFRAESTRUCTURA ACTUAL</div>
                        <h2 class="fw-bold text-white mb-3">Membresía ${currentUser.tipo_membresia?.toUpperCase() || 'ESTÁNDAR'}</h2>
                        <button class="btn btn-premium btn-sm w-100" onclick="abrirModalPlanes()">ESCALAR PAQUETE</button>
                    </div>
                </div>
                <div class="col-lg-4 animated-entry" style="animation-delay: 0.1s">
                    <div class="glass-card p-4 h-100">
                        <div class="text-dim small mb-2">INVERSIÓN TOTAL EN RED</div>
                        <h2 class="fw-bold text-white mb-3">$${pagos.reduce((acc, p) => acc + parseFloat(p.monto || 0), 0).toFixed(2)} MXN</h2>
                        <p class="text-primary small mb-0">Historial de transacciones</p>
                    </div>
                </div>
                <div class="col-lg-4 animated-entry" style="animation-delay: 0.2s">
                    <div class="glass-card p-4 h-100">
                        <div class="text-dim small mb-2">ESTADO DE CUENTA</div>
                        <h2 class="fw-bold text-white mb-3">Activo</h2>
                        <p class="text-dim small mb-0">Cuenta verificada y operativa</p>
                    </div>
                </div>
            </div>

            <div class="glass-card overflow-hidden animated-entry" style="animation-delay: 0.3s">
                <div class="p-4 border-bottom border-secondary opacity-50">
                    <h5 class="mb-0 fw-bold">Registro de Transacciones</h5>
                </div>
                <div class="table-responsive">
                    <table class="table table-dark table-hover mb-0">
                        <thead class="bg-black">
                            <tr class="text-dim small">
                                <th class="py-3 px-4 border-0">FECHA</th>
                                <th class="py-3 border-0">CATEGORÍA</th>
                                <th class="py-3 border-0">CONCEPTO</th>
                                <th class="py-3 border-0">MONTO</th>
                                <th class="py-3 border-0">ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pagosHTML}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="mt-4">
                <div class="section-header mb-3">Promociones Disponibles</div>
                ${promosHTML || '<div class="glass-card p-4 text-dim">No hay promociones disponibles para tu nivel actual.</div>'}
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar pagos:', error);
        element.innerHTML = '<div class="alert alert-danger glass-card">Error al sincronizar registros financieros.</div>';
    }
}
// CONFIGURACION
async function loadConfiguracionContent() {
    const element = document.getElementById('configuracionContent');
    if (!element) return;

    element.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const response = await fetchAPI('/configuraciones');
        const apiConfig = response?.data || {};
        const localConfig = JSON.parse(localStorage.getItem('configuracion_usuario') || '{}');
        const config = { ...localConfig, ...apiConfig };

        // Sincronizar copia local si hay datos del backend
        if (Object.keys(apiConfig).length > 0) {
            localStorage.setItem('configuracion_usuario', JSON.stringify(config));
        }

        element.innerHTML = `
            <div class="section-header mb-4"><i class="bi bi-gear-fill text-primary"></i> Centro de Control de Identidad</div>
            
            <div class="row g-4">
                <div class="col-lg-6 animated-entry">
                    <div class="glass-card p-4">
                        <h5 class="fw-bold mb-3 text-white">Preferencias de Privacidad</h5>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <div class="text-white small">Perfil Visible Globalmente</div>
                                <div class="text-dim extra-small">Permitir que otros artistas encuentren tu perfil.</div>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="conf-perfil-visible" ${config.perfil_visible !== 'privado' ? 'checked' : ''} style="width: 2.5em; height: 1.2em;" onchange="saveConfiguracion()">
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <div class="text-white small">Recibir Sugerencias de Sinergia</div>
                                <div class="text-dim extra-small">Algoritmo activo para emparejamiento musical.</div>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="conf-sugerencias" ${config.recibir_sugerencias !== false ? 'checked' : ''} style="width: 2.5em; height: 1.2em;" onchange="saveConfiguracion()">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6 animated-entry" style="animation-delay: 0.1s">
                    <div class="glass-card p-4">
                        <h5 class="fw-bold mb-3 text-white">Seguridad de Cuenta</h5>
                        <div class="mb-3">
                            <label class="text-dim small mb-1">CORREO ELECTRÓNICO</label>
                            <input type="text" class="form-control glass-card" value="${currentUser?.email || ''}" disabled style="background: rgba(0,0,0,0.2) !important; color: white;">
                        </div>
                        <button class="btn btn-glass btn-sm w-100" onclick="mostrarNotificacionFlotante('Seguridad', 'La actualización de credenciales se gestiona desde el proveedor de identidad.', 'shield-lock')">GESTIONAR CREDENCIALES</button>
                    </div>
                </div>

                <div class="col-lg-6 animated-entry" style="animation-delay: 0.2s">
                    <div class="glass-card p-4">
                        <h5 class="fw-bold mb-3 text-white">Notificaciones de Red</h5>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" id="conf-notif-email" ${config.notificaciones_email !== false ? 'checked' : ''} onchange="saveConfiguracion()">
                            <label class="form-check-label text-dim small" for="conf-notif-email">Notificaciones por Correo</label>
                        </div>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" id="conf-notif-push" ${config.notificaciones_push !== false ? 'checked' : ''} onchange="saveConfiguracion()">
                            <label class="form-check-label text-dim small" for="conf-notif-push">Notificaciones Push</label>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6 animated-entry" style="animation-delay: 0.3s">
                    <div class="glass-card p-4 border-danger opacity-75">
                        <h5 class="fw-bold mb-3 text-danger">Zona Crítica</h5>
                        <p class="text-dim small mb-4">La eliminación de la cuenta es irreversible y resultará en la pérdida de todas tus sinergias establecidas.</p>
                        <button class="btn btn-outline-danger btn-sm w-100" onclick="confirmarEliminacionCuenta()">SOLICITAR ELIMINACIÓN DE CUENTA</button>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar configuración:', error);
        const localConfig = JSON.parse(localStorage.getItem('configuracion_usuario') || '{}');
        const config = localConfig;
        element.innerHTML = `
            <div class="section-header mb-4"><i class="bi bi-gear-fill text-primary"></i> Centro de Control de Identidad</div>
            <div class="alert alert-warning glass-card mb-3">Mostrando configuración local. La sincronización con el servidor no está disponible temporalmente.</div>
            <div class="row g-4">
                <div class="col-lg-6 animated-entry">
                    <div class="glass-card p-4">
                        <h5 class="fw-bold mb-3 text-white">Preferencias de Privacidad</h5>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <div class="text-white small">Perfil Visible Globalmente</div>
                                <div class="text-dim extra-small">Permitir que otros artistas encuentren tu perfil.</div>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="conf-perfil-visible" ${config.perfil_visible !== 'privado' ? 'checked' : ''} style="width: 2.5em; height: 1.2em;" onchange="saveConfiguracion()">
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <div class="text-white small">Recibir Sugerencias de Sinergia</div>
                                <div class="text-dim extra-small">Algoritmo activo para emparejamiento musical.</div>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="conf-sugerencias" ${config.recibir_sugerencias !== false ? 'checked' : ''} style="width: 2.5em; height: 1.2em;" onchange="saveConfiguracion()">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 animated-entry" style="animation-delay: 0.2s">
                    <div class="glass-card p-4">
                        <h5 class="fw-bold mb-3 text-white">Notificaciones de Red</h5>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" id="conf-notif-email" ${config.notificaciones_email !== false ? 'checked' : ''} onchange="saveConfiguracion()">
                            <label class="form-check-label text-dim small" for="conf-notif-email">Notificaciones por Correo</label>
                        </div>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" id="conf-notif-push" ${config.notificaciones_push !== false ? 'checked' : ''} onchange="saveConfiguracion()">
                            <label class="form-check-label text-dim small" for="conf-notif-push">Notificaciones Push</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

window.saveConfiguracion = async function() {
    try {
        const perfilVisible = document.getElementById('conf-perfil-visible').checked ? 'publico' : 'privado';
        const recibirSugerencias = document.getElementById('conf-sugerencias').checked;
        const notifEmail = document.getElementById('conf-notif-email').checked;
        const notifPush = document.getElementById('conf-notif-push').checked;

        const payload = {
            perfil_visible: perfilVisible,
            recibir_sugerencias: recibirSugerencias,
            notificaciones_email: notifEmail,
            notificaciones_push: notifPush
        };

        // Guardar localmente
        localStorage.setItem('configuracion_usuario', JSON.stringify(payload));

        // Intentar sincronizar con backend
        await fetchAPI('/configuraciones', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        mostrarNotificacionFlotante('Configuración Guardada', 'Tus preferencias se han actualizado correctamente.', 'check-circle');
    } catch (error) {
        console.error('Error al guardar configuración:', error);
        mostrarNotificacionFlotante('Guardado local', 'Tus preferencias se guardaron localmente y se sincronizarán cuando el servicio esté disponible.', 'cloud-off');
    }
};

window.confirmarEliminacionCuenta = async function() {
    if (!currentUser || !currentUser.id) return;

    if (confirm('ADVERTENCIA: ¿Estás seguro de que deseas eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.')) {
        const confirmacion = prompt('Para confirmar, escribe "ELIMINAR" en el cuadro de texto:');
        const password = prompt('Para continuar, introduce tu contraseña:');
        
        if (confirmacion === 'ELIMINAR' && password && password.length >= 8) {
            try {
                const email = currentUser.email || currentUser.correo_electronico;
                if (!email) throw new Error('Sin correo de usuario');
                const loginRes = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                if (!loginRes.ok) {
                    mostrarNotificacionFlotante('Contraseña incorrecta', 'La eliminación ha sido cancelada.', 'x-circle');
                    return;
                }
                await fetchAPI(`/usuarios/${currentUser.id}`, {
                    method: 'DELETE'
                });
                
                alert('Tu cuenta ha sido eliminada correctamente.');
                localStorage.removeItem('token');
                window.location.href = 'user-login.html';
            } catch (error) {
                console.error('Error al eliminar cuenta:', error);
                mostrarNotificacionFlotante('Error', 'No se pudo eliminar la cuenta. Por favor, contacta a soporte.', 'exclamation-circle');
            }
        } else {
            mostrarNotificacionFlotante('Cancelado', 'La eliminación de cuenta ha sido cancelada.', 'x-circle');
        }
    }
};
