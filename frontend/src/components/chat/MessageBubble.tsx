import { Copy, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  text: string
  sources?: Array<{ filename?: string; page_number?: number; chunk_index?: number }>
}

export function MessageBubble({ role, text, sources }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={`grid gap-4 rounded-[28px] border p-6 transition break-words ${role === 'user' ? 'border-slate-700 bg-slate-900/95' : 'border-slate-800 bg-slate-950/95'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{role === 'user' ? 'You' : 'Assistant'}</p>
          <p className="text-xs text-slate-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          {copied ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="prose prose-invert max-w-none text-slate-200">
        {text.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>

      {sources?.length ? (
        <div className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
          <p className="text-sm uppercase tracking-[0.24em] text-sky-400/80">Sources</p>
          <div className="grid gap-3">
            {sources.map((source, index) => (
              <div key={index} className="rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{source.filename ?? 'Unknown source'}</p>
                <p className="mt-1 text-slate-500">Page {source.page_number ?? '?'} · Chunk {source.chunk_index ?? '?'}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
