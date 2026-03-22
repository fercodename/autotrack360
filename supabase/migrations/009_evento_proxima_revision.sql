-- =============================================
-- Próxima revisión / próximo contacto por evento
-- Para recordatorios al propietario y al taller.
-- =============================================

ALTER TABLE eventos
ADD COLUMN IF NOT EXISTS proxima_revision_at DATE;

COMMENT ON COLUMN eventos.proxima_revision_at IS 'Fecha sugerida de próxima revisión o contacto (recordatorio para propietario/taller)';
