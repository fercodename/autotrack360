-- =============================================
-- Lectura pública de reportes QR por token
-- Quien tiene el link puede ver el reporte sin estar logueado.
-- =============================================

-- Cualquiera puede leer un reporte no revocado (el token en la URL es el secreto)
CREATE POLICY "Public can view non-revoked reports by token"
    ON reportes_qr FOR SELECT
    USING (is_revoked = false);

-- Permitir actualizar solo view_count y last_viewed_at cuando se abre el link (anon o cualquiera)
CREATE POLICY "Public can increment report view count"
    ON reportes_qr FOR UPDATE
    USING (is_revoked = false)
    WITH CHECK (is_revoked = false);

-- Cualquiera puede leer el vehículo si tiene un reporte no revocado
CREATE POLICY "Public can view vehicle from valid report"
    ON vehiculos FOR SELECT
    USING (
        id IN (SELECT vehiculo_id FROM reportes_qr WHERE is_revoked = false)
    );

-- Cualquiera puede leer eventos del vehículo de un reporte no revocado
CREATE POLICY "Public can view events from report vehicle"
    ON eventos FOR SELECT
    USING (
        vehiculo_id IN (SELECT vehiculo_id FROM reportes_qr WHERE is_revoked = false)
    );

-- Cualquiera puede leer evidencias de esos eventos (solo metadatos; el archivo sigue por storage)
CREATE POLICY "Public can view evidences from report events"
    ON evidencias FOR SELECT
    USING (
        evento_id IN (
            SELECT id FROM eventos
            WHERE vehiculo_id IN (SELECT vehiculo_id FROM reportes_qr WHERE is_revoked = false)
        )
    );
