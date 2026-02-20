-- =============================================
-- 🛡️ TABLAS EXCLUSIVAS DEL PANEL WEB ADMIN
-- Ejecutar en Supabase SQL Editor
-- Compatible con el esquema móvil existente
-- =============================================

-- 1. Tabla de Administradores Web (auth separada de Supabase Auth)
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'Admin',
    role VARCHAR(50) DEFAULT 'admin',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Notas Internas de Admin
CREATE TABLE IF NOT EXISTS admin_notes (
    id SERIAL PRIMARY KEY,
    id_admin_autor INT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    prioridad VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    id_admin INT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    id_entidad TEXT,
    detalles JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_admin_notes_autor ON admin_notes(id_admin_autor);
CREATE INDEX IF NOT EXISTS idx_admin_notes_prioridad ON admin_notes(prioridad);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON audit_log(id_admin);
CREATE INDEX IF NOT EXISTS idx_audit_log_fecha ON audit_log(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidad ON audit_log(entidad);

-- 5. Desactivar RLS en tablas admin (solo accedidas via service_role key)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Política: service_role tiene acceso total (tu backend usa SUPABASE_SERVICE_KEY)
CREATE POLICY "Service role full access" ON admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON admin_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON audit_log FOR ALL USING (true) WITH CHECK (true);

-- 6. Comentarios
COMMENT ON TABLE admin_users IS 'Usuarios administradores del panel web (auth separada de la app móvil)';
COMMENT ON TABLE admin_notes IS 'Notas internas de comunicación entre administradores';
COMMENT ON TABLE audit_log IS 'Registro de auditoría de acciones administrativas';
