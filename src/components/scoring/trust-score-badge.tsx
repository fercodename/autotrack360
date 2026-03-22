'use client'

import { cn } from '@/lib/utils'
import { getTrustScoreLabel } from '@/lib/scoring-engine'
import { Shield } from 'lucide-react'

interface TrustScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function TrustScoreBadge({ score, size = 'md', showLabel = true }: TrustScoreBadgeProps) {
  const { label, description } = getTrustScoreLabel(score)
  
  const sizes = {
    sm: {
      container: 'w-14 h-14',
      text: 'text-lg',
      icon: 'h-3 w-3',
      labelText: 'text-xs',
    },
    md: {
      container: 'w-20 h-20',
      text: 'text-2xl',
      icon: 'h-4 w-4',
      labelText: 'text-sm',
    },
    lg: {
      container: 'w-28 h-28',
      text: 'text-4xl',
      icon: 'h-5 w-5',
      labelText: 'text-base',
    },
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return { color: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' }
    if (score >= 60) return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' }
    if (score >= 40) return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' }
    if (score >= 20) return { color: '#f97316', glow: 'rgba(249, 115, 22, 0.3)' }
    return { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' }
  }

  const { color: scoreColor, glow } = getScoreColor(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={cn(
          'relative rounded-full flex items-center justify-center',
          sizes[size].container
        )}
        style={{
          background: `conic-gradient(${scoreColor} ${score * 3.6}deg, #334155 ${score * 3.6}deg)`,
          boxShadow: `0 0 20px ${glow}`,
        }}
      >
        <div className={cn(
          'absolute inset-1.5 bg-surface-dark rounded-full flex items-center justify-center',
        )}>
          <span 
            className={cn('font-bold', sizes[size].text)}
            style={{ color: scoreColor }}
          >
            {score}
          </span>
        </div>
      </div>
      
      {showLabel && (
        <div className="text-center">
          <div 
            className={cn('font-semibold flex items-center justify-center gap-1', sizes[size].labelText)}
            style={{ color: scoreColor }}
          >
            <Shield className={sizes[size].icon} />
            {label}
          </div>
          {size === 'lg' && (
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      )}
    </div>
  )
}
