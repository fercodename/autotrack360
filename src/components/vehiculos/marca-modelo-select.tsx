'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

interface Option {
  id: number
  nombre: string
}

interface ComboboxProps {
  label: string
  placeholder: string
  options: Option[]
  value: string
  selectedId: number | null
  onChange: (value: string, id: number | null) => void
  disabled?: boolean
  required?: boolean
  isLoading?: boolean
}

function Combobox({
  label,
  placeholder,
  options,
  value,
  selectedId,
  onChange,
  disabled = false,
  required = false,
  isLoading = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter((o) =>
    o.nombre.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((opt: Option) => {
    onChange(opt.nombre, opt.id)
    setIsOpen(false)
    setSearch('')
  }, [onChange])

  const handleInputChange = useCallback((text: string) => {
    setSearch(text)
    onChange(text, null)
    if (!isOpen) setIsOpen(true)
  }, [onChange, isOpen])

  const handleClear = useCallback(() => {
    onChange('', null)
    setSearch('')
    inputRef.current?.focus()
  }, [onChange])

  return (
    <div className="w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}{required && ' *'}</label>
      <div className="relative">
        <div
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-text
            ${isOpen ? 'ring-2 ring-accent/50 border-accent' : 'border-slate-700'}
            ${disabled ? 'bg-slate-800 opacity-50 cursor-not-allowed' : 'bg-surface-light/50'}
          `}
          onClick={() => {
            if (!disabled) {
              setIsOpen(true)
              inputRef.current?.focus()
            }
          }}
        >
          <Search className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? search || value : value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => { if (!disabled) setIsOpen(true) }}
            placeholder={placeholder}
            disabled={disabled}
            required={required && !value}
            className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm min-w-0"
          />
          {value && !disabled && (
            <button type="button" onClick={handleClear} className="text-slate-500 hover:text-slate-300">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-slate-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-surface-dark border border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-slate-500">Cargando...</div>
            ) : filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-accent/10
                    ${selectedId === opt.id ? 'text-accent font-medium bg-accent/5' : 'text-slate-300'}
                  `}
                >
                  {opt.nombre}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-slate-500">
                {search ? `"${search}" — se usará como texto libre` : 'No hay opciones'}
              </div>
            )}
          </div>
        )}
      </div>
      {selectedId && (
        <p className="mt-1 text-xs text-green-400/70">✓ Marca normalizada</p>
      )}
    </div>
  )
}

// ─── Main Component ───

interface MarcaModeloSelectProps {
  marca: string
  marcaId: number | null
  modelo: string
  modeloId: number | null
  onMarcaChange: (marca: string, marcaId: number | null) => void
  onModeloChange: (modelo: string, modeloId: number | null) => void
}

export function MarcaModeloSelect({
  marca,
  marcaId,
  modelo,
  modeloId,
  onMarcaChange,
  onModeloChange,
}: MarcaModeloSelectProps) {
  const [marcas, setMarcas] = useState<Option[]>([])
  const [modelos, setModelos] = useState<Option[]>([])
  const [loadingMarcas, setLoadingMarcas] = useState(true)
  const [loadingModelos, setLoadingModelos] = useState(false)

  // Fetch marcas al mount
  useEffect(() => {
    fetch('/api/marcas')
      .then((r) => r.json())
      .then((data) => setMarcas(data))
      .catch(() => setMarcas([]))
      .finally(() => setLoadingMarcas(false))
  }, [])

  // Fetch modelos cuando cambia la marca seleccionada
  useEffect(() => {
    if (!marcaId) {
      setModelos([])
      return
    }
    setLoadingModelos(true)
    fetch(`/api/marcas/${marcaId}/modelos`)
      .then((r) => r.json())
      .then((data) => setModelos(data))
      .catch(() => setModelos([]))
      .finally(() => setLoadingModelos(false))
  }, [marcaId])

  const handleMarcaChange = useCallback((value: string, id: number | null) => {
    onMarcaChange(value, id)
    // Si cambió la marca, resetear modelo
    if (id !== marcaId) {
      onModeloChange('', null)
    }
  }, [onMarcaChange, onModeloChange, marcaId])

  return (
    <div className="grid grid-cols-2 gap-4">
      <Combobox
        label="Marca"
        placeholder="Ej: Volkswagen"
        options={marcas}
        value={marca}
        selectedId={marcaId}
        onChange={handleMarcaChange}
        required
        isLoading={loadingMarcas}
      />
      <Combobox
        label="Modelo"
        placeholder={marcaId ? 'Ej: Gol' : 'Elegí una marca primero'}
        options={modelos}
        value={modelo}
        selectedId={modeloId}
        onChange={onModeloChange}
        disabled={!marca}
        required
        isLoading={loadingModelos}
      />
    </div>
  )
}
