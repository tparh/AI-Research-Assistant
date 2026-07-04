import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ChevronRight, Loader2, MessageSquare, Repeat, Trash2 } from 'lucide-react'
import { postChat } from '../../api/client'
import { MessageBubble } from './MessageBubble'

interface ChatWindowProps {
  selectedDocument: string | null
}

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  sources?: Array<{ filename?: string; page_number?: number; chunk_index?: number }>
}

const initialMessages: ChatMessage[] = [
  {
    role: 'assistant',
    text: 'Ask a question about your uploaded PDF to get started. The assistant will cite page numbers and source snippets when available.',
  },
]

export function ChatWindow({ selectedDocument }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Ready')
  const feedRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const validInput = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  const handleSend = useCallback(async () => {
    if (!validInput) return
    const prompt = input.trim()
    setMessages((prev) => [...prev, { role: 'user', text: prompt }])
    setInput('')
    setLoading(true)
    setStatus('Thinking...')

    try {
      const chatResponse = await postChat({ session_id: 'session-1', question: prompt, doc_ids: selectedDocument ? [selectedDocument] : undefined })
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: chatResponse.answer,
          sources: chatResponse.sources,
        },
      ])
      setStatus('Ready')
    } catch (error) {
      console.error(error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sorry, something went wrong while fetching your answer. Please try again.' },
      ])
      setStatus('Error')
    } finally {
      setLoading(false)
    }
  }, [selectedDocument, validInput, input])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  return (
    <div className="grid gap-6">
      <div className="rounded-[28px] border border-slate-800 bg-slate-900/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-sky-400/80">Chat session</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Research assistant</h3>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full bg-slate-950 px-4 py-2 text-sm text-slate-200">
            <MessageSquare size={18} />
            <span>{status}</span>
          </div>
        </div>
      </div>

      <div ref={feedRef} className="flex max-h-[520px] flex-col gap-4 overflow-y-auto rounded-[32px] border border-slate-800 bg-slate-950/95 p-4">
        {messages.map((message, index) => (
          <MessageBubble key={`${message.role}-${index}`} role={message.role} text={message.text} sources={message.sources} />
        ))}
      </div>

      <div className="grid gap-4 rounded-[32px] border border-slate-800 bg-slate-900/95 p-5">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question here. Shift + Enter for a new line."
          className="min-h-[160px] resize-none rounded-3xl border border-slate-800 bg-slate-950 px-5 py-4 text-slate-100 outline-none transition focus:border-sky-500"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2">Enter to send</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2">Shift + Enter newline</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMessages(initialMessages)}
              className="rounded-full border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Clear chat
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!validInput}
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
