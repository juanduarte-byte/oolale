const express = require('express');
const path = require('path');
const session = require('express-session');
const morgan = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';

// Configuración de Motor de Plantillas
app.use(expressLayouts);
app.set('layout', 'layout'); // busca views/layout.ejs por defecto
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS — solo para rutas /api (app móvil)
app.use('/api', cors({
    origin: isProduction
        ? (process.env.CORS_ORIGIN || 'https://tudominio.com')
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Sesiones (para Admin)
app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,    // true solo con HTTPS en producción
        httpOnly: true,          // impide acceso desde JavaScript del cliente
        sameSite: 'lax',         // protección básica contra CSRF por cookies
        maxAge: 3600000          // 1 hora
    }
}));

// --- CSRF Protection (para formularios admin) ---
// Genera un token por sesión y lo valida en cada POST de /admin
app.use('/admin', (req, res, next) => {
    // Generar token si no existe en la sesión
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }

    // Hacer disponible en todas las vistas
    res.locals.csrfToken = req.session.csrfToken;

    // Validar en métodos que modifican datos
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const token = req.body._csrf;
        if (!token || token !== req.session.csrfToken) {
            console.warn(`[CSRF] Token inválido en ${req.method} ${req.originalUrl} desde IP ${req.ip}`);
            return res.status(403).send('Forbidden — Token CSRF inválido. <a href="/admin/login">Volver al login</a>');
        }
    }

    next();
});

// Variables locales globales
app.use((req, res, next) => {
    res.locals.user = req.session.adminUser;
    next();
});

// Rutas
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api'); // Agregado: Nuevas rutas API Móvil

app.use('/', indexRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes); // Agregado: Prefijo /api para la app móvil

// Error handler en producción (no muestra stack traces)
if (isProduction) {
    app.use((err, req, res, next) => {
        console.error('[ERROR]', err.message);
        res.status(500).send('Error interno del servidor');
    });
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
});
