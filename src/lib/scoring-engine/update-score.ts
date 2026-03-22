import { SupabaseClient } from '@supabase/supabase-js'
import { calculateTrustScore } from './calculator'
import { Database, Evento, Vehiculo } from '@/types/database'

export async function updateVehicleTrustScore(
  supabase: SupabaseClient<Database>,
  vehiculoId: string
): Promise<number> {
  // Obtener el vehículo
  const { data: vehiculo, error: vehiculoError } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('id', vehiculoId)
    .single()

  if (vehiculoError || !vehiculo) {
    console.error('Error fetching vehicle:', vehiculoError)
    return 0
  }

  const { data: todosEventos, error: eventosError } = await supabase
    .from('eventos')
    .select('*')
    .eq('vehiculo_id', vehiculoId)
    .eq('is_hidden', false)
    .order('fecha_evento', { ascending: false })

  const eventos = (todosEventos || []).filter(e => e.approval_status === 'aprobado' || e.approval_status == null)

  if (eventosError) {
    console.error('Error fetching events:', eventosError)
    return 0
  }

  // Calcular el nuevo score
  const scoreBreakdown = calculateTrustScore(
    vehiculo as Vehiculo,
    (eventos || []) as Evento[]
  )

  // Actualizar el vehículo con el nuevo score
  const { error: updateError } = await supabase
    .from('vehiculos')
    .update({
      trust_score: scoreBreakdown.total,
      last_score_update: new Date().toISOString(),
    })
    .eq('id', vehiculoId)

  if (updateError) {
    console.error('Error updating trust score:', updateError)
  }

  return scoreBreakdown.total
}
