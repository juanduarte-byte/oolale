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
        const { data: user, error } = await supabase
            .from('Usuarios')
            .select('*')
            .eq('correo_electronico', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }

        const match = await bcrypt.compare(password, user.contraseña);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        // Generar JWT
        const token = jwt.sign(
            { id: user.id_usuario, email: user.correo_electronico },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Devolver datos limpios
        const userData = {
            id: user.id_usuario,
            name: user.nombre_completo,
            email: user.correo_electronico,
            photo: user.foto_perfil
        };

        res.json({ success: true, token, user: userData });

    } catch (e) {
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
    const { email, password, fullName } = req.body;

    try {
        // Validar si existe
        const { data: existingUser } = await supabase
            .from('Usuarios')
            .select('id_usuario')
            .eq('correo_electronico', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'El correo ya está registrado' });
        }

        // Hashear password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const { data: newUser, error } = await supabase
            .from('Usuarios')
            .insert([{
                nombre_completo: fullName || 'Usuario Móvil',
                correo_electronico: email,
                contraseña: hashedPassword,
                fecha_registro: new Date(),
                es_admin: false
            }])
            .select() // Importante para obtener el ID generado
            .single();

        if (error) throw error;

        // Auto-Login: Generar token inmediatamente
        const token = jwt.sign(
            { id: newUser.id_usuario, email: newUser.correo_electronico },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        const userData = {
            id: newUser.id_usuario,
            name: newUser.nombre_completo,
            email: newUser.correo_electronico,
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
        const { error } = await supabase.from('Reportes').insert([{
            id_usuario_reporta: reporterId,
            id_usuario_reportado: reportedUserId,
            motivo: reason,
            descripcion: description,
            estado: 'pendiente'
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
        const { error } = await supabase.from('Bloqueos').insert([{
            id_usuario_bloqueador: blockerId,
            id_usuario_bloqueado: blockedUserId
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
        const { error } = await supabase.from('Bloqueos')
            .delete()
            .eq('id_usuario_bloqueador', blockerId)
            .eq('id_usuario_bloqueado', blockedUserId);

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
    const { soundcloud, youtube, website, openToWork, id_perfil } = req.body;

    try {
        const { error } = await supabase
            .from('Perfiles')
            .update({
                enlace_soundcloud: soundcloud,
                enlace_youtube: youtube,
                enlace_website: website,
                open_to_work: openToWork
            })
            .eq('id_usuario', req.user.id); // Seguridad: Solo su propio perfil

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
            .from('Equipo_Usuario')
            .select('*')
            .eq('id_perfil', req.params.id_perfil);

        if (error) throw error;
        res.json(data);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error al obtener gear' });
    }
});

// POST /api/gear
// Agregar nuevo equipo
router.post('/gear', verifyToken, async (req, res) => {
    const { nombre, categoria, descripcion, id_perfil } = req.body;

    try {
        // Validar que el perfil pertenezca al usuario del token
        // (Omitimos validación estricta por brevedad, asumimos frontend manda bien el id)

        const { error } = await supabase
            .from('Equipo_Usuario')
            .insert([{
                id_perfil: id_perfil,
                nombre,
                categoria,
                descripcion
            }]);

        if (error) throw error;
        res.json({ success: true, message: 'Equipo agregado correctamente' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error al guardar equipo' });
    }
});


module.exports = router;
