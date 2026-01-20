const supabase = require('./src/config/db');

async function verifyAdmin() {
    console.log('🔍 Verificando usuario admin...\n');

    try {
        // Buscar admin
        const { data: user, error } = await supabase
            .from('Usuarios')
            .select('*')
            .eq('correo_electronico', 'admin@oolale.com')
            .single();

        if (error) {
            console.error('❌ Error:', error);
            return;
        }

        if (!user) {
            console.log('❌ Usuario admin NO existe');
            return;
        }

        console.log('✅ Usuario encontrado:');
        console.log('   ID:', user.id_usuario);
        console.log('   Nombre:', user.nombre_completo);
        console.log('   Email:', user.correo_electronico);
        console.log('   Contraseña en DB:', user.contraseña);
        console.log('   Es Admin:', user.es_admin);
        console.log('   Fecha Registro:', user.fecha_registro);

        // Probar login
        console.log('\n🔐 Probando login...');
        const testPassword = 'admin123';

        const { data: loginTest, error: loginError } = await supabase
            .from('Usuarios')
            .select('*')
            .eq('correo_electronico', 'admin@oolale.com')
            .eq('contraseña', testPassword)
            .single();

        if (loginError || !loginTest) {
            console.log('❌ Login FALLÓ');
            console.log('   Contraseña esperada:', testPassword);
            console.log('   Contraseña en DB:', user.contraseña);
            console.log('   ¿Coinciden?', user.contraseña === testPassword);

            // Actualizar contraseña
            console.log('\n🔧 Actualizando contraseña a "admin123"...');
            const { error: updateError } = await supabase
                .from('Usuarios')
                .update({ contraseña: 'admin123' })
                .eq('correo_electronico', 'admin@oolale.com');

            if (updateError) {
                console.error('❌ Error al actualizar:', updateError);
            } else {
                console.log('✅ Contraseña actualizada correctamente');
            }
        } else {
            console.log('✅ Login EXITOSO');
        }

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

verifyAdmin();
