import { useEffect, useState } from 'react'
import { getHealth } from '../api/client'

export function useHealth() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      try {
        await getHealth()
        if (!cancelled) {
          setStatus('online')
        }
      } catch {
        if (!cancelled) {
          setStatus('offline')
        }
      }
    }

    void refresh()
    const interval = window.setInterval(() => {
      void refresh()
    }, 15000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  return status
}
