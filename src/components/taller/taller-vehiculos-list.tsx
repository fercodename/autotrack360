'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Car, Plus, ChevronRight, Gauge, Wrench, Search } from 'lucide-react'
import { Card, CardContent, PatentePlate, Input, Button } from '@/components/ui'

type VehiculoItem = {
  id: string
  patente: string
  marca: string
  modelo: string
  anio: number
  kilometraje_actual: number
}

function normalizePatente(patente: string): string {
  return patente.replace(/\s/g, '').toUpperCase()
}

export function TallerVehiculosList({ vehiculos }: { vehiculos: VehiculoItem[] }) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return vehiculos
    const q = busqueda.trim().toUpperCase()
    return vehiculos.filter((v) =>
      normalizePatente(v.patente).includes(q) ||
      v.marca.toUpperCase().includes(q) ||
      v.modelo.toUpperCase().includes(q)
    )
  }, [vehiculos, busqueda])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por patente, marca o modelo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
            aria-label="Buscar vehículo por patente, marca o modelo"
          />
        </div>
        <Link href="/dashboard/taller/vehiculo/nuevo" className="sm:flex-shrink-0">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar cliente
          </Button>
        </Link>
      </div>

      {filtrados.length > 0 ? (
        <div className="grid gap-4">
          {filtrados.map((vehiculo) => (
            <Link key={vehiculo.id} href={`/dashboard/taller/vehiculo/${vehiculo.id}`}>
              <Card className="card-premium-hover cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                      <Car className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <PatentePlate patente={vehiculo.patente} size="sm" />
                      <p className="text-slate-300 truncate mt-1">
                        {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
                      </p>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        {vehiculo.kilometraje_actual?.toLocaleString('es-AR')} km
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : vehiculos.length > 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-slate-400">
              No hay vehículos que coincidan con &quot;{busqueda.trim()}&quot;.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {vehiculos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-surface-light flex items-center justify-center mb-4">
              <Wrench className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Empezá cargando un vehículo</h3>
            <p className="text-slate-400 mb-6">
              Ingresá la patente de un vehículo cliente para registrar trabajos, subir evidencias y generar historial verificable.
            </p>
            <Link href="/dashboard/taller/vehiculo/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar vehículo cliente
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
