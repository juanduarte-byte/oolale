const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// --- CONFIGURACIÓN DE PERFORMANCE Y SEGURIDAD ---

// 1. Caché (TTL: 5 minutos)
const cache = new NodeCache({ stdTTL: 300 });

// 2. Rate Limiter para Login (Max 5 intentos por 15 min)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de inicio de sesión. Por favor, inténtelo de nuevo en 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});

// 3. Middlewares de Seguridad Básica
// Nota: Deshabilitamos CSP por scripts inline existentes
router.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Middleware de Autenticación Admin
const isAdmin = (req, res, next) => {
    if (req.session.adminUser) {
        return next();
    }
    res.redirect('/admin/login');
};

// GET Raíz Admin (Redirige a Login o Dashboard)
router.get('/', (req, res) => {
    if (req.session && req.session.adminUser) {
        return res.redirect('/admin/dashboard');
    }
    res.redirect('/admin/login');
});

// GET Login
router.get('/login', (req, res) => {
    res.render('admin/login', {
        title: 'Admin Login - Óolale',
        layout: 'admin_layout'
    });
});

// POST Login (Protegido con Rate Limit)
router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar admin en tabla admin_users
        const { data: user, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            console.log('[AUTH] Login failed for:', email, '- User not found');
            return res.redirect('/admin/login?error=invalid');
        }

        // Verificar contraseña con bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            console.log('[AUTH] Login failed for:', email, '- Invalid password');
            return res.redirect('/admin/login?error=invalid');
        }

        // Crear sesión
        req.session.adminUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'admin'
        };

        // Audit Log
        console.log(`[AUDIT] Admin ${email} logged in at ${new Date().toISOString()}`);

        // Registrar último acceso
        await supabase
            .from('admin_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        return res.redirect('/admin/dashboard');
    } catch (e) {
        console.error('[AUTH ERROR]:', e);
        res.redirect('/admin/login?error=server');
    }
});

// GET Change Password
router.get('/profile/change-password', isAdmin, (req, res) => {
    res.render('admin/change_password', {
        title: 'Cambiar Contraseña',
        user: req.session.adminUser,
        layout: 'admin_layout'
    });
});

// POST Change Password
router.post('/profile/change-password', isAdmin, async (req, res) => {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.session.adminUser.id;

    try {
        // Obtener admin actual
        const { data: user } = await supabase
            .from('admin_users')
            .select('password_hash')
            .eq('id', userId)
            .single();

        // Verificar contraseña actual con bcrypt
        const passwordMatch = await bcrypt.compare(current_password, user.password_hash);

        if (!passwordMatch) {
            return res.redirect('/admin/profile/change-password?error=incorrect');
        }

        // Verificar que las nuevas coincidan
        if (new_password !== confirm_password) {
            return res.redirect('/admin/profile/change-password?error=mismatch');
        }

        // Validar longitud mínima
        if (new_password.length < 6) {
            return res.redirect('/admin/profile/change-password?error=short');
        }

        // Hashear nueva contraseña con bcrypt
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Actualizar contraseña
        await supabase
            .from('admin_users')
            .update({ password_hash: hashedPassword })
            .eq('id', userId);

        console.log(`[AUDIT] Admin ${req.session.adminUser.email} changed password at ${new Date().toISOString()}`);

        res.redirect('/admin/profile/change-password?success=true');
    } catch (e) {
        console.error('Change Password Error:', e);
        res.redirect('/admin/profile/change-password?error=server');
    }
});

// GET Dashboard (Optimizado con Caché)
router.get('/dashboard', isAdmin, async (req, res) => {
    let stats, recentReports;

    // Intentar obtener de caché
    const cachedData = cache.get('dashboard_data');
    if (cachedData) {
        console.log('[CACHE] Hit for dashboard data');
        ({ stats, recentReports } = cachedData);
    } else {
        console.log('[CACHE] Miss for dashboard data - Fetching from DB');
        let userCount = 0;
        let pendingReportsCount = 0;
        recentReports = [];

        try {
            // Fetch real user count from perfiles
            const { count, error } = await supabase
                .from('perfiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            if (!error) userCount = count || 0;

            // Fetch real recent reports from reportes
            const { data: reps, error: repErr } = await supabase
                .from('reportes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (!repErr && reps) {
                recentReports = reps.map(r => ({
                    id: r.id,
                    tipo: r.categoria || 'General',
                    status: r.estatus === 'pendiente' ? 'Pendiente' : 'Resuelto',
                    created_at: r.created_at
                }));
            }

            // Count pending reports
            const { count: pendCount } = await supabase
                .from('reportes')
                .select('*', { count: 'exact', head: true })
                .eq('estatus', 'pendiente');
            pendingReportsCount = pendCount || 0;

        } catch (e) {
            console.error('Connection Error:', e);
        }

        stats = {
            users: userCount,
            revenue: Math.floor(userCount * 0.15) * 99,
            activeNow: Math.floor(userCount * 0.05) + 5,
            pendingReports: pendingReportsCount
        };

        // Guardar en caché
        cache.set('dashboard_data', { stats, recentReports });
    }

    res.render('admin/dashboard', {
        title: 'Panel de Control - Óolale Admin',
        user: req.session.adminUser,
        stats,
        recentReports,
        layout: 'admin_layout'
    });
});


/* =========================================
   🛡️ GESTIÓN DE REPORTES (MODERACIÓN)
   ========================================= */
router.get('/reportes', isAdmin, async (req, res) => {
    let reportes = [];

    try {
        // Traer reportes con datos de usuarios
        const { data, error } = await supabase
            .from('reportes')
            .select(`
                *,
                reportado:perfiles!usuario_reportado_id(nombre_artistico, email),
                reportante:perfiles!reportante_id(nombre_artistico)
            `)
            .order('created_at', { ascending: false });

        if (!error) reportes = data;
        else console.error("Error fetching reports:", error);

    } catch (e) {
        console.error('Error reportes:', e);
    }

    res.render('admin/reports', {
        title: 'Moderación de Reportes',
        user: req.session.adminUser,
        reportes,
        layout: 'admin_layout'
    });
});

router.post('/reportes/resolver', isAdmin, async (req, res) => {
    const { id_reporte, accion, nota_admin } = req.body;
    // accion: 'descartar', 'advertencia', 'banear'

    try {
        let estadoNuevo = 'resuelto';

        // 1. Actualizar Reporte
        await supabase
            .from('reportes')
            .update({
                estatus: estadoNuevo
            })
            .eq('id', id_reporte);

        // 2. Ejecutar castigo si aplica
        if (accion === 'banear') {
            const { data: rep } = await supabase.from('reportes').select('usuario_reportado_id').eq('id', id_reporte).single();
            if (rep) {
                // Desactivar usuario
                await supabase.from('perfiles').update({ is_active: false }).eq('id', rep.usuario_reportado_id);
                await logAdminAction(req.session.adminUser.id, 'BAN_USER', 'perfiles', rep.usuario_reportado_id, { motivo: 'Reporte validado', reporte: id_reporte });
            }
        }

        await logAdminAction(req.session.adminUser.id, 'RESOLVE_REPORT', 'reportes', id_reporte, { accion, nota: nota_admin });

        res.redirect('/admin/reportes?success=Reporte resuelto correctamente');
    } catch (e) {
        res.redirect('/admin/reportes?error=Error al resolver reporte');
    }
});

// GET Users List (CRUD)
router.get('/users', isAdmin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const search = req.query.search || '';

    let users = [];
    let total = 0;

    try {
        let query = supabase
            .from('perfiles')
            .select('*', { count: 'exact' });

        // Lógica de Búsqueda
        if (search) {
            query = query.or(`nombre_artistico.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data, count, error } = await query
            .range(from, to)
            .order('created_at', { ascending: false });

        if (!error) {
            users = data;
            total = count;
        } else {
            console.error('Supabase Error fetching users:', error);
        }
    } catch (e) {
        console.error('Error fetching users:', e);
    }

    res.render('admin/users', {
        title: 'Gestión de Usuarios - Óolale',
        user: req.session.adminUser,
        users,
        searchTerm: search, // Para mantener el texto en el input
        pagination: {
            page,
            totalPages: Math.ceil(total / limit),
            totalItems: total
        },
        layout: 'admin_layout'
    });
});

// Importar Modelo Usuario para creación
const UsuarioModel = require('../models/Usuario');

// Crear Usuario (Vista)
router.get('/users/create', isAdmin, (req, res) => {
    res.render('admin/user_form', {
        title: 'Crear Usuario',
        user: req.session.adminUser,
        layout: 'admin_layout'
    });
});

// Crear Perfil (Acción) — crea un perfil (sin auth, solo datos)
router.post('/users/create', isAdmin, async (req, res) => {
    try {
        const { nombre_artistico, email, rol_principal, ubicacion } = req.body;

        const { error } = await supabase.from('perfiles').insert([{
            nombre_artistico,
            email,
            rol_principal: rol_principal || 'musico',
            ubicacion: ubicacion || '',
            created_at: new Date().toISOString(),
            is_active: true
        }]);

        if (error) throw error;

        console.log(`[AUDIT] Admin ${req.session.adminUser.email} created profile ${email}`);

        res.redirect('/admin/users');
    } catch (e) {
        console.error('Error creating user:', e);
        res.redirect('/admin/users/create?error=' + encodeURIComponent(e.message));
    }
});

// Editar Usuario (Vista)
router.get('/users/edit/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: editUser, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !editUser) return res.redirect('/admin/users');

        res.render('admin/user_edit', {
            title: 'Editar Usuario',
            user: req.session.adminUser,
            editUser,
            layout: 'admin_layout'
        });
    } catch (e) {
        res.redirect('/admin/users');
    }
});

// Editar Usuario (Acción)
router.post('/users/edit/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_artistico, email, ranking_tipo, rol_principal, ubicacion } = req.body;

        const { error } = await supabase
            .from('perfiles')
            .update({
                nombre_artistico,
                email,
                ranking_tipo: ranking_tipo || 'regular',
                rol_principal: rol_principal || 'musico',
                ubicacion
            })
            .eq('id', id);

        if (error) throw error;
        res.redirect('/admin/users');
    } catch (e) {
        console.error('Update User Error:', e);
        res.redirect(`/admin/users/edit/${req.params.id}?error=true`);
    }
});

// Eliminar Usuario (soft-delete)
router.post('/users/delete/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await supabase.from('perfiles').update({ is_active: false, deleted_at: new Date().toISOString() }).eq('id', id);
        await logAdminAction(req.session.adminUser.id, 'DELETE_USER', 'perfiles', id);
        res.redirect('/admin/users');
    } catch (e) {
        console.error('Delete User Error:', e);
        res.redirect('/admin/users');
    }
});

// --- NUEVAS RUTAS DE CATÁLOGOS (Autogeneradas con Paginación) ---
// (Las rutas manuales han sido reemplazadas por createPlaceholderRoute para soportar búsqueda y paginación)

// Ruta Genérica de Exportación CSV
router.get('/:entity/export', isAdmin, async (req, res) => {
    const { entity } = req.params;
    const search = req.query.search || '';

    const tableMap = {
        'users': { table: 'perfiles', fields: ['id', 'nombre_artistico', 'email', 'created_at'] },
        'genres': { table: 'generos_perfil', fields: ['id', 'profile_id', 'genre', 'created_at'] },
        'events': { table: 'eventos', fields: ['id', 'titulo_bolo', 'fecha_gig', 'lugar_nombre', 'estatus_bolo'] },
        'payments': { table: 'tickets_pagos', fields: ['id', 'monto_total', 'estatus', 'pasarela', 'created_at'] },
        'reports': { table: 'reportes', fields: ['id', 'categoria', 'estatus', 'created_at'] }
    };

    const config = tableMap[entity];
    if (!config) return res.status(404).send('Entity not found');

    try {
        let query = supabase.from(config.table).select('*');

        // Aplicar búsqueda si existe
        if (search) {
            if (config.table === 'perfiles') {
                query = query.or(`nombre_artistico.ilike.%${search}%,email.ilike.%${search}%`);
            } else if (config.table === 'eventos') {
                query = query.ilike('titulo_bolo', `%${search}%`);
            }
        }

        const { data, error } = await query.limit(1000); // Máximo 1000 registros
        if (error) throw error;

        // Generar CSV
        let csv = config.fields.join(',') + '\n';
        data.forEach(row => {
            const values = config.fields.map(field => {
                const val = row[field] || '';
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            csv += values.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${entity}_export_${Date.now()}.csv"`);
        res.send('\uFEFF' + csv); // BOM para Excel
    } catch (e) {
        console.error('Export Error:', e);
        res.status(500).send('Error generating CSV');
    }
});

// Generic Delete (Para catálogos simples)
router.post('/:entity/delete/:id', isAdmin, async (req, res) => {
    const { entity, id } = req.params;
    // Map URL param to Table Name
    const tableMap = {
        'genres': 'generos_perfil',
        'references': 'referencias',
        'events': 'eventos',
        'payments': 'tickets_pagos',
        'contracts': 'contrataciones'
    };

    const tableName = tableMap[entity];
    if (!tableName) return res.redirect('/admin/dashboard');

    await supabase.from(tableName).delete().eq('id', id);
    res.redirect(`/admin/${entity}`);
});

// --- RUTAS PLACEHOLDER (Para completar estructura) ---

const createPlaceholderRoute = (path, title, entity, tableName) => {
    router.get(path, isAdmin, async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        const search = req.query.search || '';

        // Filtros Avanzados
        const filters = {
            fecha_desde: req.query.fecha_desde || '',
            fecha_hasta: req.query.fecha_hasta || '',
            estatus: req.query.estatus || ''
        };

        let items = [];
        let total = 0;

        try {
            if (tableName) {
                let query = supabase.from(tableName).select('*', { count: 'exact' });

                // Búsqueda Dinámica
                if (search) {
                    if (tableName === 'tickets_pagos') {
                        query = query.or(`estatus.ilike.%${search}%,pasarela.ilike.%${search}%`);
                    } else if (tableName === 'eventos') {
                        query = query.ilike('titulo_bolo', `%${search}%`);
                    } else if (tableName === 'reportes') {
                        query = query.ilike('categoria', `%${search}%`);
                    } else if (tableName === 'referencias') {
                        query = query.ilike('comentario', `%${search}%`);
                    } else if (tableName === 'perfiles') {
                        query = query.or(`nombre_artistico.ilike.%${search}%,email.ilike.%${search}%`);
                    } else {
                        // Default
                        query = query.ilike('genre', `%${search}%`);
                    }
                }

                // Filtros por Fecha (Eventos)
                if (tableName === 'eventos') {
                    if (filters.fecha_desde) {
                        query = query.gte('fecha_gig', filters.fecha_desde);
                    }
                    if (filters.fecha_hasta) {
                        query = query.lte('fecha_gig', filters.fecha_hasta);
                    }
                }

                // Filtros por Estado (Pagos, Reportes)
                if (tableName === 'tickets_pagos' && filters.estatus) {
                    query = query.eq('estatus', filters.estatus);
                }
                if (tableName === 'reportes' && filters.estatus) {
                    query = query.eq('estatus', filters.estatus);
                }

                const { data, count, error } = await query
                    .range(from, to)
                    .order(tableName === 'eventos' ? 'fecha_gig' : 'id', { ascending: false });

                if (!error) {
                    items = data;
                    total = count;
                }
            }
        } catch (e) {
            console.error(`Error loading ${title}:`, e);
        }

        res.render('admin/catalog', {
            title: title,
            entity: entity,
            items: items || [],
            basePath: `/admin${path}`,
            searchTerm: search,
            filters,
            pagination: {
                page,
                totalPages: Math.ceil(total / limit),
                totalItems: total
            },
            layout: 'admin_layout'
        });
    });
};

// Función para crear CRUD completo de catálogos
const createCatalogCRUD = (path, title, entity, tableName, fields = ['nombre', 'descripcion']) => {
    // Listar (ya existe con createPlaceholderRoute)
    createPlaceholderRoute(path, title, entity, tableName);

    // Crear (Vista)
    router.get(`${path}/create`, isAdmin, (req, res) => {
        res.render('admin/catalog_form', {
            title: `Crear ${entity}`,
            entity,
            mode: 'create',
            item: {},
            fields,
            formAction: `/admin${path}/create`,
            backPath: `/admin${path}`,
            layout: 'admin_layout'
        });
    });

    // Crear (Acción)
    router.post(`${path}/create`, isAdmin, async (req, res) => {
        try {
            const insertData = {};
            fields.forEach(field => {
                if (req.body[field]) insertData[field] = req.body[field];
            });

            await supabase.from(tableName).insert([insertData]);
            res.redirect(`/admin${path}`);
        } catch (e) {
            console.error('Create Error:', e);
            res.redirect(`/admin${path}/create?error=true`);
        }
    });

    // Editar (Vista)
    router.get(`${path}/edit/:id`, isAdmin, async (req, res) => {
        try {
            const { data: item } = await supabase.from(tableName).select('*').eq('id', req.params.id).single();
            if (!item) return res.redirect(`/admin${path}`);

            res.render('admin/catalog_form', {
                title: `Editar ${entity}`,
                entity,
                mode: 'edit',
                item,
                fields,
                formAction: `/admin${path}/edit/${req.params.id}`,
                backPath: `/admin${path}`,
                layout: 'admin_layout'
            });
        } catch (e) {
            res.redirect(`/admin${path}`);
        }
    });

    // Editar (Acción)
    router.post(`${path}/edit/:id`, isAdmin, async (req, res) => {
        try {
            const updateData = {};
            fields.forEach(field => {
                if (req.body[field] !== undefined) updateData[field] = req.body[field];
            });

            await supabase.from(tableName).update(updateData).eq('id', req.params.id);
            res.redirect(`/admin${path}`);
        } catch (e) {
            console.error('Update Error:', e);
            res.redirect(`/admin${path}/edit/${req.params.id}?error=true`);
        }
    });

    // Eliminar
    router.post(`${path}/delete/:id`, isAdmin, async (req, res) => {
        try {
            await supabase.from(tableName).delete().eq('id', req.params.id);
            res.redirect(`/admin${path}`);
        } catch (e) {
            console.error('Delete Error:', e);
            res.redirect(`/admin${path}`);
        }
    });
};

// Comunidad
createPlaceholderRoute('/profiles', 'Perfiles', 'Perfil', 'perfiles');
createPlaceholderRoute('/connections', 'Conexiones', 'Conexión', 'conexiones');

// Moderación
createPlaceholderRoute('/reports', 'Reportes', 'Reporte', 'reportes');
createPlaceholderRoute('/messages', 'Mensajes', 'Mensaje', 'conversaciones');
createPlaceholderRoute('/samples', 'Muestras', 'Muestra', 'archivos_multimedia');

// Contenido
createPlaceholderRoute('/events', 'Eventos', 'Evento', 'eventos');

// Negocio
createPlaceholderRoute('/payments', 'Pagos', 'Pago', 'tickets_pagos');
createPlaceholderRoute('/contracts', 'Colaboraciones', 'Colaboración', 'contrataciones');

// Sistema
createPlaceholderRoute('/notifications', 'Notificaciones', 'Notificación', 'notificaciones');

// Catálogos Básicos (Con CRUD Completo)
createCatalogCRUD('/genres', 'Géneros Musicales', 'Género', 'generos_perfil', ['genre']);
createCatalogCRUD('/references', 'Reseñas', 'Reseña', 'referencias', ['comentario', 'puntuacion']);

router.get('/settings', isAdmin, (req, res) => {
    res.render('admin/dashboard', {
        title: 'Configuración',
        user: req.session.adminUser,
        stats: { users: 0, revenue: 0, activeNow: 0, pendingReports: 0 },
        recentUsers: [],
        layout: 'admin_layout'
    });
});


// --- SISTEMA DE NOTAS ADMINISTRATIVAS ---

// Función helper para audit log
async function logAdminAction(adminId, accion, entidad, idEntidad = null, detalles = {}) {
    try {
        await supabase.from('audit_log').insert([{
            id_admin: adminId,
            accion,
            entidad,
            id_entidad: String(idEntidad),
            detalles,
            fecha: new Date().toISOString()
        }]);
        console.log(`[AUDIT] ${accion} on ${entidad} by admin ${adminId}`);
    } catch (e) {
        console.error('Audit Log Error:', e);
    }
}

// GET Notas
router.get('/notes', isAdmin, async (req, res) => {
    const search = req.query.search || '';
    const prioridad = req.query.prioridad || '';

    try {
        let query = supabase
            .from('admin_notes')
            .select(`
                *,
                autor:admin_users!id_admin_autor (
                    name
                )
            `)
            .order('fecha_creacion', { ascending: false });

        if (search) {
            query = query.or(`titulo.ilike.%${search}%,contenido.ilike.%${search}%`);
        }

        if (prioridad) {
            query = query.eq('prioridad', prioridad);
        }

        const { data, error } = await query;

        const notes = data?.map(note => ({
            ...note,
            autor_nombre: note.autor?.name || 'Admin'
        })) || [];

        res.render('admin/notes', {
            title: 'Notas Internas',
            user: req.session.adminUser,
            notes,
            searchTerm: search,
            filters: { prioridad },
            layout: 'admin_layout'
        });
    } catch (e) {
        console.error('Notes Error:', e);
        res.render('admin/notes', {
            title: 'Notas Internas',
            user: req.session.adminUser,
            notes: [],
            searchTerm: '',
            filters: {},
            layout: 'admin_layout'
        });
    }
});

// GET Create Note
router.get('/notes/create', isAdmin, (req, res) => {
    res.render('admin/note_form', {
        title: 'Nueva Nota',
        user: req.session.adminUser,
        mode: 'create',
        note: {},
        formAction: '/admin/notes/create',
        layout: 'admin_layout'
    });
});

// POST Create Note
router.post('/notes/create', isAdmin, async (req, res) => {
    const { titulo, contenido, prioridad } = req.body;

    try {
        const { data, error } = await supabase.from('admin_notes').insert([{
            id_admin_autor: req.session.adminUser.id,
            titulo,
            contenido,
            prioridad
        }]).select();

        if (!error && data) {
            await logAdminAction(req.session.adminUser.id, 'CREATE', 'admin_notes', data[0].id, { titulo });
        }

        res.redirect('/admin/notes');
    } catch (e) {
        console.error('Create Note Error:', e);
        res.redirect('/admin/notes/create');
    }
});

// GET Edit Note
router.get('/notes/edit/:id', isAdmin, async (req, res) => {
    try {
        const { data: note } = await supabase
            .from('admin_notes')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (!note) return res.redirect('/admin/notes');

        res.render('admin/note_form', {
            title: 'Editar Nota',
            user: req.session.adminUser,
            mode: 'edit',
            note,
            formAction: `/admin/notes/edit/${req.params.id}`,
            layout: 'admin_layout'
        });
    } catch (e) {
        res.redirect('/admin/notes');
    }
});

// POST Edit Note
router.post('/notes/edit/:id', isAdmin, async (req, res) => {
    const { titulo, contenido, prioridad } = req.body;

    try {
        await supabase.from('admin_notes').update({
            titulo,
            contenido,
            prioridad,
            fecha_actualizacion: new Date().toISOString()
        }).eq('id', req.params.id);

        await logAdminAction(req.session.adminUser.id, 'UPDATE', 'admin_notes', req.params.id, { titulo });

        res.redirect('/admin/notes');
    } catch (e) {
        console.error('Update Note Error:', e);
        res.redirect(`/admin/notes/edit/${req.params.id}`);
    }
});

// POST Delete Note
router.post('/notes/delete/:id', isAdmin, async (req, res) => {
    try {
        await supabase.from('admin_notes').delete().eq('id', req.params.id);
        await logAdminAction(req.session.adminUser.id, 'DELETE', 'admin_notes', req.params.id);
        res.redirect('/admin/notes');
    } catch (e) {
        console.error('Delete Note Error:', e);
        res.redirect('/admin/notes');
    }
});

// GET Audit Log
router.get('/audit-log', isAdmin, async (req, res) => {
    try {
        const { data: logs } = await supabase
            .from('audit_log')
            .select(`
                *,
                admin:admin_users!id_admin (
                    name,
                    email
                )
            `)
            .order('fecha', { ascending: false })
            .limit(100);

        const formattedLogs = logs?.map(log => ({
            ...log,
            admin_nombre: log.admin?.name || 'Admin',
            admin_email: log.admin?.email || ''
        })) || [];

        res.render('admin/audit_log', {
            title: 'Historial de Actividad',
            user: req.session.adminUser,
            logs: formattedLogs,
            layout: 'admin_layout'
        });
    } catch (e) {
        console.error('Audit Log Error:', e);
        res.render('admin/audit_log', {
            title: 'Historial de Actividad',
            user: req.session.adminUser,
            logs: [],
            layout: 'admin_layout'
        });
    }
});


// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

module.exports = router;
