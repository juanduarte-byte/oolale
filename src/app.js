const express = require('express');
const path = require('path');
const session = require('express-session');
const morgan = require('morgan');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Configuración de Motor de Plantillas
app.use(expressLayouts);
app.set('layout', 'layout'); // busca views/layout.ejs por defecto
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sesiones (para Admin)
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true en HTTPS
        maxAge: 3600000 // 1 hora
    }
}));

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
