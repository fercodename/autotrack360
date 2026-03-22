-- =============================================
-- El taller puede leer nombre y teléfono del propietario
-- de sus vehículos cliente para prellenar datos de contacto.
-- =============================================

CREATE POLICY "Taller can view owner profile of client vehicles"
    ON profiles FOR SELECT
    USING (
        id IN (
            SELECT v.owner_id FROM vehiculos v
            INNER JOIN vehiculo_taller vt ON vt.vehiculo_id = v.id
            WHERE vt.taller_id = auth.uid()
              AND v.owner_id IS NOT NULL
        )
    );
