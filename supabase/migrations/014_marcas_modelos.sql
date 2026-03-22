-- Tablas de referencia: marcas y modelos de vehículos
-- Opción C (Hybrid): las FK son opcionales en vehiculos para permitir texto libre como fallback

CREATE TABLE IF NOT EXISTS marcas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  pais_origen VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modelos (
  id SERIAL PRIMARY KEY,
  marca_id INTEGER NOT NULL REFERENCES marcas(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  anio_desde INTEGER,
  anio_hasta INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(marca_id, nombre)
);

-- FK opcionales en vehiculos (nullable = texto libre como fallback)
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS marca_id INTEGER REFERENCES marcas(id);
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS modelo_id INTEGER REFERENCES modelos(id);

-- Indices
CREATE INDEX IF NOT EXISTS idx_modelos_marca_id ON modelos(marca_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_marca_id ON vehiculos(marca_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_modelo_id ON vehiculos(modelo_id);

-- RLS: las tablas de referencia son de lectura pública
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marcas visibles para todos" ON marcas FOR SELECT USING (true);
CREATE POLICY "Modelos visibles para todos" ON modelos FOR SELECT USING (true);
