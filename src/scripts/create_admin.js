const supabase = require('../config/db');
const bcrypt = require('bcrypt');

async function createAdminUser() {
    console.log('🔐 Creando usuario administrador en admin_users...');

    try {
        // Verificar si ya existe
        const { data: existing } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', 'admin@oolale.com')
            .single();

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash('admin123', 10);

        if (existing) {
            console.log('✅ Usuario admin ya existe. Actualizando contraseña con hash...');
            await supabase
                .from('admin_users')
                .update({
                    password_hash: hashedPassword
                })
                .eq('email', 'admin@oolale.com');
        } else {
            console.log('📝 Creando nuevo usuario admin con contraseña hasheada...');
            const { error } = await supabase.from('admin_users').insert([{
                name: 'Admin Principal',
                email: 'admin@oolale.com',
                password_hash: hashedPassword,
                role: 'admin'
            }]);

            if (error) throw error;
        }

        console.log('✅ Usuario admin configurado correctamente.');
        console.log('📧 Email: admin@oolale.com');
        console.log('🔑 Password: admin123');
        console.log('🔒 Hash: ' + hashedPassword.substring(0, 20) + '...');
        console.log('⚠️  IMPORTANTE: Cambia esta contraseña en producción.');

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

createAdminUser();
