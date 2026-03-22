-- Seed: Marcas y modelos más vendidos en Argentina (1970-2026)
-- Fuente: mercado argentino, ACARA, modelos históricos y actuales

-- ─── MARCAS ───

INSERT INTO marcas (nombre, pais_origen) VALUES
('Alfa Romeo', 'Italia'),
('Audi', 'Alemania'),
('BMW', 'Alemania'),
('Chery', 'China'),
('Chevrolet', 'Estados Unidos'),
('Chrysler', 'Estados Unidos'),
('Citroën', 'Francia'),
('DS', 'Francia'),
('Dodge', 'Estados Unidos'),
('Fiat', 'Italia'),
('Ford', 'Estados Unidos'),
('GWM', 'China'),
('Haval', 'China'),
('Honda', 'Japón'),
('Hyundai', 'Corea del Sur'),
('Isuzu', 'Japón'),
('Iveco', 'Italia'),
('Jeep', 'Estados Unidos'),
('Kia', 'Corea del Sur'),
('Land Rover', 'Reino Unido'),
('Mercedes-Benz', 'Alemania'),
('Mini', 'Reino Unido'),
('Mitsubishi', 'Japón'),
('Nissan', 'Japón'),
('Peugeot', 'Francia'),
('RAM', 'Estados Unidos'),
('Renault', 'Francia'),
('Seat', 'España'),
('Subaru', 'Japón'),
('Suzuki', 'Japón'),
('Toyota', 'Japón'),
('Volkswagen', 'Alemania'),
('Volvo', 'Suecia')
ON CONFLICT (nombre) DO NOTHING;

-- ─── MODELOS ───
-- Formato: INSERT INTO modelos (marca_id, nombre) VALUES ((SELECT id FROM marcas WHERE nombre = 'X'), 'Modelo');

-- Alfa Romeo
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  '147', '156', '159', 'Giulia', 'Giulietta', 'Mito', 'Stelvio', 'Tonale'
]) AS m WHERE marcas.nombre = 'Alfa Romeo' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Audi
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8',
  'TT', 'RS3', 'RS4', 'RS5', 'S3', 'S4', 'e-tron', 'e-tron GT'
]) AS m WHERE marcas.nombre = 'Audi' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- BMW
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'Serie 7',
  'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'iX', 'i4'
]) AS m WHERE marcas.nombre = 'BMW' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Chery
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Arrizo 5', 'Tiggo 2', 'Tiggo 3', 'Tiggo 4', 'Tiggo 5X', 'Tiggo 7', 'Tiggo 8',
  'QQ', 'Fulwin'
]) AS m WHERE marcas.nombre = 'Chery' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Chevrolet
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Agile', 'Aveo', 'Camaro', 'Captiva', 'Celta', 'Classic', 'Cobalt', 'Corsa',
  'Cruze', 'Equinox', 'Joy', 'Montana', 'Onix', 'Onix Plus', 'Prisma',
  'S10', 'Spark', 'Spin', 'Tracker', 'Trailblazer', 'Vectra',
  'Astra', 'Blazer', 'Meriva', 'Zafira', 'Sonic'
]) AS m WHERE marcas.nombre = 'Chevrolet' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Chrysler
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  '300', 'Neon', 'PT Cruiser', 'Town & Country'
]) AS m WHERE marcas.nombre = 'Chrysler' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Citroën
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Berlingo', 'C3', 'C3 Aircross', 'C4', 'C4 Cactus', 'C4 Lounge', 'C5',
  'C-Elysée', 'Jumper', 'Jumpy', 'Xsara Picasso'
]) AS m WHERE marcas.nombre = 'Citroën' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- DS
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'DS3', 'DS4', 'DS5', 'DS7'
]) AS m WHERE marcas.nombre = 'DS' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Dodge
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Journey', 'Durango', 'Challenger', 'Charger', 'Nitro', 'Ram 1500'
]) AS m WHERE marcas.nombre = 'Dodge' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Fiat
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  '500', '500X', 'Argo', 'Bravo', 'Cronos', 'Dobló', 'Ducato', 'Fiorino',
  'Grand Siena', 'Idea', 'Linea', 'Mobi', 'Palio', 'Punto', 'Pulse',
  'Qubo', 'Siena', 'Strada', 'Tipo', 'Toro', 'Uno',
  'Fastback', 'Freemont', '128', '147', 'Duna', 'Regatta', 'Uno (clásico)'
]) AS m WHERE marcas.nombre = 'Fiat' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Ford
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Bronco', 'EcoSport', 'Edge', 'Escape', 'Explorer', 'F-100', 'F-150',
  'Falcon', 'Fiesta', 'Focus', 'Galaxy', 'Ka', 'Kuga', 'Maverick',
  'Mondeo', 'Mustang', 'Ranger', 'S-Max', 'Territory', 'Transit',
  'Ka+', 'Sierra', 'Taunus', 'Escort'
]) AS m WHERE marcas.nombre = 'Ford' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- GWM
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Ora 03', 'Wingle 5', 'Wingle 7'
]) AS m WHERE marcas.nombre = 'GWM' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Haval
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'H6', 'Jolion', 'Dargo'
]) AS m WHERE marcas.nombre = 'Haval' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Honda
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Accord', 'City', 'Civic', 'CR-V', 'Fit', 'HR-V', 'WR-V', 'ZR-V'
]) AS m WHERE marcas.nombre = 'Honda' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Hyundai
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Accent', 'Creta', 'Elantra', 'Grand i10', 'HB20', 'i10', 'i20', 'i30',
  'Ioniq', 'Kona', 'Santa Fe', 'Tucson', 'Veloster', 'Venue'
]) AS m WHERE marcas.nombre = 'Hyundai' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Isuzu
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'D-Max', 'MU-X'
]) AS m WHERE marcas.nombre = 'Isuzu' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Iveco
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Daily', 'Tector', 'Cursor', 'Stralis'
]) AS m WHERE marcas.nombre = 'Iveco' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Jeep
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Cherokee', 'Compass', 'Commander', 'Gladiator', 'Grand Cherokee',
  'Patriot', 'Renegade', 'Wrangler'
]) AS m WHERE marcas.nombre = 'Jeep' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Kia
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Carnival', 'Cerato', 'EV6', 'Niro', 'Picanto', 'Rio', 'Seltos',
  'Sorento', 'Soul', 'Sportage', 'Stinger', 'Stonic'
]) AS m WHERE marcas.nombre = 'Kia' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Land Rover
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Defender', 'Discovery', 'Discovery Sport', 'Evoque', 'Freelander',
  'Range Rover', 'Range Rover Sport', 'Range Rover Velar'
]) AS m WHERE marcas.nombre = 'Land Rover' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Mercedes-Benz
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'A 200', 'A 250', 'B 200', 'C 200', 'C 300', 'CLA', 'CLS', 'E 300', 'E 400',
  'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'S 500', 'Sprinter', 'Vito',
  'AMG A 35', 'AMG A 45', 'AMG C 43', 'AMG C 63', 'AMG GT', 'EQA', 'EQB', 'EQC'
]) AS m WHERE marcas.nombre = 'Mercedes-Benz' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Mini
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Cooper', 'Cooper S', 'Countryman', 'Clubman', 'Cabrio'
]) AS m WHERE marcas.nombre = 'Mini' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Mitsubishi
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'ASX', 'Eclipse Cross', 'L200', 'Lancer', 'Outlander', 'Pajero'
]) AS m WHERE marcas.nombre = 'Mitsubishi' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Nissan
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Frontier', 'Juke', 'Kicks', 'Leaf', 'March', 'Murano', 'Note',
  'Pathfinder', 'Qashqai', 'Sentra', 'Tiida', 'Versa', 'X-Trail'
]) AS m WHERE marcas.nombre = 'Nissan' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Peugeot
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  '2008', '206', '207', '208', '3008', '301', '308', '408', '5008', '508',
  'Boxer', 'Expert', 'Partner', 'Rifter',
  '504', '505', '404', '306', '405', '106'
]) AS m WHERE marcas.nombre = 'Peugeot' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- RAM
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  '1000', '1500', '2500', '700'
]) AS m WHERE marcas.nombre = 'RAM' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Renault
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Alaskan', 'Arkana', 'Captur', 'Clio', 'Duster', 'Fluence', 'Kangoo',
  'Koleos', 'Kwid', 'Logan', 'Master', 'Mégane', 'Oroch', 'Sandero',
  'Stepway', 'Symbol', 'Trafic',
  '9', '11', '12', '18', '19', '21', 'Fuego', 'Twingo'
]) AS m WHERE marcas.nombre = 'Renault' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Seat
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Arona', 'Ateca', 'Córdoba', 'Ibiza', 'León', 'Tarraco'
]) AS m WHERE marcas.nombre = 'Seat' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Subaru
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback', 'WRX', 'XV'
]) AS m WHERE marcas.nombre = 'Subaru' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Suzuki
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Alto', 'Baleno', 'Celerio', 'Grand Vitara', 'Ignis', 'Jimny',
  'S-Cross', 'Swift', 'Vitara'
]) AS m WHERE marcas.nombre = 'Suzuki' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Toyota
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Camry', 'Corolla', 'Corolla Cross', 'Etios', 'GR86', 'GR Yaris',
  'Hilux', 'Land Cruiser', 'Land Cruiser Prado', 'RAV4', 'SW4',
  'Supra', 'Yaris', 'Yaris Cross',
  'Corona', 'Celica', 'Tercel'
]) AS m WHERE marcas.nombre = 'Toyota' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Volkswagen
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'Amarok', 'Bora', 'Caddy', 'Crafter', 'CrossFox', 'Fox', 'Gol',
  'Gol Trend', 'Golf', 'Golf GTI', 'ID.4', 'Nivus', 'Passat', 'Polo',
  'Saveiro', 'Scirocco', 'Sharan', 'Suran', 'T-Cross', 'Taos',
  'Tiguan', 'Touareg', 'Up!', 'Vento',
  'Gacel', 'Senda', 'Carat', '1500', 'Escarabajo'
]) AS m WHERE marcas.nombre = 'Volkswagen' ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Volvo
INSERT INTO modelos (marca_id, nombre) SELECT id, m FROM marcas, unnest(ARRAY[
  'C40', 'S60', 'S90', 'V60', 'XC40', 'XC60', 'XC90'
]) AS m WHERE marcas.nombre = 'Volvo' ON CONFLICT (marca_id, nombre) DO NOTHING;
