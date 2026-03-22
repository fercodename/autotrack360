-- =============================================
-- MIGRACIÓN 003: Tipos de Evidencia
-- =============================================

-- Crear enum para tipo de evidencia
CREATE TYPE evidence_type AS ENUM ('tecnica', 'comprobante');

-- Agregar campo tipo a evidencias
ALTER TABLE evidencias 
ADD COLUMN IF NOT EXISTS tipo evidence_type DEFAULT 'tecnica';

-- Comentario explicativo
COMMENT ON COLUMN evidencias.tipo IS 'Tipo de evidencia: tecnica (fotos, informes) o comprobante (facturas, tickets)';
