import { useEffect, useRef, useState } from 'react'
import { postChat } from '../api/client'
import type { ChatResponse, ChatSource } from '../types/api'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  sources?: ChatSource[]
}

const createSessionId = () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createWelcomeMessage = (documentName?: string): ChatMessage => ({
  id: `welcome-${Date.now()}`,
  role: 'assistant',
  text: documentName
    ? `I'm ready to help you explore ${documentName}. Ask about its methods, findings, evidence, or limitations.`
    : 'Upload a research document and I will help you explore its methods, findings, evidence, and limitations.',
})

export function useChatSession(selectedDocId: string | null, documentName?: string) {
  const [sessionId, setSessionId] = useState(createSessionId)
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage(documentName)])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previousDocId = useRef(selectedDocId)

  useEffect(() => {
    if (previousDocId.current === selectedDocId) return

    previousDocId.current = selectedDocId
    setSessionId(createSessionId())
    setMessages([createWelcomeMessage(documentName)])
    setError(null)
  }, [documentName, selectedDocId])

  const send = async (question: string) => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || loading) return

    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', text: trimmedQuestion }])
    setError(null)
    setLoading(true)

    try {
      const response: ChatResponse = await postChat({
        session_id: sessionId,
        question: trimmedQuestion,
        doc_ids: selectedDocId ? [selectedDocId] : undefined,
      })

      setMessages((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: response.answer,
        sources: response.sources,
      }])

      if (response.error) setError(response.answer)
    } catch {
      const message = 'The assistant could not respond right now. Check the backend connection and try again.'
      setError(message)
      setMessages((current) => [...current, { id: `error-${Date.now()}`, role: 'assistant', text: message }])
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setSessionId(createSessionId())
    setMessages([createWelcomeMessage(documentName)])
    setError(null)
  }

  return { sessionId, messages, loading, error, send, reset }
}