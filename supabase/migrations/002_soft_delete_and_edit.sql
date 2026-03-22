-- =============================================
-- MIGRACIÓN 002: Soft Delete y Edición Limitada
-- =============================================

-- Agregar campo is_hidden para soft delete
ALTER TABLE eventos 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Índice para filtrar eventos ocultos
CREATE INDEX IF NOT EXISTS idx_eventos_hidden ON eventos(is_hidden) WHERE is_hidden = FALSE;

-- Comentario explicativo
COMMENT ON COLUMN eventos.is_hidden IS 'Soft delete: el evento está oculto pero no borrado. Se muestra en reportes como "evento oculto"';
