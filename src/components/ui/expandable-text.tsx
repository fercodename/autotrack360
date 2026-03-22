'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpandableTextProps {
  text: string
  maxLines?: number
  className?: string
}

export function ExpandableText({ text, maxLines = 3, className }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Estimar si el texto necesita expansión (más de X caracteres o saltos de línea)
  const needsExpansion = text.length > 150 || text.split('\n').length > maxLines

  if (!needsExpansion) {
    return (
      <p className={cn('text-slate-300 whitespace-pre-wrap', className)}>
        {text}
      </p>
    )
  }

  return (
    <div>
      <p 
        className={cn(
          'text-slate-300 whitespace-pre-wrap transition-all',
          !isExpanded && 'line-clamp-3',
          className
        )}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1"
      >
        {isExpanded ? (
          <>
            Ver menos
            <ChevronUp className="h-4 w-4" />
          </>
        ) : (
          <>
            Ver más
            <ChevronDown className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  )
}
