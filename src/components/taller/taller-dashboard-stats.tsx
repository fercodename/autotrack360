import { Car, Clock, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

interface TallerDashboardStatsProps {
  totalVehiculos: number
  pendientesAprobacion: number
  proximasRevisiones: number
}

const stats = [
  { key: 'vehiculos', label: 'Vehículos Clientes', icon: Car, color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
  { key: 'pendientes', label: 'Pendientes Aprobación', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { key: 'revisiones', label: 'Próximas Revisiones', icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
] as const

export function TallerDashboardStats({ totalVehiculos, pendientesAprobacion, proximasRevisiones }: TallerDashboardStatsProps) {
  const values = { vehiculos: totalVehiculos, pendientes: pendientesAprobacion, revisiones: proximasRevisiones }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map(({ key, label, icon: Icon, color, bg }) => (
        <Card key={key} className="card-premium">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{values[key]}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
