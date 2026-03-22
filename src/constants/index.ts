import { EventType, UserRole, VerificationLevel, EventApprovalStatus } from '@/types/database'

export const EVENT_APPROVAL_STATUS: Record<EventApprovalStatus, { label: string; short: string }> = {
  pendiente_aprobacion: { label: 'Pendiente de aprobación del propietario', short: 'Pendiente' },
  aprobado: { label: 'Aprobado - en historial', short: 'Aprobado' },
  rechazado: { label: 'Rechazado por el propietario', short: 'Rechazado' },
}

export const USER_ROLES: Record<UserRole, { label: string; description: string }> = {
  propietario: {
    label: 'Propietario',
    description: 'Dueño del vehículo. Puede agregar vehículos y registrar eventos.',
  },
  taller: {
    label: 'Taller',
    description: 'Taller mecánico verificado. Puede firmar eventos en vehículos autorizados.',
  },
  comprador: {
    label: 'Comprador',
    description: 'Usuario interesado en comprar. Solo puede ver reportes compartidos.',
  },
}

export const EVENT_TYPES: Record<EventType, { label: string; icon: string; color: string }> = {
  service: {
    label: 'Service',
    icon: 'Wrench',
    color: 'blue',
  },
  reparacion: {
    label: 'Reparación',
    icon: 'Settings',
    color: 'orange',
  },
  vtv: {
    label: 'VTV',
    icon: 'ClipboardCheck',
    color: 'green',
  },
  inspeccion: {
    label: 'Inspección',
    icon: 'Search',
    color: 'purple',
  },
  otro: {
    label: 'Otro',
    icon: 'FileText',
    color: 'gray',
  },
}

export const VERIFICATION_LEVELS: Record<VerificationLevel, { 
  label: string
  description: string
  color: string
  bgColor: string
  weight: number 
}> = {
  A: {
    label: 'Verificado por Taller',
    description: 'Evento firmado digitalmente por un taller verificado',
    color: 'text-trust-high',
    bgColor: 'bg-trust-high',
    weight: 1.0,
  },
  B: {
    label: 'Con Evidencia',
    description: 'Evento con archivos adjuntos sellados con hash',
    color: 'text-trust-medium',
    bgColor: 'bg-trust-medium',
    weight: 0.7,
  },
  C: {
    label: 'Declarativo',
    description: 'Evento declarado sin evidencia verificable',
    color: 'text-trust-low',
    bgColor: 'bg-trust-low',
    weight: 0.3,
  },
}

export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  documents: ['application/pdf'],
  spreadsheets: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  all: [] as string[],
}

ALLOWED_FILE_TYPES.all = [
  ...ALLOWED_FILE_TYPES.images,
  ...ALLOWED_FILE_TYPES.documents,
  ...ALLOWED_FILE_TYPES.spreadsheets,
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const TRUST_SCORE_WEIGHTS = {
  cobertura: 0.30,
  frescura: 0.25,
  nivelVerificacion: 0.35,
  consistencia: 0.10,
}

export const QR_REPORT_DEFAULT_TTL_HOURS = 72 // 3 días

export const TALLER_ESPECIALIDADES = [
  'Mecánica general',
  'Electricidad',
  'Chapa y pintura',
  'Alineación y balanceo',
  'Frenos',
  'Suspensión',
  'Aire acondicionado',
  'Inyección electrónica',
  'Cambio de aceite',
  'Neumáticos',
  'Transmisión',
  'Diagnóstico computarizado',
] as const
