'use client'

const THIN_SPACE = '\u2009' // espacio fino entre letras y números

/**
 * Formatea la patente con separación reducida tipo placa:
 * 7 caracteres (AB123CD) → "AB‹thin›123‹thin›CD" | 6 (ABC123) → "ABC‹thin›123"
 */
function formatPatenteDisplay(patente: string): string {
  const clean = patente.replace(/\s/g, '').toUpperCase()
  if (clean.length === 7 && /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(clean)) {
    return `${clean.slice(0, 2)}${THIN_SPACE}${clean.slice(2, 5)}${THIN_SPACE}${clean.slice(5, 7)}`
  }
  if (clean.length === 6 && /^[A-Z]{3}\d{3}$/.test(clean)) {
    return `${clean.slice(0, 3)}${THIN_SPACE}${clean.slice(3, 6)}`
  }
  return clean
}

/**
 * Marco tipo placa Argentina / Mercosur.
 * Referencia: franja azul con "REPUBLICA ARGENTINA", área blanca con patente, bordes dobles.
 */
export function PatentePlate({
  patente,
  className = '',
  size = 'md',
}: {
  patente: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const bandHeight = { sm: 'h-3', md: 'h-3.5', lg: 'h-4' }
  const bandTextSize = { sm: 'text-[0.4rem]', md: 'text-[0.4rem]', lg: 'text-[0.45rem]' }
  const bandLabel = { sm: 'REP. ARGENTINA', md: 'REPUBLICA ARGENTINA', lg: 'REPUBLICA ARGENTINA' }
  const whiteMinHeight = { sm: 'min-h-[1.5rem]', md: 'min-h-[1.75rem]', lg: 'min-h-[2.25rem]' }
  const patenteFontSize = { sm: 'text-[0.85rem]', md: 'text-[1.1rem]', lg: 'text-[1.4rem]' }
  const containerWidth = { sm: 'w-[5.5rem]', md: 'w-[7rem]', lg: 'w-[8.5rem]' }

  return (
    <div
      className={`inline-flex flex-col rounded-md overflow-hidden shadow-md flex-shrink-0 ${containerWidth[size]} ${className}`}
      style={{ fontFamily: 'var(--font-mono), monospace' }}
    >
      <div className="rounded-md p-[2px] bg-neutral-400">
        <div className="rounded-[3px] border border-black overflow-hidden">
          <div
            className={`${bandHeight[size]} flex items-center justify-center flex-shrink-0 ${bandTextSize[size]} font-bold text-white tracking-wider uppercase`}
            style={{ backgroundColor: '#1e40af' }}
          >
            {bandLabel[size]}
          </div>
          <div
            className={`bg-white flex items-center justify-center font-black text-black uppercase leading-none py-0.5 px-1 ${whiteMinHeight[size]} ${patenteFontSize[size]}`}
            style={{ letterSpacing: '0.04em' }}
          >
            {formatPatenteDisplay(patente)}
          </div>
        </div>
      </div>
    </div>
  )
}
