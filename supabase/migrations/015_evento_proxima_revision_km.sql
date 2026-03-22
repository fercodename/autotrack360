-- Agregar campo de próxima revisión por kilómetros
ALTER TABLE eventos
ADD COLUMN IF NOT EXISTS proxima_revision_km INTEGER;

COMMENT ON COLUMN eventos.proxima_revision_km IS 'Kilometraje objetivo para la próxima revisión. Se usa junto con el historial de km del vehículo para estimar una fecha aproximada.';
