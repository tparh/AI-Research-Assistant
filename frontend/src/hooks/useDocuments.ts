import { useEffect, useState } from 'react'
import { getDocuments } from '../api/client'
import type { DocumentSummary } from '../types/api'

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const nextDocuments = await getDocuments()
      setDocuments(nextDocuments)
    } catch (err) {
      setError('Unable to load the document library right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()

    const onRefresh = () => {
      void load()
    }

    window.addEventListener('documents:refresh', onRefresh)
    return () => window.removeEventListener('documents:refresh', onRefresh)
  }, [])

  return { documents, loading, error, refresh: load }
}
