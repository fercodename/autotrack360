-- =============================================
-- MIGRACIÓN 004: Vehículos cliente del taller y aprobación de eventos
-- =============================================

-- 1) owner_id nullable: vehículos pueden existir solo en manos del taller
ALTER TABLE vehiculos
ALTER COLUMN owner_id DROP NOT NULL;

-- 2) Enum y columna de estado de aprobación en eventos
CREATE TYPE evento_approval_status AS ENUM ('pendiente_aprobacion', 'aprobado', 'rechazado');

ALTER TABLE eventos
ADD COLUMN IF NOT EXISTS approval_status evento_approval_status NOT NULL DEFAULT 'aprobado';

COMMENT ON COLUMN eventos.approval_status IS 'Pendiente: creado por taller y dueño debe aprobar. Aprobado: en historial. Rechazado: dueño no lo aceptó.';
CREATE INDEX IF NOT EXISTS idx_eventos_approval ON eventos(approval_status);

-- 3) Tabla: vínculo taller <-> vehículo (vehículo cliente del taller)
CREATE TABLE IF NOT EXISTS vehiculo_taller (
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    taller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (vehiculo_id, taller_id)
);

CREATE INDEX IF NOT EXISTS idx_vehiculo_taller_taller ON vehiculo_taller(taller_id);
CREATE INDEX IF NOT EXISTS idx_vehiculo_taller_vehiculo ON vehiculo_taller(vehiculo_id);

COMMENT ON TABLE vehiculo_taller IS 'Vehículos que el taller tiene como clientes. Un mismo vehículo puede estar en varios talleres.';

ALTER TABLE vehiculo_taller ENABLE ROW LEVEL SECURITY;

-- 4) Trigger: al insertar evento por taller en vehículo con dueño → pendiente_aprobacion
CREATE OR REPLACE FUNCTION set_event_approval_status()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id UUID;
    v_creator_role user_role;
BEGIN
    -- Si ya viene definido, no sobrescribir
    IF NEW.approval_status IS NOT NULL AND NEW.approval_status != 'aprobado' THEN
        RETURN NEW;
    END IF;
    
    SELECT owner_id INTO v_owner_id FROM vehiculos WHERE id = NEW.vehiculo_id;
    SELECT role INTO v_creator_role FROM profiles WHERE id = NEW.created_by;
    
    -- Taller creó el evento y el vehículo tiene dueño → pendiente
    IF v_creator_role = 'taller' AND v_owner_id IS NOT NULL THEN
        NEW.approval_status := 'pendiente_aprobacion';
    ELSE
        NEW.approval_status := 'aprobado';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_event_approval_status_trigger ON eventos;
CREATE TRIGGER set_event_approval_status_trigger
    BEFORE INSERT ON eventos
    FOR EACH ROW EXECUTE FUNCTION set_event_approval_status();

-- =============================================
-- RLS: vehiculo_taller
-- =============================================
CREATE POLICY "Taller can view own client links"
    ON vehiculo_taller FOR SELECT
    USING (taller_id = auth.uid());

CREATE POLICY "Taller can add client vehicle"
    ON vehiculo_taller FOR INSERT
    WITH CHECK (
        taller_id = auth.uid()
        AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'taller')
    );

CREATE POLICY "Taller can remove own client link"
    ON vehiculo_taller FOR DELETE
    USING (taller_id = auth.uid());

-- =============================================
-- RLS: vehiculos (actualizar para taller)
-- =============================================
DROP POLICY IF EXISTS "Owners can view their vehicles" ON vehiculos;
CREATE POLICY "Owners or assigned workshop can view vehicles"
    ON vehiculos FOR SELECT
    USING (
        owner_id = auth.uid()
        OR id IN (SELECT vehiculo_id FROM vehiculo_taller WHERE taller_id = auth.uid())
    );

DROP POLICY IF EXISTS "Owners can create vehicles" ON vehiculos;
CREATE POLICY "Owners or workshop can create vehicles"
    ON vehiculos FOR INSERT
    WITH CHECK (
        owner_id = auth.uid()
        OR (
            owner_id IS NULL
            AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'taller')
        )
    );

DROP POLICY IF EXISTS "Owners can update their vehicles" ON vehiculos;
CREATE POLICY "Owners or assigned workshop can update vehicles"
    ON vehiculos FOR UPDATE
    USING (
        owner_id = auth.uid()
        OR id IN (SELECT vehiculo_id FROM vehiculo_taller WHERE taller_id = auth.uid())
    );

DROP POLICY IF EXISTS "Owners can delete their vehicles" ON vehiculos;
CREATE POLICY "Only owners can delete vehicles"
    ON vehiculos FOR DELETE
    USING (owner_id = auth.uid());

-- =============================================
-- RLS: eventos (actualizar para taller y aprobación)
-- =============================================
DROP POLICY IF EXISTS "View events of own vehicles" ON eventos;
CREATE POLICY "View events of own or workshop client vehicles"
    ON eventos FOR SELECT
    USING (
        vehiculo_id IN (SELECT id FROM vehiculos WHERE owner_id = auth.uid())
        OR created_by = auth.uid()
        OR vehiculo_id IN (SELECT vehiculo_id FROM vehiculo_taller WHERE taller_id = auth.uid())
    );

DROP POLICY IF EXISTS "Create events on own vehicles" ON eventos;
CREATE POLICY "Create events on own or workshop client vehicles"
    ON eventos FOR INSERT
    WITH CHECK (
        vehiculo_id IN (SELECT id FROM vehiculos WHERE owner_id = auth.uid())
        OR (
            vehiculo_id IN (SELECT vehiculo_id FROM vehiculo_taller WHERE taller_id = auth.uid())
            AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'taller')
        )
    );

DROP POLICY IF EXISTS "Update own events" ON eventos;
CREATE POLICY "Creator or vehicle owner can update events"
    ON eventos FOR UPDATE
    USING (
        created_by = auth.uid()
        OR vehiculo_id IN (SELECT id FROM vehiculos WHERE owner_id = auth.uid())
    );

-- =============================================
-- RLS: evidencias (acceso a eventos de vehiculo_taller)
-- =============================================
DROP POLICY IF EXISTS "View evidences of accessible events" ON evidencias;
CREATE POLICY "View evidences of accessible events"
    ON evidencias FOR SELECT
    USING (
        evento_id IN (
            SELECT e.id FROM eventos e
            JOIN vehiculos v ON e.vehiculo_id = v.id
            WHERE v.owner_id = auth.uid()
               OR e.created_by = auth.uid()
               OR e.vehiculo_id IN (SELECT vehiculo_id FROM vehiculo_taller WHERE taller_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Upload evidence to accessible events" ON evidencias;
CREATE POLICY "Upload evidence to accessible events"
    ON evidencias FOR INSERT
    WITH CHECK (
        evento_id IN (
            SELECT e.id FROM eventos e
            JOIN vehiculos v ON e.vehiculo_id = v.id
            WHERE v.owner_id = auth.uid()
               OR e.created_by = auth.uid()
               OR e.vehiculo_id IN (SELECT vehiculo_id FROM vehiculo_taller WHERE taller_id = auth.uid())
        )
    );
