-- =============================================
-- 📱 SUPER SCRIPT V1.0: ÓOLALE MOBILE FULL FEATURES
-- Ejecutar en Supabase SQL Editor para habilitar:
-- 1. Seguridad (Reportes/Bloqueos)
-- 2. Inventario (Gear)
-- 3. Perfil Pro (Enlaces, Badges, OpenToWork)
-- =============================================

-- 🔄 1. ACTUALIZACIÓN DE PERFILES (Fase 2 Pro)
-- Agregamos columnas para redes sociales y estado profesional
ALTER TABLE "Perfiles" 
ADD COLUMN IF NOT EXISTS "enlace_soundcloud" TEXT,
ADD COLUMN IF NOT EXISTS "enlace_youtube" TEXT,
ADD COLUMN IF NOT EXISTS "enlace_website" TEXT,
ADD COLUMN IF NOT EXISTS "open_to_work" BOOLEAN DEFAULT FALSE, -- ¿Busca banda/trabajo?
ADD COLUMN IF NOT EXISTS "nivel_badge" VARCHAR(20) DEFAULT 'principiante', -- principiante, intermedio, pro, maestro
ADD COLUMN IF NOT EXISTS "verificado" BOOLEAN DEFAULT FALSE;

-- 🎒 2. SISTEMA DE INVENTARIO / GEAR (Fase 2)
CREATE TABLE IF NOT EXISTS "Equipo_Usuario" (
    id_equipo SERIAL PRIMARY KEY,
    id_perfil INT NOT NULL REFERENCES "Perfiles"(id_perfil) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL, -- Ej: Fender Stratocaster
    categoria VARCHAR(50), -- Ej: Instrumento, Amplificador, PA, Accesorio
    descripcion TEXT,
    foto_url TEXT,
    en_venta BOOLEAN DEFAULT FALSE, -- Para futuro Marketplace
    precio DECIMAL(10,2) -- Opcional, si está en venta
);

-- 🛡️ 3. SISTEMA DE REPORTES (Fase 5)
CREATE TABLE IF NOT EXISTS "Reportes" (
    id_reporte SERIAL PRIMARY KEY,
    id_usuario_reporta INT NOT NULL REFERENCES "Usuarios"(id_usuario) ON DELETE CASCADE,
    id_usuario_reportado INT NOT NULL REFERENCES "Usuarios"(id_usuario) ON DELETE CASCADE,
    motivo VARCHAR(100) NOT NULL CHECK (motivo IN ('spam', 'acoso', 'contenido_inapropiado', 'estafa', 'otro')),
    descripcion TEXT,
    evidencia_url TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'resuelto', 'descartado')),
    fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP,
    resolucion_nota TEXT
);

-- 🚫 4. SISTEMA DE BLOQUEOS (Fase 5)
CREATE TABLE IF NOT EXISTS "Bloqueos" (
    id_bloqueo SERIAL PRIMARY KEY,
    id_usuario_bloqueador INT NOT NULL REFERENCES "Usuarios"(id_usuario) ON DELETE CASCADE,
    id_usuario_bloqueado INT NOT NULL REFERENCES "Usuarios"(id_usuario) ON DELETE CASCADE,
    fecha_bloqueo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unico_bloqueo UNIQUE (id_usuario_bloqueador, id_usuario_bloqueado)
);

-- ⚡ 5. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_equipo_perfil ON "Equipo_Usuario"(id_perfil);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON "Reportes"(estado);
CREATE INDEX IF NOT EXISTS idx_bloqueos_bloqueador ON "Bloqueos"(id_usuario_bloqueador);

-- 📝 COMENTARIOS DOCUMENTALES
COMMENT ON TABLE "Equipo_Usuario" IS 'Inventario de instrumentos y gear de los músicos';
COMMENT ON COLUMN "Perfiles"."open_to_work" IS 'Indicador si el usuario busca activamente proyectos';
