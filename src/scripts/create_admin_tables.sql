const supabase = require('../config/db');

async function createAdminTables() {
    console.log('📝 Creando tablas administrativas...');

    try {
        // Tabla de Notas entre Admins
        console.log('Creating Admin_Notes table...');
        const notesSQL = `
            CREATE TABLE IF NOT EXISTS Admin_Notes (
                id SERIAL PRIMARY KEY,
                id_admin_autor INT NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
                titulo VARCHAR(200) NOT NULL,
                contenido TEXT NOT NULL,
                prioridad VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        // Tabla de Audit Log
        console.log('Creating Audit_Log table...');
        const auditSQL = `
            CREATE TABLE IF NOT EXISTS Audit_Log (
                id SERIAL PRIMARY KEY,
                id_admin INT NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
                accion VARCHAR(100) NOT NULL,
                entidad VARCHAR(50) NOT NULL,
                id_entidad INT,
                detalles JSONB,
                ip_address VARCHAR(45),
                user_agent TEXT,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        console.log('✅ Tablas creadas exitosamente (si no existían).');
        console.log('📋 Admin_Notes: Para comunicación entre administradores');
        console.log('📊 Audit_Log: Para registro de todas las acciones');

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

createAdminTables();
