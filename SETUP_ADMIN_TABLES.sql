-- Crear tablas para sistema administrativo avanzado

-- Tabla de Notas Administrativas
CREATE TABLE IF NOT EXISTS "Admin_Notes" (
    id SERIAL PRIMARY KEY,
    id_admin_autor INT NOT NULL REFERENCES "Usuarios"(id_usuario) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    prioridad VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Audit Log
CREATE TABLE IF NOT EXISTS "Audit_Log" (
    id SERIAL PRIMARY KEY,
    id_admin INT NOT NULL REFERENCES "Usuarios"(id_usuario) ON DELETE CASCADE,
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    id_entidad INT,
    detalles JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_admin_notes_autor ON "Admin_Notes"(id_admin_autor);
CREATE INDEX IF NOT EXISTS idx_admin_notes_prioridad ON "Admin_Notes"(prioridad);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON "Audit_Log"(id_admin);
CREATE INDEX IF NOT EXISTS idx_audit_log_fecha ON "Audit_Log"(fecha);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidad ON "Audit_Log"(entidad);

-- Comentarios
COMMENT ON TABLE "Admin_Notes" IS 'Notas de comunicación interna entre administradores';
COMMENT ON TABLE "Audit_Log" IS 'Registro de auditoría de todas las acciones administrativas';
