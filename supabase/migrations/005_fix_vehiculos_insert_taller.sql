-- =============================================
-- FIX: Taller puede crear vehículos y buscar por patente
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1) owner_id acepta NULL
ALTER TABLE vehiculos
ALTER COLUMN owner_id DROP NOT NULL;

-- 2) INSERT: taller puede crear vehículos (owner_id null)
DROP POLICY IF EXISTS "Owners can create vehicles" ON vehiculos;
DROP POLICY IF EXISTS "Owners or workshop can create vehicles" ON vehiculos;

CREATE POLICY "Owners or workshop can create vehicles"
    ON vehiculos FOR INSERT
    WITH CHECK (
        owner_id = auth.uid()
        OR (
            owner_id IS NULL
            AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'taller')
        )
    );

-- 3) SELECT: taller puede ver cualquier vehículo para buscar por patente y vincularlo
DROP POLICY IF EXISTS "Owners or assigned workshop can view vehicles" ON vehiculos;
CREATE POLICY "Owners or assigned workshop can view vehicles"
    ON vehiculos FOR SELECT
    USING (
        owner_id = auth.uid()
        OR id IN (SELECT vehiculo_id FROM vehiculo_taller WHERE taller_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'taller')
    );
