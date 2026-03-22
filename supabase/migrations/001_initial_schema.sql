-- =============================================
-- AUTOTRACK 360° - ESQUEMA DE BASE DE DATOS MVP
-- Migración inicial
-- =============================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE user_role AS ENUM ('propietario', 'taller', 'comprador');
CREATE TYPE event_type AS ENUM ('service', 'reparacion', 'vtv', 'inspeccion', 'otro');
CREATE TYPE verification_level AS ENUM ('A', 'B', 'C');

-- =============================================
-- TABLA: profiles (extiende auth.users)
-- =============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'propietario',
    full_name VARCHAR(255),
    phone VARCHAR(50),
    -- Datos específicos para talleres
    business_name VARCHAR(255),
    cuit VARCHAR(20),
    address TEXT,
    is_verified_workshop BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: vehiculos
-- =============================================
CREATE TABLE vehiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Datos del vehículo
    patente VARCHAR(10) NOT NULL UNIQUE,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    anio INTEGER NOT NULL,
    vin VARCHAR(17),
    color VARCHAR(50),
    tipo_combustible VARCHAR(50),
    kilometraje_actual INTEGER DEFAULT 0,
    
    -- Trust Score calculado
    trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
    last_score_update TIMESTAMPTZ,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_anio CHECK (anio >= 1900 AND anio <= EXTRACT(YEAR FROM NOW()) + 1)
);

-- =============================================
-- TABLA: eventos
-- =============================================
CREATE TABLE eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id),
    
    -- Datos del evento
    tipo event_type NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_evento DATE NOT NULL,
    kilometraje INTEGER,
    costo DECIMAL(12, 2),
    
    -- Nivel de verificación
    verification_level verification_level NOT NULL DEFAULT 'C',
    
    -- Si fue creado por un taller verificado
    workshop_id UUID REFERENCES profiles(id),
    workshop_signature TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: evidencias
-- =============================================
CREATE TABLE evidencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    
    -- Archivo
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    
    -- TRUST LAYER: Integridad del archivo
    hash_sha256 VARCHAR(64) NOT NULL,
    timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata adicional (EXIF, etc)
    metadata JSONB DEFAULT '{}',
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: fuentes (origen de los eventos)
-- =============================================
CREATE TABLE fuentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255),
    identificador VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLA: reportes_qr (links públicos con TTL)
-- =============================================
CREATE TABLE reportes_qr (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id),
    
    -- Token único para acceso público
    token VARCHAR(64) NOT NULL UNIQUE,
    
    -- Control de acceso
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    max_views INTEGER,
    view_count INTEGER DEFAULT 0,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX idx_vehiculos_owner ON vehiculos(owner_id);
CREATE INDEX idx_vehiculos_patente ON vehiculos(patente);
CREATE INDEX idx_eventos_vehiculo ON eventos(vehiculo_id);
CREATE INDEX idx_eventos_fecha ON eventos(fecha_evento DESC);
CREATE INDEX idx_eventos_tipo ON eventos(tipo);
CREATE INDEX idx_evidencias_evento ON evidencias(evento_id);
CREATE INDEX idx_evidencias_hash ON evidencias(hash_sha256);
CREATE INDEX idx_reportes_token ON reportes_qr(token) WHERE NOT is_revoked;
CREATE INDEX idx_reportes_expires ON reportes_qr(expires_at) WHERE NOT is_revoked;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_qr ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Talleres verificados son públicos
CREATE POLICY "Verified workshops are public"
    ON profiles FOR SELECT
    USING (is_verified_workshop = TRUE);

-- VEHICULOS
CREATE POLICY "Owners can view their vehicles"
    ON vehiculos FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Owners can create vehicles"
    ON vehiculos FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their vehicles"
    ON vehiculos FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their vehicles"
    ON vehiculos FOR DELETE
    USING (owner_id = auth.uid());

-- EVENTOS
CREATE POLICY "View events of own vehicles"
    ON eventos FOR SELECT
    USING (
        vehiculo_id IN (SELECT id FROM vehiculos WHERE owner_id = auth.uid())
        OR created_by = auth.uid()
    );

CREATE POLICY "Create events on own vehicles"
    ON eventos FOR INSERT
    WITH CHECK (
        vehiculo_id IN (SELECT id FROM vehiculos WHERE owner_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'taller' 
            AND is_verified_workshop = TRUE
        )
    );

CREATE POLICY "Update own events"
    ON eventos FOR UPDATE
    USING (created_by = auth.uid());

-- EVIDENCIAS
CREATE POLICY "View evidences of accessible events"
    ON evidencias FOR SELECT
    USING (
        evento_id IN (
            SELECT e.id FROM eventos e
            JOIN vehiculos v ON e.vehiculo_id = v.id
            WHERE v.owner_id = auth.uid() OR e.created_by = auth.uid()
        )
    );

CREATE POLICY "Upload evidence to accessible events"
    ON evidencias FOR INSERT
    WITH CHECK (
        evento_id IN (
            SELECT e.id FROM eventos e
            JOIN vehiculos v ON e.vehiculo_id = v.id
            WHERE v.owner_id = auth.uid() OR e.created_by = auth.uid()
        )
    );

-- FUENTES
CREATE POLICY "View sources of accessible events"
    ON fuentes FOR SELECT
    USING (
        evento_id IN (
            SELECT e.id FROM eventos e
            JOIN vehiculos v ON e.vehiculo_id = v.id
            WHERE v.owner_id = auth.uid()
        )
    );

-- REPORTES QR
CREATE POLICY "Owners can manage their reports"
    ON reportes_qr FOR ALL
    USING (created_by = auth.uid());

-- =============================================
-- TRIGGERS PARA updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vehiculos_updated_at
    BEFORE UPDATE ON vehiculos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_eventos_updated_at
    BEFORE UPDATE ON eventos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- TRIGGER: Crear profile al registrarse
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- TRIGGER: Actualizar nivel verificación al agregar evidencia
-- =============================================
CREATE OR REPLACE FUNCTION update_event_verification_level()
RETURNS TRIGGER AS $$
DECLARE
    evento_record RECORD;
    has_verified_workshop BOOLEAN;
BEGIN
    SELECT e.*, p.is_verified_workshop INTO evento_record
    FROM eventos e
    LEFT JOIN profiles p ON e.workshop_id = p.id
    WHERE e.id = NEW.evento_id;
    
    -- Si ya es nivel A, no cambiar
    IF evento_record.verification_level = 'A' THEN
        RETURN NEW;
    END IF;
    
    -- Si hay evidencia, subir a nivel B
    UPDATE eventos 
    SET verification_level = 'B'
    WHERE id = NEW.evento_id AND verification_level = 'C';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_evidence_added
    AFTER INSERT ON evidencias
    FOR EACH ROW EXECUTE FUNCTION update_event_verification_level();

-- =============================================
-- STORAGE BUCKETS (ejecutar en Supabase Dashboard)
-- =============================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('evidencias', 'evidencias', false);
