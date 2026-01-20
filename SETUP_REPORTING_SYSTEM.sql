-- =============================================
-- 🛡️ SISTEMA DE SEGURIDAD Y MODERACIÓN V1.0
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Tabla de Reportes (Denuncias)
CREATE TABLE IF NOT EXISTS "Reportes" (
    id_reporte SERIAL PRIMARY KEY,
    id_usuario_reporta INT NOT NULL REFERENCES "Usuarios"(id_usuario) ON DELETE CASCADE,
    id_usuario_reportado INT NOT NULL REFERENCES "Usuarios"(id_usuario) ON DELETE CASCADE,
    motivo VARCHAR(100) NOT NULL CHECK (motivo IN ('spam', 'acoso', 'contenido_inapropiado', 'estafa', 'otro')),
    descripcion TEXT,
    evidencia_url TEXT, -- URL a captura de pantalla o prueba
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'resuelto', 'descartado')),
    fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP,
    resolucion_nota TEXT
);

-- 2. Tabla de Bloqueos (User-side Blocking)
CREATE TABLE IF NOT EXISTS "Bloqueos" (
    id_bloqueo SERIAL PRIMARY KEY,
    id_usuario_bloqueador INT NOT NULL REFERENCES "Usuarios"(id_usuario) ON DELETE CASCADE,
    id_usuario_bloqueado INT NOT NULL REFERENCES "Usuarios"(id_usuario) ON DELETE CASCADE,
    fecha_bloqueo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unico_bloqueo UNIQUE (id_usuario_bloqueador, id_usuario_bloqueado)
);

-- 3. Índices para Búsqueda Rápida
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON "Reportes"(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_usuario_reportado ON "Reportes"(id_usuario_reportado);
CREATE INDEX IF NOT EXISTS idx_bloqueos_bloqueador ON "Bloqueos"(id_usuario_bloqueador);
CREATE INDEX IF NOT EXISTS idx_bloqueos_bloqueado ON "Bloqueos"(id_usuario_bloqueado);

-- 4. Comentarios
COMMENT ON TABLE "Reportes" IS 'Sistema de denuncias de usuarios para moderación admin';
COMMENT ON TABLE "Bloqueos" IS 'Lista negra personal de cada usuario para evitar contacto';

-- 5. Trigger para actualizar "Reputación" (Opcional - Lógica futura)
-- Por ahora, la reputación la calcularemos en lectura basada en reportes aprobados.
