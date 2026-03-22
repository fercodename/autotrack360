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
  const minWidth = { sm: 'min-w-[7rem]', md: 'min-w-[8.5rem]', lg: 'min-w-[10rem]' }
  const bandHeight = { sm: 'h-3', md: 'h-4', lg: 'h-5' }
  const bandTextSize = { sm: 'text-[0.45rem]', md: 'text-[0.4rem]', lg: 'text-[0.45rem]' }
  const bandLabel = { sm: 'Rep. Argentina', md: 'REPUBLICA ARGENTINA', lg: 'REPUBLICA ARGENTINA' }
  const whiteMinHeight = { sm: 'min-h-[1.75rem]', md: 'min-h-[2.25rem]', lg: 'min-h-[2.75rem]' }
  const patenteFontSize = { sm: 'text-[1.1rem]', md: 'text-[1.5rem]', lg: 'text-[1.85rem]' }

  return (
    <div
      className={`inline-flex flex-col rounded-md overflow-hidden shadow-md ${minWidth[size]} ${className}`}
      style={{ fontFamily: 'var(--font-mono), monospace' }}
    >
      {/* Borde exterior gris (marco tipo relieve) */}
      <div className="rounded-md p-[3px] bg-neutral-400">
        {/* Borde interior negro */}
        <div className="rounded-[4px] border-2 border-black overflow-hidden">
          {/* Franja azul - REPUBLICA ARGENTINA */}
          <div
            className={`${bandHeight[size]} flex items-center justify-center flex-shrink-0 ${bandTextSize[size]} font-bold text-white tracking-wider uppercase`}
            style={{ backgroundColor: '#1e40af' }}
          >
            {bandLabel[size]}
          </div>
          {/* Área blanca: altura mínima fija, letras grandes que ocupan la mayor parte */}
          <div
            className={`bg-white flex items-center justify-center font-black text-black uppercase leading-none py-0.5 px-1.5 ${whiteMinHeight[size]} ${patenteFontSize[size]}`}
            style={{ letterSpacing: '0.06em' }}
          >
            {formatPatenteDisplay(patente)}
          </div>
        </div>
      </div>
    </div>
  )
}
