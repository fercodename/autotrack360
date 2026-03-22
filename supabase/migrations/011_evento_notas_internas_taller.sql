-- Notas internas del taller en eventos
-- Campo privado para el taller, no visible para el propietario (filtrado a nivel de aplicación)
ALTER TABLE eventos
ADD COLUMN IF NOT EXISTS notas_internas_taller TEXT;

COMMENT ON COLUMN eventos.notas_internas_taller IS 'Notas privadas del taller sobre este evento. No se muestran al propietario.';
