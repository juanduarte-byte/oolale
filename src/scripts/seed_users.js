const supabase = require('../config/db');

async function seedUsers() {
    console.log('🌱 Iniciando siembra de perfiles de prueba...');

    // Datos Realistas para tabla perfiles (sin auth — solo datos de perfil)
    const fakeProfiles = [
        { nombre_artistico: 'Ana García', email: 'ana.music@oolale.com', rol_principal: 'musico', ranking_tipo: 'pro' },
        { nombre_artistico: 'Carlos Santana', email: 'csantana@guitaryles.com', rol_principal: 'musico', ranking_tipo: 'rockstar' },
        { nombre_artistico: 'Luisa Lane', email: 'luisa.producer@studio.com', rol_principal: 'productor', ranking_tipo: 'pro' },
        { nombre_artistico: 'Mario Bros', email: 'mario.beats@nintendo.com', rol_principal: 'musico', ranking_tipo: 'regular' },
        { nombre_artistico: 'Sofia Vergara', email: 'sofia.v@hollywood.com', rol_principal: 'organizador', ranking_tipo: 'rockstar' },
        { nombre_artistico: 'David Guetta', email: 'david@dj.com', rol_principal: 'musico', ranking_tipo: 'rockstar' },
        { nombre_artistico: 'Hans Zimmer', email: 'hans@score.com', rol_principal: 'musico', ranking_tipo: 'pro' },
        { nombre_artistico: 'Shakira Mebarak', email: 'shakira@colombia.com', rol_principal: 'musico', ranking_tipo: 'regular' },
        { nombre_artistico: 'Bad Bunny', email: 'benito@pr.com', rol_principal: 'musico', ranking_tipo: 'rockstar' }
    ];

    console.log(`🚀 Insertando ${fakeProfiles.length} perfiles...`);

    for (const profile of fakeProfiles) {
        const { error } = await supabase.from('perfiles').insert([{
            nombre_artistico: profile.nombre_artistico,
            email: profile.email,
            rol_principal: profile.rol_principal,
            ranking_tipo: profile.ranking_tipo,
            is_active: true,
            created_at: new Date().toISOString()
        }]);

        if (error) {
            console.error(`❌ Error insertando ${profile.nombre_artistico}:`, error.message);
        } else {
            console.log(`✅ ${profile.nombre_artistico} creado.`);
        }
    }

    console.log('✨ Proceso finalizado.');
}

seedUsers();
