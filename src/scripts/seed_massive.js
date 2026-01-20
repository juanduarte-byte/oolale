const supabase = require('../config/db');

// Utilería para datos aleatorios
const fnames = ['Juan', 'Maria', 'Pedro', 'Luis', 'Ana', 'Sofia', 'Carlos', 'Lucia', 'Miguel', 'Elena', 'Diego', 'Valentina', 'Javier', 'Camila', 'David', 'Isabella', 'Daniel', 'Paula', 'Andres', 'Carmen'];
const lnames = ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Cruz', 'Morales', 'Ortiz', 'Gutierrez', 'Chavez', 'Ramos'];
const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'oolale.com', 'music.com'];
const genres = ['Rock', 'Jazz', 'Pop', 'Metal', 'Salsa', 'Reggaeton', 'Indie', 'Blues', 'Clásica', 'Trap', 'Hip Hop', 'Funk', 'Soul', 'R&B', 'Electronic', 'House', 'Techno', 'Country', 'Folk', 'Punk'];
const instruments = ['Guitarra', 'Batería', 'Bajo', 'Piano', 'Voz', 'Saxofón', 'Violín', 'Trompeta', 'Sintetizador', 'Ukelele', 'Flauta', 'Clarinete', 'Cello', 'Contrabajo', 'Armónica'];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const generateName = () => `${getRandom(fnames)} ${getRandom(lnames)}`;
const generateEmail = (name) => `${name.toLowerCase().replace(/ /g, '.').replace(/ñ/g, 'n')}${Math.floor(Math.random() * 100)}@${getRandom(domains)}`;

async function seedMassiveDB() {
    console.log('🏭 INICIANDO GENERACIÓN MASIVA DE DATOS (Target: 100+ records)...');

    try {
        // ---------------------------------------------------------
        // 1. USUARIOS (100+)
        // ---------------------------------------------------------
        console.log('👤 Generando 100 Usuarios...');
        let users = [];
        // Primero traemos los existentes para no duplicar correos tontamente
        const { data: existingUsers } = await supabase.from('Usuarios').select('correo_electronico');
        const existingEmails = new Set(existingUsers?.map(u => u.correo_electronico) || []);

        for (let i = 0; i < 100; i++) {
            const name = generateName();
            let email = generateEmail(name);
            while (existingEmails.has(email)) email = generateEmail(name + Math.floor(Math.random() * 1000));
            existingEmails.add(email);

            const { data, error } = await supabase.from('Usuarios').insert([{
                nombre_completo: name,
                correo_electronico: email,
                contraseña: 'password123',
                es_admin: Math.random() < 0.05, // 5% admins
                fecha_registro: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString()
            }]).select();

            if (data && data.length) users.push(data[0]);
            if (i % 20 === 0) process.stdout.write('.');
        }
        console.log('\n✅ Usuarios creados/verificados.');

        // Recargar lista completa de usuarios para usar IDs
        const { data: allUsers } = await supabase.from('Usuarios').select('*');
        users = allUsers;
        const randomUser = () => getRandom(users);

        if (!users || users.length === 0) throw new Error("Falló la creación de usuarios o lectura.");

        // ---------------------------------------------------------
        // 2. PERFILES (1 por Usuario)
        // ---------------------------------------------------------
        console.log('🖼️ Generando Perfiles...');
        // Verificar quiénes ya tienen perfil
        const { data: existingProfiles } = await supabase.from('Perfiles').select('id_usuario');
        const userIdsWithProfile = new Set(existingProfiles?.map(p => p.id_usuario) || []);

        for (const user of users) {
            if (!userIdsWithProfile.has(user.id_usuario)) {
                await supabase.from('Perfiles').insert([{
                    id_usuario: user.id_usuario,
                    bio: `Soy ${user.nombre_completo}, músico de ${getRandom(genres)}. Me encanta colaborar.`,
                    ubicacion: getRandom(['CDMX', 'Guadalajara', 'Monterrey', 'Cancún', 'Puebla', 'Tijuana', 'Mérida']),
                    experiencia: getRandom(['Principiante', 'Intermedio', 'Avanzado', 'Profesional']),
                    disponibilidad: getRandom(['Fines de semana', 'Diario', 'Tardes', 'Mañanas'])
                }]);
            }
        }
        console.log('✅ Perfiles listos.');

        // ---------------------------------------------------------
        // 3. CATALOGOS (Generos, Instrumentos)
        // ---------------------------------------------------------
        console.log('🎵 Poblando Catálogos...');
        for (const g of genres) {
            // Upsert hack: insert ignore usually, here we just try catch duplicate key
            const { error } = await supabase.from('Generos').insert([{ nombre: g, descripcion: `Género ${g}` }]);
        }
        for (const i of instruments) {
            const { error } = await supabase.from('Instrumentos').insert([{ nombre: i, tipo: 'Instrumento' }]);
        }
        console.log('✅ Catálogos listos.');

        // ---------------------------------------------------------
        // 4. EVENTOS (120+)
        // ---------------------------------------------------------
        console.log('📅 Generando 120 Eventos...');
        const eventTypes = ['ensayo', 'jam_session', 'concierto', 'taller'];
        for (let i = 0; i < 120; i++) {
            const host = randomUser();
            const type = getRandom(eventTypes);
            await supabase.from('Eventos').insert([{
                id_organizador: host.id_usuario,
                titulo: `${type.toUpperCase()} con ${host.nombre_completo}`,
                descripcion: `Un evento genial de ${type} en la ciudad. ¡No faltes!`,
                tipo: type,
                fecha_evento: new Date(Date.now() + (Math.random() < 0.5 ? -1 : 1) * Math.random() * 5000000000).toISOString().split('T')[0], // +/- días
                hora_evento: `${Math.floor(Math.random() * 12) + 10}:00:00`,
                ubicacion: `Calle ${Math.floor(Math.random() * 100)}, Colonia Centro`,
                estado: getRandom(['activo', 'cancelado', 'completado']),
                visibilidad: 'publico',
                capacidad: Math.floor(Math.random() * 200) + 10
            }]);
            if (i % 20 === 0) process.stdout.write('.');
        }
        console.log('\n✅ Eventos creados.');

        // ---------------------------------------------------------
        // 5. PAGOS (150+)
        // ---------------------------------------------------------
        console.log('💰 Generando 150 Transacciones...');
        for (let i = 0; i < 150; i++) {
            const payer = randomUser();
            const status = Math.random() > 0.15 ? 'completado' : getRandom(['fallido', 'pendiente', 'reembolsado']);
            await supabase.from('Pagos').insert([{
                id_usuario: payer.id_usuario,
                monto: (Math.random() * 1000 + 50).toFixed(2),
                moneda: Math.random() > 0.8 ? 'USD' : 'MXN',
                metodo_pago: getRandom(['paypal', 'stripe', 'mercadopago', 'tarjeta']),
                estado: status,
                descripcion: `Pago de servicio #${Math.floor(Math.random() * 99999)}`,
                fecha_completado: status === 'completado' ? new Date().toISOString() : null,
                fecha_creacion: new Date(Date.now() - Math.random() * 10000000000).toISOString()
            }]);
            if (i % 30 === 0) process.stdout.write('.');
        }
        console.log('\n✅ Pagos creados.');

        // ---------------------------------------------------------
        // 6. REPORTES (100+)
        // ---------------------------------------------------------
        console.log('🚩 Generando 100 Reportes...');
        const reasons = ['Spam', 'Acoso', 'Contenido Ofensivo', 'Fake Profile', 'Estafa'];
        for (let i = 0; i < 100; i++) {
            const r1 = randomUser();
            const r2 = randomUser();
            if (r1.id_usuario === r2.id_usuario) continue;

            await supabase.from('Reportes').insert([{
                id_usuario_reporta: r1.id_usuario,
                id_usuario_reportado: r2.id_usuario,
                motivo: getRandom(reasons),
                descripcion: 'Comportamiento sospechoso detectado en el chat.',
                estado: getRandom(['pendiente', 'en_revision', 'resuelto', 'descartado']),
                fecha_creacion: new Date(Date.now() - Math.random() * 5000000000).toISOString()
            }]);
            if (i % 20 === 0) process.stdout.write('.');
        }
        console.log('\n✅ Reportes creados.');

        // ---------------------------------------------------------
        // Check Final
        // ---------------------------------------------------------
        console.log('✨ POBLACIÓN MASIVA COMPLETADA EXITOSAMENTE ✨');

    } catch (e) {
        console.error('\n❌ Error en Seed Masivo:', e);
    }
}

seedMassiveDB();
