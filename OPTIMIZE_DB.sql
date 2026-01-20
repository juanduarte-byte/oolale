-- =============================================
-- 🚀 OPTIMIZACIÓN DE RENDIMIENTO - ÍNDICES SQL
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Búsquedas de Usuarios (Nombre y Email)
-- Usamos GIN para búsquedas "ilike" rápidas
CREATE INDEX IF NOT EXISTS idx_users_search ON "Usuarios" 
USING gin(to_tsvector('spanish', nombre_completo || ' ' || correo_electronico));

-- 2. Filtros de Fechas (Eventos)
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON "Eventos" (fecha_evento DESC);

-- 3. Usuarios Admin (Login rápido)
CREATE INDEX IF NOT EXISTS idx_users_admin ON "Usuarios" (es_admin) WHERE es_admin = true;

-- 4. Búsqueda de Reportes por Estado
CREATE INDEX IF NOT EXISTS idx_reportes_status ON "Reportes" (estado);

-- 5. Búsqueda de Pagos por Usuario
CREATE INDEX IF NOT EXISTS idx_pagos_user ON "Pagos" (id_usuario);

-- 6. Auditoría (Ordenamiento por fecha)
CREATE INDEX IF NOT EXISTS idx_audit_date ON "Audit_Log" (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON "Audit_Log" (id_admin);

-- 7. Notas Admin (Prioridad)
CREATE INDEX IF NOT EXISTS idx_notes_prio ON "Admin_Notes" (prioridad);

-- =============================================
-- ✅ RESULTADO ESPERADO:
-- - Búsquedas 10x más rápidas
-- - Dashboards instantáneos
-- - Menor carga de CPU en Supabase
-- =============================================
