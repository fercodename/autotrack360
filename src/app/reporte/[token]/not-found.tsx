import Link from 'next/link'
import { Car, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

export default function ReporteNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Link inválido o no disponible
          </h1>
          <p className="text-gray-600 mb-6">
            Este enlace no existe, fue revocado o expiró. Pedile al propietario del vehículo que genere un nuevo reporte.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:underline font-medium"
          >
            <Car className="h-4 w-4" />
            Ir a AutoTrack 360°
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
