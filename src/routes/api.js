const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Secret para JWT (Debería ir en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_mobile_key_12345';

// Middleware para verificar Token JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ success: false, message: 'Token requerido' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Token inválido' });
        req.user = user; // Guardamos usuario en request
        next();
    });
};

/* =========================================
   🔑 AUTHENTICATION (Mobile)
   ========================================= */

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Autenticar con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError || !authData.user) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }

        // Obtener perfil del usuario
        const { data: profile } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        // Generar JWT propio para la app
        const token = jwt.sign(
            { id: authData.user.id, email: authData.user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        const userData = {
            id: authData.user.id,
            name: profile?.nombre_artistico || 'Usuario',
            email: authData.user.email,
            photo: profile?.foto_perfil || profile?.avatar_url || null
        };

        res.json({ success: true, token, user: userData });

    } catch (e) {
        console.error('API Login Error:', e);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
    const { email, password, fullName } = req.body;

    try {
        // Registrar con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                return res.status(400).json({ success: false, message: 'El correo ya está registrado' });
            }
            throw authError;
        }

        // Crear perfil en tabla perfiles
        const { data: newProfile, error: profileError } = await supabase
            .from('perfiles')
            .insert([{
                id: authData.user.id,
                nombre_artistico: fullName || 'Usuario Móvil',
                email: email,
                rol_principal: 'musico',
                is_active: true,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (profileError) console.error('Profile creation error:', profileError);

        // Auto-Login: Generar token
        const token = jwt.sign(
            { id: authData.user.id, email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        const userData = {
            id: authData.user.id,
            name: fullName || 'Usuario Móvil',
            email,
            photo: null
        };

        res.json({ success: true, token, user: userData, message: 'Registro exitoso' });

    } catch (e) {
        console.error('API Register Error:', e);
        res.status(500).json({ success: false, message: 'Error al registrar usuario' });
    }
});

/* =========================================
   🛡️ REPORTING & BLOCKING SYSTEM (Fase 5)
   ========================================= */

// POST /api/report
// Crear un reporte
router.post('/report', verifyToken, async (req, res) => {
    const { reportedUserId, reason, description } = req.body;
    const reporterId = req.user.id; // Del token

    try {
        const { error } = await supabase.from('reportes').insert([{
            reportante_id: reporterId,
            usuario_reportado_id: reportedUserId,
            categoria: reason,
            descripcion: description,
            estatus: 'pendiente'
        }]);

        if (error) throw error;

        res.json({ success: true, message: 'Reporte enviado correctamente' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error al crear reporte' });
    }
});

// POST /api/block
// Bloquear usuario
router.post('/block', verifyToken, async (req, res) => {
    const { blockedUserId } = req.body;
    const blockerId = req.user.id;

    try {
        const { error } = await supabase.from('usuarios_bloqueados').insert([{
            usuario_id: blockerId,
            bloqueado_id: blockedUserId,
            activo: true,
            created_at: new Date().toISOString()
        }]);

        if (error) {
            // Si ya existe, no es error grave
            if (error.code === '23505') return res.json({ success: true, message: 'Ya estaba bloqueado' });
            throw error;
        }

        res.json({ success: true, message: 'Usuario bloqueado' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error al bloquear' });
    }
});

// POST /api/unblock
// Desbloquear usuario
router.post('/unblock', verifyToken, async (req, res) => {
    const { blockedUserId } = req.body;
    const blockerId = req.user.id;

    try {
        const { error } = await supabase.from('usuarios_bloqueados')
            .update({ activo: false, desbloqueado_en: new Date().toISOString() })
            .eq('usuario_id', blockerId)
            .eq('bloqueado_id', blockedUserId)
            .eq('activo', true);

        if (error) throw error;

        res.json({ success: true, message: 'Usuario desbloqueado' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error al desbloquear' });
    }
});

/* =========================================
   🎒 GEAR & PROFILE PRO SYSTEM (Fase 2)
   ========================================= */

// PUT /api/profile/pro
// Actualizar enlaces y estado Open To Work
router.put('/profile/pro', verifyToken, async (req, res) => {
    const { soundcloud, youtube, website, openToWork } = req.body;

    try {
        const socialLinks = {};
        if (soundcloud) socialLinks.soundcloud = soundcloud;
        if (youtube) socialLinks.youtube = youtube;
        if (website) socialLinks.website = website;

        const { error } = await supabase
            .from('perfiles')
            .update({
                redes_sociales: socialLinks,
                open_to_work: openToWork
            })
            .eq('id', req.user.id); // Seguridad: Solo su propio perfil

        if (error) throw error;
        res.json({ success: true, message: 'Perfil Pro actualizado' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
    }
});

// GET /api/gear/:id_perfil
// Obtener equipo de un usuario
router.get('/gear/:id_perfil', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('perfil_gear')
            .select(`
                *,
                gear:gear_catalog!gear_id (nombre, familia)
            `)
            .eq('perfil_id', req.params.id_perfil);

        if (error) throw error;
        res.json(data);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error al obtener gear' });
    }
});

// POST /api/gear
// Agregar nuevo equipo
router.post('/gear', verifyToken, async (req, res) => {
    const { gear_id, notas } = req.body;

    try {
        const { error } = await supabase
            .from('perfil_gear')
            .insert([{
                perfil_id: req.user.id,
                gear_id
            }]);

        if (error) throw error;
        res.json({ success: true, message: 'Equipo agregado correctamente' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error al guardar equipo' });
    }
});


module.exports = router;
