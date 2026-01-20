const supabase = require('../config/db');
const bcrypt = require('bcrypt');

async function createAdminUser() {
    console.log('🔐 Creando usuario administrador con bcrypt...');

    try {
        // Verificar si ya existe
        const { data: existing } = await supabase
            .from('Usuarios')
            .select('*')
            .eq('correo_electronico', 'admin@oolale.com')
            .single();

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash('admin123', 10);

        if (existing) {
            console.log('✅ Usuario admin ya existe. Actualizando contraseña con hash...');
            await supabase
                .from('Usuarios')
                .update({
                    es_admin: true,
                    contraseña: hashedPassword
                })
                .eq('correo_electronico', 'admin@oolale.com');
        } else {
            console.log('📝 Creando nuevo usuario admin con contraseña hasheada...');
            const { error } = await supabase.from('Usuarios').insert([{
                nombre_completo: 'Admin Principal',
                correo_electronico: 'admin@oolale.com',
                contraseña: hashedPassword,
                es_admin: true,
                fecha_registro: new Date()
            }]);

            if (error) throw error;
        }

        console.log('✅ Usuario admin configurado correctamente con bcrypt.');
        console.log('📧 Email: admin@oolale.com');
        console.log('🔑 Password: admin123');
        console.log('🔒 Password Hash: ' + hashedPassword.substring(0, 20) + '...');
        console.log('⚠️  IMPORTANTE: Cambia esta contraseña en producción.');

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

createAdminUser();
