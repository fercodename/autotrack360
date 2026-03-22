'use client'

import { AlertCircle, CheckCircle } from 'lucide-react'

interface AlertBannerProps {
  variant: 'error' | 'success'
  children: React.ReactNode
}

const styles = {
  error: 'bg-red-500/10 border border-red-500/20 text-red-400',
  success: 'bg-green-500/10 border border-green-500/20 text-green-400',
}

const icons = {
  error: AlertCircle,
  success: CheckCircle,
}

export function AlertBanner({ variant, children }: AlertBannerProps) {
  const Icon = icons[variant]
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${styles[variant]}`}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      {children}
    </div>
  )
}
