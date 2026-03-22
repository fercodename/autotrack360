# AutoTrack 360° - Historia Clínica Vehicular

Plataforma para registrar y verificar el historial de mantenimiento vehicular con evidencias verificables.

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **PWA**: Optimizada para uso móvil y acceso a cámara

## Características Principales

### Trust Layer (Capa de Confianza)
- Hash SHA-256 para cada archivo adjunto
- Timestamp inmutable al momento de carga
- Niveles de verificación: A (Taller), B (Con evidencia), C (Declarativo)

### Scoring Engine
- Score de confianza 0-100
- Métricas: Cobertura, Frescura, Nivel de Verificación, Consistencia

### Reportes QR
- Links públicos con tiempo de expiración
- Capacidad de revocación
- Control de visualizaciones

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev
```

## Configuración de Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar la migración SQL en `supabase/migrations/001_initial_schema.sql`
3. Crear bucket de storage llamado `evidencias`
4. Configurar políticas de storage para el bucket

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
├── components/             # Componentes React
│   ├── ui/                 # Componentes base
│   ├── scoring/            # Visualización de trust score
│   └── evidence/           # Upload de archivos
├── lib/
│   ├── supabase/           # Clientes Supabase
│   ├── trust-layer/        # Hash, timestamp, verificación
│   ├── scoring-engine/     # Cálculo del trust score
│   └── utils/              # Utilidades generales
├── types/                  # TypeScript types
└── constants/              # Constantes y configuración
```

## Roles de Usuario

- **Propietario**: Dueño del vehículo, puede agregar vehículos y eventos
- **Taller**: Puede firmar eventos (nivel A) en vehículos autorizados
- **Comprador**: Solo puede ver reportes compartidos

## Licencia

Privado - Todos los derechos reservados
