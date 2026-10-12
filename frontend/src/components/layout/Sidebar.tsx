import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  History,
  MessageSquare,
  Plus,
  Shield,
  Upload,
} from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { DocumentSummary } from '../../types/api'

interface SidebarProps {
  documents: DocumentSummary[]
  backendStatus: 'checking' | 'online' | 'offline'
  onUploadClick: () => void
}

const navItems = [
  { to: '/', label: 'Research Query', icon: MessageSquare, exact: true },
  { to: '/documents', label: 'Paper Corpus', icon: BookOpen, exact: false },
  { to: '/history', label: 'Session Archive', icon: History, exact: false },
]

export function Sidebar({ documents, backendStatus, onUploadClick }: SidebarProps) {
  const location = useLocation()
  const currentParams = new URLSearchParams(location.search)
  const currentDocId = currentParams.get('docId')

  return (
    <aside className="flex w-full flex-col border-b border-slate-800 bg-[#0c121e] lg:h-screen lg:w-72 lg:border-b-0 lg:border-r shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm">
            <FileText size={17} />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white block leading-none">
              Research Assistant
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider block mt-1 leading-none uppercase">
              RAG • ChromaDB
            </span>
          </div>
        </Link>

        {/* Real Backend Service Status Indicator */}
        <div
          className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-[11px]"
          title={`Backend status endpoint (/health): ${backendStatus}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              backendStatus === 'online'
                ? 'bg-emerald-500'
                : backendStatus === 'offline'
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span className="text-[10px] font-mono text-slate-400 capitalize">
            {backendStatus}
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="px-3 py-3 border-b border-slate-800/80">
        <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </div>
        <nav className="space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon size={15} />
                <span>{label}</span>
              </div>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={onUploadClick}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-500 active:bg-sky-700"
        >
          <Upload size={14} />
          <span>Import PDF Document</span>
        </button>
      </div>

      {/* Active Indexed Corpus List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="flex items-center justify-between px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1.5">
            <Database size={11} />
            <span>Indexed Documents</span>
          </span>
          <span className="font-mono text-[10px]">{documents.length}</span>
        </div>

        {documents.length > 0 ? (
          <div className="space-y-1">
            {documents.map((doc) => {
              const isSelected = currentDocId === doc.doc_id
              return (
                <Link
                  key={doc.doc_id}
                  to={`/?docId=${encodeURIComponent(doc.doc_id)}`}
                  className={`group block rounded-lg px-2.5 py-2 text-xs transition-colors border ${
                    isSelected
                      ? 'border-sky-500/40 bg-sky-950/30 text-white'
                      : 'border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="truncate font-medium text-xs leading-snug">
                      {doc.filename ?? doc.doc_id}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>{doc.page_numbers?.length ?? 0} pgs</span>
                    <span>•</span>
                    <span>{doc.chunk_count} chunks</span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center">
            <p className="text-xs text-slate-400">No documents indexed yet.</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Upload a paper to begin semantic search.
            </p>
          </div>
        )}
      </div>

      {/* Technical Architecture Footer */}
      <div className="border-t border-slate-800/80 p-3 bg-[#0a0f19]">
        <div className="rounded-md border border-slate-800/80 bg-slate-900/40 p-2.5 text-[10px] text-slate-400 space-y-1">
          <div className="flex justify-between font-mono">
            <span>Model:</span>
            <span className="text-slate-300">all-MiniLM-L6-v2</span>
          </div>
          <div className="flex justify-between font-mono">
            <span>LLM:</span>
            <span className="text-slate-300">Gemini (LangChain)</span>
          </div>
          <div className="flex justify-between font-mono">
            <span>Store:</span>
            <span className="text-slate-300">ChromaDB Local</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
