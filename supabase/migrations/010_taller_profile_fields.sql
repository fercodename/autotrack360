-- 010: Campos adicionales para perfil comercial del taller
-- Extiende la tabla profiles con datos del negocio

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS telefono_comercial VARCHAR(50),
  ADD COLUMN IF NOT EXISTS email_comercial VARCHAR(255),
  ADD COLUMN IF NOT EXISTS especialidades TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS horario TEXT;

COMMENT ON COLUMN profiles.telefono_comercial IS 'Telefono comercial del taller (distinto al personal)';
COMMENT ON COLUMN profiles.email_comercial IS 'Email comercial del taller';
COMMENT ON COLUMN profiles.especialidades IS 'Array de especialidades del taller (ej: mecanica general, frenos)';
COMMENT ON COLUMN profiles.horario IS 'Horario de atencion del taller (texto libre)';
