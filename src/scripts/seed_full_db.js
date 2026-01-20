const supabase = require('../config/db');

async function seedFullDB() {
    console.log('🌱 Iniciando siembra de datos COMPLETA y REALISTA...');

    try {
        // 1. Obtener los usuarios recién creados para crearles perfiles y eventos
        const { data: users, error: userError } = await supabase.from('Usuarios').select('id_usuario, nombre_completo, correo_electronico');
        if (userError || !users.length) throw new Error('No hay usuarios. Ejecuta primero seed_users.js');

        const randomUser = () => users[Math.floor(Math.random() * users.length)];

        // 2. Poblar Géneros
        console.log('🎵 Insertando Géneros...');
        const genres = ['Rock', 'Jazz', 'Pop', 'Metal', 'Salsa', 'Reggaeton', 'Indie', 'Blues', 'Clásica', 'Trap'];
        for (const g of genres) {
            await supabase.from('Generos').insert([{ nombre: g, descripcion: `Música ${g} y subgéneros` }]).select();
        }

        // 3. Poblar Instrumentos
        console.log('🎷 Insertando Instrumentos...');
        const instruments = ['Guitarra Eléctrica', 'Batería', 'Bajo', 'Piano', 'Voz', 'Saxofón', 'Violín', 'Trompeta', 'Sintetizador'];
        for (const i of instruments) {
            await supabase.from('Instrumentos').insert([{ nombre: i, tipo: 'Varios' }]).select();
        }

        // 4. Crear Perfiles (Solo para algunos)
        console.log('👤 Creando Perfiles...');
        for (const user of users) {
            await supabase.from('Perfiles').insert([{
                id_usuario: user.id_usuario,
                bio: `Músico apasionado por el ${genres[Math.floor(Math.random() * genres.length)]}. Buscando banda.`,
                ubicacion: 'Ciudad de México, CDMX',
                experiencia: ['Principiante', 'Intermedio', 'Experto'][Math.floor(Math.random() * 3)],
                disponibilidad: 'Fines de semana'
            }]);
        }

        // 5. Crear Eventos (Conciertos, Jams)
        console.log('📅 Creando Eventos...');
        const eventTypes = ['concierto', 'jam_session', 'ensayo', 'taller'];
        for (let i = 0; i < 15; i++) {
            const host = randomUser();
            await supabase.from('Eventos').insert([{
                id_organizador: host.id_usuario,
                titulo: `Jam Session en ${host.nombre_completo}'s House`,
                descripcion: 'Trae tu instrumento y vamos a improvisar un rato. Chelas incluidas.',
                tipo: eventTypes[Math.floor(Math.random() * eventTypes.length)],
                fecha_evento: new Date(Date.now() + Math.random() * 10000000000).toISOString().split('T')[0], // Fechas futuras
                hora_evento: '20:00:00',
                ubicacion: 'Av. Insurgentes Sur 123, Roma Norte',
                estado: 'activo',
                visibilidad: 'publico',
                capacidad: 50
            }]);
        }

        // 6. Crear Pagos (Transacciones)
        console.log('💰 Generando Transacciones Financieras...');
        const gateways = ['paypal', 'stripe', 'mercadopago'];
        for (let i = 0; i < 20; i++) {
            const payer = randomUser();
            const status = Math.random() > 0.1 ? 'completado' : 'fallido'; // 90% éxito
            await supabase.from('Pagos').insert([{
                id_usuario: payer.id_usuario,
                monto: (Math.random() * 500 + 100).toFixed(2),
                moneda: 'MXN',
                metodo_pago: gateways[Math.floor(Math.random() * gateways.length)],
                estado: status,
                descripcion: 'Pago de Membresía Pro - Mensual',
                fecha_completado: status === 'completado' ? new Date() : null
            }]);
        }

        // 7. Crear Reportes (Moderación)
        console.log('🚩 Creando Reportes de Moderación...');
        const reasons = ['Spam', 'Acoso', 'Contenido Inapropiado', 'Fraude'];
        for (let i = 0; i < 8; i++) {
            const reporter = randomUser();
            const reported = randomUser();
            if (reporter.id_usuario === reported.id_usuario) continue;

            await supabase.from('Reportes').insert([{
                id_usuario_reporta: reporter.id_usuario,
                id_usuario_reportado: reported.id_usuario,
                motivo: reasons[Math.floor(Math.random() * reasons.length)],
                descripcion: 'Este usuario me envió mensajes ofensivos sin razón.',
                estado: ['pendiente', 'en_revision', 'resuelto'][Math.floor(Math.random() * 3)],
                fecha_creacion: new Date()
            }]);
        }

        // 8. Crear Notificaciones
        console.log('🔔 Enviando Notificaciones falsas...');
        for (const user of users) {
            await supabase.from('Notificaciones').insert([{
                id_usuario: user.id_usuario,
                tipo: 'sistema',
                titulo: 'Bienvenido a JAMConnect',
                mensaje: 'Completa tu perfil para ser más visible.',
                leida: false
            }]);
        }

        console.log('✨ BASE DE DATOS SEMBRADA EXITOSAMENTE ✨');

    } catch (e) {
        console.error('❌ Error Fatal en Seed:', e);
    }
}

seedFullDB();
