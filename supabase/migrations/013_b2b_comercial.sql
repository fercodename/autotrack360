-- =====================================================
-- B2B Comercial: estructura para concesionarias,
-- aseguradoras, financieras
-- =====================================================

-- Organizaciones (clientes B2B)
CREATE TABLE organizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('concesionaria', 'aseguradora', 'financiera', 'otro')),
  cuit TEXT,
  direccion TEXT,
  contacto_nombre TEXT,
  contacto_email TEXT,
  contacto_telefono TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Planes comerciales
CREATE TABLE org_planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,                          -- 'starter', 'business', 'enterprise'
  descripcion TEXT,
  creditos_mensuales INTEGER NOT NULL,           -- 0 = ilimitado
  precio_mensual NUMERIC(10,2),
  permite_reporte_completo BOOLEAN DEFAULT false, -- Opción C: acceso a evidencias con consentimiento
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Relación organización ↔ plan (suscripción activa)
CREATE TABLE org_suscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES org_planes(id),
  creditos_restantes INTEGER NOT NULL DEFAULT 0,
  creditos_renovacion_dia INTEGER DEFAULT 1,     -- día del mes que se renuevan
  vigente_desde DATE NOT NULL DEFAULT CURRENT_DATE,
  vigente_hasta DATE,                            -- NULL = sin vencimiento
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- API keys de organizaciones (separadas de user_api_keys)
CREATE TABLE org_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,                        -- SHA-256 del key
  key_prefix VARCHAR(12) NOT NULL,               -- primeros chars para identificar (ej: "at360_biz_ab")
  label TEXT,                                    -- "Key producción", "Key testing"
  permisos TEXT[] DEFAULT ARRAY['consulta_basica'],
  -- permisos posibles: 'consulta_basica', 'reporte_comercial', 'reporte_completo'
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de consumos (auditoría + facturación)
CREATE TABLE org_consumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES org_api_keys(id),
  tipo_consulta TEXT NOT NULL CHECK (tipo_consulta IN ('consulta_basica', 'reporte_comercial', 'reporte_completo')),
  creditos_consumidos INTEGER NOT NULL DEFAULT 1,
  patente_consultada TEXT,                       -- para auditoría
  vehiculo_id UUID,                              -- si se encontró
  vehiculo_encontrado BOOLEAN DEFAULT false,
  ip_origen TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_org_api_keys_hash ON org_api_keys(key_hash) WHERE is_active = true;
CREATE INDEX idx_org_consumos_org ON org_consumos(org_id, created_at DESC);
CREATE INDEX idx_org_consumos_fecha ON org_consumos(created_at DESC);
CREATE INDEX idx_org_suscripciones_org ON org_suscripciones(org_id) WHERE is_active = true;

-- Planes iniciales de ejemplo
INSERT INTO org_planes (nombre, descripcion, creditos_mensuales, precio_mensual, permite_reporte_completo) VALUES
  ('starter',    'Ideal para concesionarias chicas. 50 consultas/mes.',         50,   NULL, false),
  ('business',   'Para concesionarias medianas. 500 consultas/mes.',           500,   NULL, false),
  ('enterprise', 'Acceso ilimitado + reportes completos con consentimiento.', 0,     NULL, true);

-- RLS: las tablas B2B no se acceden desde el frontend.
-- Se acceden exclusivamente via API routes con service role.
-- Por seguridad, bloqueamos acceso anon/authenticated.
ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_consumos ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede acceder (las API routes usan createServiceRoleClient)
CREATE POLICY "service_role_only" ON organizaciones FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_only" ON org_planes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_only" ON org_suscripciones FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_only" ON org_api_keys FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_only" ON org_consumos FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE organizaciones IS 'Clientes B2B (concesionarias, aseguradoras, financieras)';
COMMENT ON TABLE org_planes IS 'Planes comerciales con créditos mensuales';
COMMENT ON TABLE org_suscripciones IS 'Suscripción activa de cada organización a un plan';
COMMENT ON TABLE org_api_keys IS 'API keys de organizaciones para acceso comercial';
COMMENT ON TABLE org_consumos IS 'Log de cada consulta (auditoría y facturación)';
COMMENT ON COLUMN org_consumos.creditos_consumidos IS '1=consulta básica, 2=reporte comercial, 3=reporte completo';
