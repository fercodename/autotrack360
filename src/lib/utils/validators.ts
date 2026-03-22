import { z } from 'zod'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/constants'

export const patenteSchema = z.string()
  .min(6, 'La patente debe tener al menos 6 caracteres')
  .max(7, 'La patente no puede tener más de 7 caracteres')
  .regex(
    /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/i,
    'Formato de patente inválido (ej: ABC123 o AB123CD)'
  )
  .transform(val => val.toUpperCase())

export const vehiculoSchema = z.object({
  patente: patenteSchema,
  marca: z.string().min(1, 'La marca es requerida').max(100),
  modelo: z.string().min(1, 'El modelo es requerido').max(100),
  anio: z.number()
    .min(1900, 'El año debe ser mayor a 1900')
    .max(new Date().getFullYear() + 1, 'El año no puede ser futuro'),
  vin: z.string().length(17, 'El VIN debe tener 17 caracteres').optional().or(z.literal('')),
  color: z.string().max(50).optional(),
  tipo_combustible: z.string().max(50).optional(),
  kilometraje_actual: z.number().min(0, 'El kilometraje no puede ser negativo').optional(),
})

export const eventoSchema = z.object({
  tipo: z.enum(['service', 'reparacion', 'vtv', 'inspeccion', 'otro']),
  titulo: z.string().min(1, 'El título es requerido').max(255),
  descripcion: z.string().max(2000).optional(),
  fecha_evento: z.string().refine(
    date => !isNaN(Date.parse(date)) && new Date(date) <= new Date(),
    'La fecha no puede ser futura'
  ),
  kilometraje: z.number().min(0).optional(),
  costo: z.number().min(0).optional(),
})

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.all.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: ${file.type}`,
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo excede el límite de ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

export function formatPatente(patente: string): string {
  const clean = patente.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  if (/^[A-Z]{3}\d{3}$/.test(clean)) return clean
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(clean)) return clean
  return clean
}

/** Variantes de patente para búsqueda (con y sin espacios) */
export function patenteSearchVariants(patente: string): string[] {
  const clean = patente.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const variants = [clean]
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(clean)) {
    variants.push(`${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 7)}`)
  } else if (/^[A-Z]{3}\d{3}$/.test(clean)) {
    variants.push(`${clean.slice(0, 3)} ${clean.slice(3, 6)}`)
  }
  return [...new Set(variants)]
}

/** Email: formato estándar */
export const emailSchema = z
  .string()
  .min(1, 'El email es requerido')
  .email('Ingresá un email válido (ej: nombre@dominio.com)')
  .max(255)

/** Teléfono: solo dígitos, opcional + al inicio; 8 a 15 dígitos (internacional) */
export const phoneSchema = z
  .string()
  .max(30)
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true
      const digits = val.replace(/\D/g, '')
      return digits.length >= 8 && digits.length <= 15
    },
    { message: 'Ingresá un teléfono válido (8 a 15 dígitos, con o sin espacios/guiones)' }
  )
  .optional()
  .or(z.literal(''))

/** Datos de contacto del propietario (taller): todos opcionales; si se ingresan, formato válido */
export const contactoSchema = z.object({
  contact_name: z.string().max(200).optional().or(z.literal('')),
  contact_email: z.union([
    z.literal(''),
    z.string().min(1, 'Si ingresás email debe ser válido').email('Ingresá un email válido (ej: nombre@dominio.com)').max(255),
  ]).optional(),
  contact_phone: phoneSchema,
})

export const tallerPerfilSchema = z.object({
  business_name: z.string().min(1, 'El nombre comercial es requerido').max(200),
  cuit: z.string().max(13).refine(
    (val) => {
      if (!val || val.trim() === '') return true
      return /^\d{2}-?\d{8}-?\d{1}$/.test(val.replace(/\s/g, ''))
    },
    { message: 'Formato de CUIT inválido (ej: 20-12345678-9)' }
  ).optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  telefono_comercial: phoneSchema,
  email_comercial: z.union([
    z.literal(''),
    z.string().email('Ingresá un email válido').max(255),
  ]).optional(),
  especialidades: z.array(z.string()).default([]),
  horario: z.string().max(200).optional().or(z.literal('')),
})

export type VehiculoFormData = z.infer<typeof vehiculoSchema>
export type EventoFormData = z.infer<typeof eventoSchema>
export type ContactoFormData = z.infer<typeof contactoSchema>
export type TallerPerfilFormData = z.infer<typeof tallerPerfilSchema>

/** Valida un par de passwords. Retorna null si OK o el mensaje de error. */
export function validatePasswordPair(password: string, confirmPassword: string): string | null {
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
  if (password !== confirmPassword) return 'Las contraseñas no coinciden'
  return null
}
