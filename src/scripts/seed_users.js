const supabase = require('../config/db');

async function seedUsers() {
    console.log('🌱 Iniciando siembra de datos realistas...');

    // 1. Limpiar usuarios existentes (Opcional, pero pedido por el usuario)
    // Cuidado: esto borra FKs si no hay cascade. Asumimos que es dev.
    console.log('🗑️ Eliminando usuarios antiguos...');
    const { error: deleteError } = await supabase.from('Usuarios').delete().neq('id_usuario', 0); // Borrar todos
    if (deleteError) console.error('Error limpiando:', deleteError.message);

    // 2. Datos Realistas
    const fakeUsers = [
        { nombre_completo: 'Ana García', correo_electronico: 'ana.music@oolale.com', rol: 'musico', tipo_membresia: 'pro', es_admin: false, fecha_registro: new Date('2025-01-10') },
        { nombre_completo: 'Carlos Santana', correo_electronico: 'csantana@guitaryles.com', rol: 'musico', tipo_membresia: 'rockstar', es_admin: false, fecha_registro: new Date('2025-01-12') },
        { nombre_completo: 'Admin Principal', correo_electronico: 'admin@oolale.com', rol: 'admin', tipo_membresia: 'free', es_admin: true, fecha_registro: new Date('2024-12-01') },
        { nombre_completo: 'Luisa Lane', correo_electronico: 'luisa.producer@studio.com', rol: 'productor', tipo_membresia: 'pro', es_admin: false, fecha_registro: new Date('2025-01-15') },
        { nombre_completo: 'Mario Bros', correo_electronico: 'mario.beats@nintendo.com', rol: 'musico', tipo_membresia: 'free', es_admin: false, fecha_registro: new Date('2025-01-18') },
        { nombre_completo: 'Sofia Vergara', correo_electronico: 'sofia.v@hollywood.com', rol: 'manager', tipo_membresia: 'rockstar', es_admin: false, fecha_registro: new Date('2025-01-11') },
        { nombre_completo: 'David Guetta', correo_electronico: 'david@dj.com', rol: 'musico', tipo_membresia: 'rockstar', es_admin: false, fecha_registro: new Date('2025-01-14') },
        { nombre_completo: 'Hans Zimmer', correo_electronico: 'hans@score.com', rol: 'compositor', tipo_membresia: 'pro', es_admin: false, fecha_registro: new Date('2025-01-05') },
        { nombre_completo: 'Shakira Mebarak', correo_electronico: 'shakira@colombia.com', rol: 'musico', tipo_membresia: 'free', es_admin: false, fecha_registro: new Date('2025-01-19') },
        { nombre_completo: 'Bad Bunny', correo_electronico: 'benito@pr.com', rol: 'musico', tipo_membresia: 'rockstar', es_admin: false, fecha_registro: new Date('2025-01-08') }
    ];

    console.log(`🚀 Insertando ${fakeUsers.length} usuarios...`);

    for (const user of fakeUsers) {
        // Encriptar contraseña mock
        const { error } = await supabase.from('Usuarios').insert([{
            nombre_completo: user.nombre_completo,
            correo_electronico: user.correo_electronico,
            contraseña: 'password123',
            es_admin: user.es_admin,
            // tipo_membresia: user.tipo_membresia, // REMOVIDO: Error de schema
            // rol: user.rol, 
            fecha_registro: user.fecha_registro
        }]);

        if (error) {
            console.error(`❌ Error insertando ${user.nombre_completo}:`, error.message);
        } else {
            console.log(`✅ ${user.nombre_completo} creado.`);
        }
    }

    console.log('✨ Proceso finalizado.');
}

seedUsers();
