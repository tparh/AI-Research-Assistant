import React, { useCallback, useEffect, useRef, useState } from 'react'
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
  History,
  Layers,
  Loader2,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UploadCloud,
  User,
  X,
} from 'lucide-react'
import {
  getDocuments,
  getHealth,
  getHistory,
  getRecentSessions,
  postChat,
  uploadPdf,
  getDocumentDetail,
  getSummary,
} from './api/client'
import type {
  ChatHistoryEntry,
  ChatResponse,
  ChatSource,
  DocumentDetail,
  DocumentSummary,
  SessionSummary,
  UploadResponse,
} from './types/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  sources?: ChatSource[]
  error?: boolean
}

export default function App() {
  // Sidebar state (Open / Collapsed like ChatGPT)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Document Library & Sessions
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([])
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)

  // Active Chat Session state
  const [currentSessionId, setCurrentSessionId] = useState<string>(() =>
    `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  )
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null) // null = entire corpus
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Modals / Drawers
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)

  // Document Viewer & Summary Drawer
  const [viewingDocId, setViewingDocId] = useState<string | null>(null)
  const [docDetail, setDocDetail] = useState<DocumentDetail | null>(null)
  const [docDetailLoading, setDocDetailLoading] = useState(false)
  const [docSummary, setDocSummary] = useState<string | null>(null)
  const [docSummaryLoading, setDocSummaryLoading] = useState(false)
  const [chunkSearch, setChunkSearch] = useState('')

  // Selected Evidence Inspector Drawer
  const [inspectSource, setInspectSource] = useState<ChatSource | null>(null)

  const feedEndRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // 1. Initial Data Fetching (Health, Documents, History sessions)
  const refreshAll = useCallback(async () => {
    try {
      const health = await getHealth()
      setBackendOnline(health?.status === 'ok')
    } catch {
      setBackendOnline(false)
    }

    try {
      setDocsLoading(true)
      const docs = await getDocuments()
      setDocuments(docs)
    } catch {
      // fallback
    } finally {
      setDocsLoading(false)
    }

    try {
      const sess = await getRecentSessions()
      setRecentSessions(sess)
    } catch {
      // fallback
    }
  }, [])

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  // Scroll to bottom of chat
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [inputValue])

  // New Chat Action
  const handleNewChat = () => {
    const newId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setCurrentSessionId(newId)
    setMessages([])
    setInputValue('')
    setInspectSource(null)
    void refreshAll()
  }

  // Load a historic session
  const handleLoadSession = async (sessId: string) => {
    setCurrentSessionId(sessId)
    setSending(true)
    setInspectSource(null)
    try {
      const historyTurns = await getHistory(sessId)
      const reconstructed: Message[] = []
      historyTurns.forEach((turn, idx) => {
        reconstructed.push({
          id: `hist-q-${turn.id || idx}`,
          role: 'user',
          text: turn.question,
        })
        reconstructed.push({
          id: `hist-a-${turn.id || idx}`,
          role: 'assistant',
          text: turn.answer,
          sources: turn.sources,
        })
      })
      setMessages(reconstructed)
    } catch {
      setMessages([
        {
          id: 'error-load',
          role: 'assistant',
          text: 'Could not load historic messages for this session.',
          error: true,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  // Send Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? inputValue).trim()
    if (!query || sending) return

    setInputValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const userMsgId = `user-${Date.now()}`
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text: query }])
    setSending(true)

    try {
      const res: ChatResponse = await postChat({
        session_id: currentSessionId,
        question: query,
        doc_ids: selectedDocId ? [selectedDocId] : undefined,
      })

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text: res.answer,
          sources: res.sources,
          error: res.error,
        },
      ])

      // Refresh recent sessions after successful interaction
      void getRecentSessions().then(setRecentSessions).catch(() => {})
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Unable to reach the backend service or process the RAG pipeline. Verify FastAPI is online on port 8000.',
          error: true,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSendMessage()
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle PDF Ingestion
  const handleUploadSubmit = async () => {
    if (!uploadFile) return
    setUploading(true)
    setUploadStatus('Extracting text with PyPDF and embedding 384-d vectors into ChromaDB...')
    try {
      const res = await uploadPdf(uploadFile)
      setUploadResult(res)
      if (res.success) {
        setUploadStatus('Document successfully indexed.')
        void refreshAll()
        if (res.doc_id) {
          setSelectedDocId(res.doc_id)
        }
        setTimeout(() => {
          setUploadModalOpen(false)
          setUploadFile(null)
          setUploadResult(null)
          setUploadStatus('')
        }, 1200)
      } else {
        setUploadStatus(res.message || 'Upload failed.')
      }
    } catch {
      setUploadStatus('Failed to upload file. Ensure backend is running.')
      setUploadResult({ success: false, doc_id: null, message: 'Network or backend error.' })
    } finally {
      setUploading(false)
    }
  }

  // Inspect full document chunks & summary
  const openDocumentInspector = async (docId: string) => {
    setViewingDocId(docId)
    setDocDetail(null)
    setDocSummary(null)
    setDocDetailLoading(true)
    try {
      const detail = await getDocumentDetail(docId)
      setDocDetail(detail)
    } catch {
      //
    } finally {
      setDocDetailLoading(false)
    }
  }

  const handleFetchSummary = async (docId: string) => {
    setDocSummaryLoading(true)
    try {
      const res = await getSummary(docId)
      setDocSummary(res.summary)
    } catch {
      setDocSummary('Failed to generate summary. Ensure GEMINI_API_KEY is configured.')
    } finally {
      setDocSummaryLoading(false)
    }
  }

  const activeDocObj = documents.find((d) => d.doc_id === selectedDocId)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-[#ececec] font-sans antialiased">
      {/* ============================================================ */}
      {/* 1. COLLAPSIBLE SIDEBAR (ChatGPT Style)                      */}
      {/* ============================================================ */}
      <aside
        className={`${
          sidebarOpen ? 'w-64 sm:w-72 opacity-100 border-r border-[#2f2f2f]' : 'w-0 opacity-0 pointer-events-none border-none'
        } transition-all duration-300 ease-in-out flex flex-col bg-[#171717] z-30 shrink-0 overflow-hidden select-none`}
      >
        <div className="flex h-full w-64 sm:w-72 flex-col p-3 shrink-0">
          {/* Top Bar: New Chat */}
          <div className="mb-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-[#212121] transition text-[#ececec] border border-[#2f2f2f]"
            >
              <div className="flex items-center gap-2">
                <Plus size={16} />
                <span>New Chat</span>
              </div>
            </button>
          </div>

          {/* Upload Paper Shortcut */}
          <button
            type="button"
            onClick={() => {
              setUploadModalOpen(true)
              setUploadFile(null)
              setUploadStatus('')
              setUploadResult(null)
            }}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 mb-3 text-xs font-semibold rounded-lg bg-[#2a2a2a] hover:bg-[#333333] text-sky-400 border border-[#383838] transition"
          >
            <Upload size={14} />
            <span>Upload Research PDF</span>
          </button>

          {/* Section: Indexed Papers */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider flex items-center justify-between">
                <span>Indexed Papers</span>
                <span className="font-mono text-[10px]">{documents.length}</span>
              </div>
              {docsLoading ? (
                <div className="px-3 py-2 text-xs text-[#8e8e8e] flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" /> Loading papers...
                </div>
              ) : documents.length === 0 ? (
                <div className="px-2 py-2 text-xs text-[#8e8e8e]">
                  No papers in ChromaDB yet. Click Upload above.
                </div>
              ) : (
                <div className="space-y-0.5 mt-1">
                  {/* Individual paper items */}
                  {documents.map((doc) => {
                    const isSelected = selectedDocId === doc.doc_id
                    return (
                      <div
                        key={doc.doc_id}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                          isSelected
                            ? 'bg-[#212121] text-sky-400 font-medium'
                            : 'text-[#b4b4b4] hover:bg-[#212121] hover:text-[#ececec]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedDocId(isSelected ? null : doc.doc_id)}
                          className="flex items-center gap-2 truncate text-left flex-1 mr-1"
                        >
                          <FileText size={13} className="shrink-0 text-sky-400" />
                          <span className="truncate" title={doc.filename ?? doc.doc_id}>
                            {doc.filename ?? doc.doc_id}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openDocumentInspector(doc.doc_id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#8e8e8e] hover:text-white rounded hover:bg-[#2f2f2f]"
                          title="Inspect chunks & summary"
                        >
                          <BookOpen size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Section: Chat History Sessions */}
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                Chat History
              </div>
              {recentSessions.length === 0 ? (
                <div className="px-2 py-2 text-xs text-[#8e8e8e]">No saved sessions yet.</div>
              ) : (
                <div className="space-y-0.5 mt-1">
                  {recentSessions.map((s) => (
                    <button
                      key={s.session_id}
                      type="button"
                      onClick={() => handleLoadSession(s.session_id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate flex items-center gap-2 transition ${
                        currentSessionId === s.session_id
                          ? 'bg-[#212121] text-white font-semibold'
                          : 'text-[#b4b4b4] hover:bg-[#212121] hover:text-[#ececec]'
                      }`}
                    >
                      <MessageSquare size={13} className="shrink-0 text-[#8e8e8e]" />
                      <span className="truncate">Session {s.session_id.slice(-6)}</span>
                      <span className="text-[10px] text-[#666] font-mono ml-auto">
                        {s.turn_count}t
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom user / status bar */}
          <div className="pt-3 border-t border-[#2f2f2f] flex items-center justify-between text-xs text-[#8e8e8e]">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendOnline ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span className="text-[11px] font-mono">
                {backendOnline ? 'FastAPI Online' : 'Backend Offline'}
              </span>
            </div>
            <span className="text-[10px] font-mono">MiniLM-L6-v2</span>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MAIN CHAT AREA (Clean ChatGPT Canvas)                     */}
      {/* ============================================================ */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden relative transition-all duration-300">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-[#2f2f2f] bg-[#212121]/95 px-4 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-2 rounded-lg hover:bg-[#2f2f2f] text-[#b4b4b4] hover:text-white transition flex items-center justify-center"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>

            {/* Current Active Context Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-tight">AI Research Assistant</span>
              {activeDocObj ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2a2a2a] border border-[#383838] text-xs text-sky-400">
                  <FileText size={12} className="shrink-0" />
                  <span className="max-w-[180px] sm:max-w-xs truncate font-medium">
                    {activeDocObj.filename ?? activeDocObj.doc_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDocId(null)}
                    className="ml-1 text-[#8e8e8e] hover:text-white"
                    title="Switch to all documents"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : documents.length > 0 ? (
                <span className="text-xs text-[#8e8e8e] font-mono hidden sm:inline">
                  • {documents.length} papers loaded
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeDocObj && (
              <button
                type="button"
                onClick={() => openDocumentInspector(activeDocObj.doc_id)}
                className="text-xs text-[#b4b4b4] hover:text-white px-2 py-1 rounded hover:bg-[#2f2f2f] transition flex items-center gap-1.5"
              >
                <BookOpen size={13} />
                <span className="hidden sm:inline">Inspect Paper</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleNewChat}
              className="p-1.5 text-[#b4b4b4] hover:text-white rounded-lg hover:bg-[#2f2f2f]"
              title="New Chat"
            >
              <Plus size={18} />
            </button>
          </div>
        </header>

        {/* Message Feed / Welcome Screen */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              // Welcome Screen (Like ChatGPT)
              <div className="py-16 sm:py-24 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 mb-4 ring-1 ring-sky-500/20">
                  <Sparkles size={24} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  What would you like to explore today?
                </h1>
                <p className="mt-2 text-sm text-[#8e8e8e] max-w-lg mx-auto">
                  {selectedDocId && activeDocObj
                    ? `Asking questions about: ${activeDocObj.filename ?? activeDocObj.doc_id}`
                    : 'Search across your uploaded research papers with verified semantic citations.'}
                </p>

                {/* Quick Starters */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-xl mx-auto">
                  {[
                    'Summarize the core research question and problem statement.',
                    'What methodology and experimental benchmarks were used?',
                    'Explain the primary quantitative findings and results.',
                    'What limitations and future directions are discussed?',
                  ].map((starter, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(starter)}
                      className="p-3 rounded-xl border border-[#2f2f2f] bg-[#171717] hover:bg-[#2a2a2a] text-xs text-[#b4b4b4] hover:text-white transition text-left"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Active Conversation turns
              messages.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <div key={msg.id} className="flex gap-4 group">
                    <div
                      className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold ${
                        isUser ? 'bg-sky-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isUser ? <User size={14} /> : <Bot size={15} />}
                    </div>

                    <div className="flex-1 space-y-2 overflow-hidden">
                      <div className="text-xs font-bold text-[#8e8e8e]">
                        {isUser ? 'You' : 'Assistant'}
                      </div>
                      <div className="text-sm leading-relaxed text-[#ececec] whitespace-pre-wrap break-words font-sans">
                        {msg.text}
                      </div>

                      {/* Source Badges */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2">
                          <div className="text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <span>Retrieved Passages ({msg.sources.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, idx) => (
                              <button
                                key={`${src.doc_id}-${idx}`}
                                type="button"
                                onClick={() => setInspectSource(src)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-[#383838] bg-[#171717] hover:bg-[#282828] hover:border-sky-500/60 px-2.5 py-1 text-xs text-[#b4b4b4] hover:text-white transition"
                              >
                                <FileText size={12} className="text-sky-400" />
                                <span className="truncate max-w-[140px]">
                                  {src.filename ?? 'Document'}
                                </span>
                                {typeof src.page_number === 'number' && (
                                  <span className="text-slate-400 font-mono">p.{src.page_number}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons (copy, etc.) */}
                      <div className="opacity-0 group-hover:opacity-100 transition pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="p-1 rounded text-[#8e8e8e] hover:text-white hover:bg-[#2f2f2f]"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            {sending && (
              <div className="flex gap-4">
                <div className="h-7 w-7 rounded-full bg-emerald-600 text-white shrink-0 flex items-center justify-center">
                  <Bot size={15} />
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8e8e8e] pt-1">
                  <Loader2 size={14} className="animate-spin text-sky-400" />
                  <span>Analyzing document chunks & calling Gemini...</span>
                </div>
              </div>
            )}
            <div ref={feedEndRef} />
          </div>
        </div>

        {/* Input Bar (Centered ChatGPT Capsule) */}
        <div className="p-4 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex flex-col rounded-2xl border border-[#383838] bg-[#2f2f2f] focus-within:border-[#555] transition shadow-lg">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                placeholder={
                  selectedDocId && activeDocObj
                    ? `Ask anything about ${activeDocObj.filename ?? 'your document'}...`
                    : 'Ask anything about your document...'
                }
                rows={1}
                className="w-full resize-none bg-transparent px-4 py-3.5 pr-20 text-sm text-[#ececec] placeholder-[#8e8e8e] outline-none max-h-48 font-sans"
              />

              <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-[#3a3a3a]">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-[#8e8e8e] hover:text-white p-1 rounded transition"
                  title="Attach new research document"
                >
                  <Paperclip size={14} />
                  <span>Attach PDF</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={sending || !inputValue.trim()}
                    className="p-1.5 rounded-full bg-white text-black hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-white transition flex items-center justify-center"
                    title="Send message"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-center text-[#666] mt-2">
              Gemini RAG Assistant generates answers strictly grounded in retrieved ChromaDB chunks.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. RIGHT EVIDENCE INSPECTOR DRAWER                           */}
      {/* ============================================================ */}
      {inspectSource && (
        <aside className="w-80 border-l border-[#2f2f2f] bg-[#171717] flex flex-col shrink-0 z-20">
          <div className="h-14 border-b border-[#2f2f2f] px-4 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <FileText size={14} className="text-sky-400" />
              <span>Evidence Inspector</span>
            </span>
            <button
              type="button"
              onClick={() => setInspectSource(null)}
              className="p-1 text-[#8e8e8e] hover:text-white rounded"
            >
              <X size={15} />
            </button>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto text-xs">
            <div>
              <span className="text-[10px] text-[#8e8e8e] uppercase font-mono block">Document</span>
              <span className="font-semibold text-white mt-0.5 block break-words">
                {inspectSource.filename ?? inspectSource.doc_id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 border-y border-[#2f2f2f] py-2 font-mono">
              <div>
                <span className="text-[#8e8e8e] text-[10px] block">Page:</span>
                <span className="text-white font-bold">{inspectSource.page_number ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#8e8e8e] text-[10px] block">Chunk Index:</span>
                <span className="text-white font-bold">#{inspectSource.chunk_index ?? 'N/A'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[#8e8e8e] uppercase font-mono block">Document UUID</span>
              <span className="text-[10px] text-[#8e8e8e] font-mono break-all mt-0.5 block select-all">
                {inspectSource.doc_id}
              </span>
            </div>

            {inspectSource.doc_id && (
              <button
                type="button"
                onClick={() => openDocumentInspector(inspectSource.doc_id!)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] text-xs font-semibold text-sky-400 border border-[#333] transition"
              >
                <BookOpen size={13} />
                <span>Explore Full Document Chunks</span>
              </button>
            )}
          </div>
        </aside>
      )}

      {/* ============================================================ */}
      {/* 4. DOCUMENT INSPECTOR & SUMMARY MODAL                         */}
      {/* ============================================================ */}
      {viewingDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl border border-[#383838] bg-[#1a1a1a] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#2f2f2f] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-sky-400" />
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {docDetail?.chunks[0]?.metadata?.filename ?? viewingDocId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDocId(null)}
                className="p-1 rounded text-[#8e8e8e] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              {/* Executive Summary Button & View */}
              <div className="p-4 rounded-xl border border-[#2f2f2f] bg-[#212121]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-sky-400" />
                    <span>Gemini Executive Summary</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFetchSummary(viewingDocId)}
                    disabled={docSummaryLoading}
                    className="text-xs text-sky-400 hover:underline disabled:opacity-50"
                  >
                    {docSummaryLoading ? 'Generating…' : docSummary ? 'Regenerate' : 'Generate Summary'}
                  </button>
                </div>
                {docSummary ? (
                  <p className="text-xs sm:text-sm text-[#ececec] leading-relaxed whitespace-pre-wrap">
                    {docSummary}
                  </p>
                ) : (
                  <p className="text-xs text-[#8e8e8e]">
                    Click &quot;Generate Summary&quot; to synthesize document main points with Gemini.
                  </p>
                )}
              </div>

              {/* Chunks Explorer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-white">
                    Indexed Passages ({docDetail?.chunks.length ?? 0})
                  </span>
                  <input
                    type="text"
                    value={chunkSearch}
                    onChange={(e) => setChunkSearch(e.target.value)}
                    placeholder="Search in chunks..."
                    className="bg-[#212121] border border-[#383838] rounded-lg px-2.5 py-1 text-xs text-[#ececec] outline-none w-48"
                  />
                </div>

                {docDetailLoading ? (
                  <div className="py-12 text-center text-xs text-[#8e8e8e]">
                    <Loader2 size={18} className="animate-spin mx-auto mb-2 text-sky-400" />
                    Loading chunks from ChromaDB...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {docDetail?.chunks
                      .filter((c) => c.text.toLowerCase().includes(chunkSearch.toLowerCase()))
                      .map((chunk, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg border border-[#2f2f2f] bg-[#212121] text-xs space-y-1"
                        >
                          <div className="flex justify-between font-mono text-[10px] text-[#8e8e8e]">
                            <span>Chunk #{chunk.chunk_index ?? i}</span>
                            <span>Page {chunk.page_number ?? 'N/A'}</span>
                          </div>
                          <p className="text-[#ececec] whitespace-pre-wrap">{chunk.text}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. UPLOAD MODAL                                              */}
      {/* ============================================================ */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#383838] bg-[#1e1e1e] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Upload Research PDF</h3>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="p-1 text-[#8e8e8e] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <label
              htmlFor="pdf-file"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files?.[0]
                if (f && f.name.toLowerCase().endsWith('.pdf')) setUploadFile(f)
              }}
              className="flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed border-[#383838] hover:border-sky-500/60 rounded-xl bg-[#171717] p-6 text-center cursor-pointer transition"
            >
              <UploadCloud size={32} className={uploadFile ? 'text-emerald-400' : 'text-[#8e8e8e]'} />
              <span className="mt-2 text-xs font-semibold text-white">
                {uploadFile ? uploadFile.name : 'Drop a PDF here or click to browse'}
              </span>
              <span className="text-[10px] text-[#8e8e8e] mt-1 font-mono">
                {uploadFile
                  ? `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB`
                  : 'PDF files with extractable text'}
              </span>
              <input
                id="pdf-file"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f && f.name.toLowerCase().endsWith('.pdf')) setUploadFile(f)
                }}
              />
            </label>

            {uploadStatus && (
              <div className="mt-3 p-2.5 rounded-lg bg-[#252525] border border-[#333] text-xs font-mono text-[#ccc] flex items-center justify-between">
                <span className="truncate pr-2">{uploadStatus}</span>
                {uploading && <Loader2 size={13} className="animate-spin text-sky-400 shrink-0" />}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#b4b4b4] hover:text-white hover:bg-[#2a2a2a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={uploading || !uploadFile}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-neutral-200 disabled:opacity-40 transition"
              >
                {uploading ? 'Indexing...' : 'Index in ChromaDB'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}