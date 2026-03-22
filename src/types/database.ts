export type UserRole = 'propietario' | 'taller' | 'comprador'

export type EventType = 'service' | 'reparacion' | 'vtv' | 'inspeccion' | 'otro'

export type VerificationLevel = 'A' | 'B' | 'C'

export type EvidenceType = 'tecnica' | 'comprobante'

export type EventApprovalStatus = 'pendiente_aprobacion' | 'aprobado' | 'rechazado'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  business_name: string | null
  cuit: string | null
  address: string | null
  is_verified_workshop: boolean
  telefono_comercial: string | null
  email_comercial: string | null
  especialidades: string[]
  horario: string | null
  created_at: string
  updated_at: string
}

export interface Marca {
  id: number
  nombre: string
  pais_origen: string | null
}

export interface Modelo {
  id: number
  marca_id: number
  nombre: string
  anio_desde: number | null
  anio_hasta: number | null
}

export interface Vehiculo {
  id: string
  owner_id: string | null
  patente: string
  marca: string
  modelo: string
  marca_id: number | null
  modelo_id: number | null
  anio: number
  vin: string | null
  color: string | null
  tipo_combustible: string | null
  kilometraje_actual: number
  trust_score: number
  last_score_update: string | null
  created_at: string
  updated_at: string
}

export interface Evento {
  id: string
  vehiculo_id: string
  created_by: string
  tipo: EventType
  titulo: string
  descripcion: string | null
  fecha_evento: string
  kilometraje: number | null
  costo: number | null
  verification_level: VerificationLevel
  workshop_id: string | null
  workshop_signature: string | null
  approval_status: EventApprovalStatus
  is_hidden: boolean
  proxima_revision_at: string | null
  proxima_revision_km: number | null
  notas_internas_taller: string | null
  created_at: string
  updated_at: string
}

export interface VehiculoTaller {
  vehiculo_id: string
  taller_id: string
  notas: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at: string
}

export interface Evidencia {
  id: string
  evento_id: string
  uploaded_by: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  hash_sha256: string
  timestamp_utc: string
  metadata: Record<string, unknown>
  tipo: EvidenceType
  created_at: string
}

export interface Fuente {
  id: string
  evento_id: string
  tipo: string
  nombre: string | null
  identificador: string | null
  created_at: string
}

export interface ReporteQR {
  id: string
  vehiculo_id: string
  created_by: string
  token: string
  expires_at: string
  is_revoked: boolean
  max_views: number | null
  view_count: number
  created_at: string
  last_viewed_at: string | null
}

export interface UserApiKey {
  id: string
  user_id: string
  key_hash: string
  key_prefix: string
  label: string
  permissions: ('read' | 'write' | 'admin')[]
  telegram_chat_id: string | null
  whatsapp_phone: string | null
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

// ─── B2B Comercial ───

export type OrgTipo = 'concesionaria' | 'aseguradora' | 'financiera' | 'otro'
export type TipoConsulta = 'consulta_basica' | 'reporte_comercial' | 'reporte_completo'

export interface Organizacion {
  id: string
  nombre: string
  tipo: OrgTipo
  cuit: string | null
  direccion: string | null
  contacto_nombre: string | null
  contacto_email: string | null
  contacto_telefono: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OrgPlan {
  id: string
  nombre: string
  descripcion: string | null
  creditos_mensuales: number
  precio_mensual: number | null
  permite_reporte_completo: boolean
  is_active: boolean
  created_at: string
}

export interface OrgSuscripcion {
  id: string
  org_id: string
  plan_id: string
  creditos_restantes: number
  creditos_renovacion_dia: number
  vigente_desde: string
  vigente_hasta: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OrgApiKey {
  id: string
  org_id: string
  key_hash: string
  key_prefix: string
  label: string | null
  permisos: TipoConsulta[]
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface OrgConsumo {
  id: string
  org_id: string
  api_key_id: string | null
  tipo_consulta: TipoConsulta
  creditos_consumidos: number
  patente_consultada: string | null
  vehiculo_id: string | null
  vehiculo_encontrado: boolean
  ip_origen: string | null
  created_at: string
}

export interface VehiculoWithEvents extends Vehiculo {
  eventos: (Evento & { evidencias: Evidencia[] })[]
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Omit<Profile, 'created_at' | 'updated_at'>> & { id: string }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      vehiculos: {
        Row: Vehiculo
        Insert: Partial<Omit<Vehiculo, 'id' | 'created_at' | 'updated_at' | 'trust_score' | 'last_score_update'>> & { patente: string; marca: string; modelo: string; anio: number }
        Update: Partial<Omit<Vehiculo, 'id' | 'created_at'>>
      }
      eventos: {
        Row: Evento
        Insert: Partial<Omit<Evento, 'id' | 'created_at' | 'updated_at'>> & { vehiculo_id: string; created_by: string; tipo: EventType; titulo: string; fecha_evento: string }
        Update: Partial<Omit<Evento, 'id' | 'created_at'>>
      }
      evidencias: {
        Row: Evidencia
        Insert: Omit<Evidencia, 'id' | 'created_at'>
        Update: Partial<Omit<Evidencia, 'id' | 'created_at'>>
      }
      fuentes: {
        Row: Fuente
        Insert: Omit<Fuente, 'id' | 'created_at'>
        Update: Partial<Omit<Fuente, 'id' | 'created_at'>>
      }
      vehiculo_taller: {
        Row: VehiculoTaller
        Insert: Omit<VehiculoTaller, 'created_at'>
        Update: Partial<Omit<VehiculoTaller, 'created_at'>>
      }
      reportes_qr: {
        Row: ReporteQR
        Insert: Omit<ReporteQR, 'id' | 'created_at' | 'view_count' | 'last_viewed_at'>
        Update: Partial<Omit<ReporteQR, 'id' | 'created_at'>>
      }
      user_api_keys: {
        Row: UserApiKey
        Insert: Omit<UserApiKey, 'id' | 'created_at' | 'last_used_at'>
        Update: Partial<Omit<UserApiKey, 'id' | 'created_at'>>
      }
    }
  }
}
