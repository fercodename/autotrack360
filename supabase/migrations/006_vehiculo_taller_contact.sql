-- =============================================
-- Datos de contacto del propietario (mantenidos por el taller)
-- Para recordatorios, alertas y marketing.
-- =============================================

ALTER TABLE vehiculo_taller
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

COMMENT ON COLUMN vehiculo_taller.contact_name IS 'Nombre del propietario o contacto que usa el taller para este vehículo';
COMMENT ON COLUMN vehiculo_taller.contact_email IS 'Email de contacto (validado en app)';
COMMENT ON COLUMN vehiculo_taller.contact_phone IS 'Teléfono de contacto (validado en app)';

-- El taller puede actualizar su propio vínculo (contacto, notas)
CREATE POLICY "Taller can update own client link"
    ON vehiculo_taller FOR UPDATE
    USING (taller_id = auth.uid())
    WITH CHECK (taller_id = auth.uid());
