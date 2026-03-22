'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search, User, ChevronDown, ChevronRight, Car, Phone, Mail } from 'lucide-react'
import { Card, CardContent, PatentePlate, Input } from '@/components/ui'

interface ClienteVehiculo {
  id: string
  patente: string
  marca: string
  modelo: string
  anio: number
  lastServiceDate: string | null
}

export interface ClienteGroup {
  name: string
  phone: string | null
  email: string | null
  vehiculos: ClienteVehiculo[]
}

export function TallerClientesList({ clientes }: { clientes: ClienteGroup[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return clientes
    const q = busqueda.trim().toLowerCase()
    return clientes.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.vehiculos.some(v => v.patente.toLowerCase().includes(q))
    )
  }, [clientes, busqueda])

  const toggle = (idx: number) => {
    setExpandedIdx(prev => prev === idx ? null : idx)
  }

  if (clientes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-surface-light flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Todavía no tenés clientes</h3>
          <p className="text-slate-400">
            Cuando agregues vehículos con datos de contacto del dueño, van a aparecer acá agrupados por cliente.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          placeholder="Buscar por nombre o patente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filtrados.map((cliente, idx) => {
          const isExpanded = expandedIdx === idx
          const totalVehiculos = cliente.vehiculos.length

          return (
            <Card key={`${cliente.name}-${idx}`} className="card-premium-hover">
              <CardContent className="py-0">
                <button
                  onClick={() => toggle(idx)}
                  className="w-full py-4 flex items-center gap-4 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{cliente.name}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      {cliente.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {cliente.phone}
                        </span>
                      )}
                      {cliente.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {cliente.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-surface-light text-slate-300 border border-slate-700">
                      <Car className="h-3 w-3 inline mr-1" />
                      {totalVehiculos}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="pb-4 pl-14 space-y-2 border-t border-slate-800 pt-3">
                    {cliente.vehiculos.map((v) => (
                      <Link
                        key={v.id}
                        href={`/dashboard/taller/vehiculo/${v.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-light transition-colors"
                      >
                        <PatentePlate patente={v.patente} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-300 truncate">
                            {v.marca} {v.modelo} ({v.anio})
                          </p>
                          {v.lastServiceDate && (
                            <p className="text-xs text-slate-500">
                              Último servicio: {format(new Date(v.lastServiceDate), "d MMM yyyy", { locale: es })}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-600" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtrados.length === 0 && busqueda.trim() && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-slate-400">
              No hay clientes que coincidan con &quot;{busqueda.trim()}&quot;.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
