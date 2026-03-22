'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateVehicleTrustScore } from '@/lib/scoring-engine'
import { Button } from '@/components/ui'

interface RecalculateButtonProps {
  vehiculoId: string
}

export function RecalculateButton({ vehiculoId }: RecalculateButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleRecalculate = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      await updateVehicleTrustScore(supabase, vehiculoId)
      router.refresh()
    } catch (err) {
      console.error('Error recalculating score:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRecalculate}
      disabled={isLoading}
      title="Recalcular Trust Score"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
    </Button>
  )
}
