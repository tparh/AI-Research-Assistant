import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  Filter,
  Layers,
  Loader2,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { ChatSource, DocumentSummary } from '../types/api'
import { useChatSession } from '../hooks/useChatSession'

interface HomePageProps {
  documents: DocumentSummary[]
  loading: boolean
  error: string | null
  onUploadClick: () => void
}

const researchPrompts = [
  'What is the central problem or research question addressed?',
  'Summarize the methodology, models, and datasets used.',
  'What are the primary findings and quantitative results?',
  'What limitations, threats to validity, or future work are stated?',
]

export function HomePage({ documents, loading, error, onUploadClick }: HomePageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [input, setInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeInspectorSource, setActiveInspectorSource] = useState<ChatSource | null>(null)
  const [filterAllDocs, setFilterAllDocs] = useState(false)

  const feedRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const requestedDocId = searchParams.get('docId')
  const selectedDocId = documents.some((doc) => doc.doc_id === requestedDocId)
    ? requestedDocId
    : documents[0]?.doc_id ?? null

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.doc_id === selectedDocId) ?? null,
    [documents, selectedDocId],
  )

  // doc_ids sent to backend: if filterAllDocs is true, pass undefined (searches whole Chroma collection)
  // otherwise pass [selectedDocId]
  const activeQueryDocIds = filterAllDocs || !selectedDocId ? undefined : [selectedDocId]

  const { sessionId, messages, loading: sending, error: chatError, send, reset } = useChatSession(
    filterAllDocs ? null : selectedDocId,
    selectedDocument?.filename,
  )

  useEffect(() => {
    if (selectedDocId && requestedDocId !== selectedDocId && !filterAllDocs) {
      setSearchParams({ docId: selectedDocId }, { replace: true })
    }
  }, [requestedDocId, selectedDocId, setSearchParams, filterAllDocs])

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const selectDocument = (docId: string) => {
    setFilterAllDocs(false)
    setSearchParams(docId ? { docId } : {}, { replace: true })
  }

  const handleSend = async (questionText = input) => {
    const text = questionText.trim()
    if (!text || sending) return
    setInput('')
    await send(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <p className="text-xs text-slate-400 font-mono">Loading document library from ChromaDB...</p>
      </div>
    )
  }

  // Error loading documents
  if (error && documents.length === 0) {
    return (
      <div className="mx-auto my-12 max-w-lg rounded-xl border border-rose-800/40 bg-rose-950/20 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-400 mb-2" />
        <h2 className="text-sm font-semibold text-rose-200">Unable to Connect to Backend</h2>
        <p className="mt-1 text-xs text-rose-300/80 leading-relaxed">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-rose-700/50 bg-rose-900/40 px-3 py-1.5 text-xs text-white hover:bg-rose-900/80"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    )
  }

  // Zero-state: No documents uploaded yet
  if (documents.length === 0) {
    return (
      <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 mb-4">
          <BookOpen size={22} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Research Document Workspace
        </h1>
        <p className="mt-2 text-xs text-slate-400 max-w-md leading-relaxed">
          Upload research papers or academic PDFs. The backend parses pages with PyPDF, generates embeddings using Sentence Transformers, and answers your queries with exact citations.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-sky-500 shadow-sm"
          >
            <Upload size={14} /> Import First Paper
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 text-left w-full border-t border-slate-800 pt-6">
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
            <span className="text-[11px] font-bold text-slate-300 block">1. Precise Ingestion</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block leading-normal">
              1000-character chunks with 200 overlap to maintain boundary context.
            </span>
          </div>
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
            <span className="text-[11px] font-bold text-slate-300 block">2. Semantic Vector Space</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block leading-normal">
              Chunks embedded into 384 dimensions and indexed into ChromaDB.
            </span>
          </div>
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
            <span className="text-[11px] font-bold text-slate-300 block">3. Cited Answers</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block leading-normal">
              Every retrieved excerpt links directly to its source page and chunk ID.
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col lg:flex-row gap-4 max-w-7xl mx-auto overflow-hidden">
      {/* Center Chat Work Area */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#0f1626]">
        {/* Workspace Context Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#121b2f] px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Query Scope:
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterAllDocs(!filterAllDocs)}
                className={`rounded px-2 py-1 text-xs font-mono transition-colors border ${
                  filterAllDocs
                    ? 'border-sky-500 bg-sky-950/60 text-sky-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
                title="Search across all indexed documents instead of one target paper"
              >
                {filterAllDocs ? 'Entire Corpus (All Papers)' : 'Single Paper'}
              </button>

              {!filterAllDocs && (
                <div className="relative">
                  <select
                    value={selectedDocId ?? ''}
                    onChange={(e) => selectDocument(e.target.value)}
                    className="max-w-[240px] truncate rounded border border-slate-700 bg-slate-900 py-1 pl-2.5 pr-7 text-xs font-medium text-slate-200 outline-none focus:border-sky-500"
                  >
                    {documents.map((doc) => (
                      <option key={doc.doc_id} value={doc.doc_id} className="bg-slate-900 text-white">
                        {doc.filename ?? doc.doc_id}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedDocument && !filterAllDocs && (
              <Link
                to={`/documents/${selectedDocId}`}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
              >
                Inspect Paper Details
              </Link>
            )}
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={reset}
              className="text-[11px] text-slate-400 hover:text-slate-200"
              title="Clear active chat messages"
            >
              Reset Chat
            </button>
          </div>
        </div>

        {/* Message Feed Canvas */}
        <div ref={feedRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                    isUser ? 'bg-sky-600 text-white order-2' : 'bg-slate-800 text-slate-300 order-1'
                  }`}
                >
                  {isUser ? <User size={14} /> : <Bot size={15} />}
                </div>

                {/* Message Body */}
                <div
                  className={`group relative rounded-lg p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-sky-600 text-white order-1 max-w-xl'
                      : 'border border-slate-800 bg-[#141d31] text-slate-200 order-2 flex-1'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{msg.text}</div>

                  {/* Supporting Evidence Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3.5 border-t border-slate-800/80 pt-3">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Retrieved Evidence ({msg.sources.length} sources from ChromaDB)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((source, idx) => (
                          <button
                            key={`${source.doc_id}-${idx}`}
                            type="button"
                            onClick={() => setActiveInspectorSource(source)}
                            className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/90 px-2 py-1 text-[11px] font-mono text-slate-300 hover:border-sky-500 hover:text-white transition-colors"
                          >
                            <FileText size={11} className="text-sky-400" />
                            <span className="truncate max-w-[150px]">
                              {source.filename ?? 'Document'}
                            </span>
                            {typeof source.page_number === 'number' && (
                              <span className="text-slate-400">p.{source.page_number}</span>
                            )}
                            {typeof source.chunk_index === 'number' && (
                              <span className="text-slate-400">#{source.chunk_index}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => copyText(msg.text, msg.id)}
                    className="absolute right-2 top-2 rounded p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-800 hover:text-white transition"
                    title="Copy response text"
                  >
                    {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            )
          })}

          {sending && (
            <div className="flex items-center gap-2.5 text-xs text-slate-400 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
              <span>Embedding query vector & retrieving ChromaDB chunks...</span>
            </div>
          )}
        </div>

        {/* Query Input Toolbar */}
        <div className="border-t border-slate-800 bg-[#121b2f] p-3 space-y-2">
          {/* Preset Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-400 font-mono shrink-0">Prompts:</span>
            {researchPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => void handleSend(prompt)}
                disabled={sending}
                className="whitespace-nowrap rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-300 hover:border-slate-500 hover:text-white transition disabled:opacity-50"
              >
                {prompt.length > 40 ? prompt.slice(0, 38) + '…' : prompt}
              </button>
            ))}
          </div>

          {/* Text Input & Submit */}
          <div className="relative flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder={
                selectedDocument
                  ? `Ask a question about ${selectedDocument.filename ?? 'the paper'}...`
                  : 'Ask about the uploaded research...'
              }
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 outline-none leading-relaxed font-sans"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={sending || !input.trim()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white transition hover:bg-sky-500 disabled:opacity-40"
              title="Submit Query (Enter)"
            >
              <Send size={15} />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
            <span>Enter to send · Shift+Enter for newline</span>
            <span>Session: {sessionId.slice(-6)}</span>
          </div>
        </div>
      </div>

      {/* Right Drawer: Evidence Inspector */}
      {activeInspectorSource && (
        <div className="w-full lg:w-80 flex flex-col rounded-xl border border-slate-800 bg-[#0f1626] overflow-hidden shrink-0">
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#121b2f] px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <FileText size={14} className="text-sky-400" />
              <span>Evidence Inspector</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveInspectorSource(null)}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-3.5 space-y-3 flex-1 overflow-y-auto text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Document</span>
              <span className="font-semibold text-slate-200 break-words block mt-0.5">
                {activeInspectorSource.filename ?? activeInspectorSource.doc_id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 border-y border-slate-800/80 py-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Page:</span>
                <span className="text-slate-200 font-bold">{activeInspectorSource.page_number ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Chunk Index:</span>
                <span className="text-slate-200 font-bold">#{activeInspectorSource.chunk_index ?? 'N/A'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Document UUID</span>
              <span className="font-mono text-[10px] text-slate-400 select-all break-all block mt-0.5">
                {activeInspectorSource.doc_id ?? 'Unknown'}
              </span>
            </div>

            {activeInspectorSource.doc_id && (
              <Link
                to={`/documents/${activeInspectorSource.doc_id}`}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 py-2 text-xs font-medium text-sky-400 hover:bg-slate-800 hover:text-sky-300 transition"
              >
                <span>Browse Full Document Chunks</span>
                <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}