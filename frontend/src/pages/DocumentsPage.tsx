import {
  ArrowRight,
  BookOpen,
  Database,
  ExternalLink,
  FileText,
  Filter,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { DocumentSummary } from '../types/api'

interface DocumentsPageProps {
  documents: DocumentSummary[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  onUploadClick: () => void
}

export function DocumentsPage({
  documents,
  loading,
  error,
  onRefresh,
  onUploadClick,
}: DocumentsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = documents.filter((doc) => {
    const term = (doc.filename ?? doc.doc_id).toLowerCase()
    return term.includes(searchQuery.toLowerCase())
  })

  const totalPages = documents.reduce((acc, doc) => acc + (doc.page_numbers?.length || 0), 0)
  const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0)

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="h-10 animate-pulse rounded-lg bg-slate-800/40" />
        <div className="h-64 animate-pulse rounded-lg bg-slate-800/30" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 rounded-lg border border-rose-800/50 bg-rose-950/20 p-6 text-center">
        <h2 className="text-sm font-semibold text-rose-200">Unable to Query Document Store</h2>
        <p className="mt-1 text-xs text-rose-300/80">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-rose-700/60 bg-rose-900/40 px-3 py-1.5 text-xs text-white"
        >
          <RefreshCw size={13} /> Refresh Library
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
      {/* Title & Technical Metadata Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Storage: ChromaDB Local</span>
            <span>•</span>
            <span>Collection: research_documents</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1">
            Indexed Research Papers
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition"
          >
            <RefreshCw size={13} /> Sync List
          </button>
          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition"
          >
            <Plus size={14} /> Ingest Paper
          </button>
        </div>
      </div>

      {/* Real Collection Overview Counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
        <div className="rounded-lg border border-slate-800 bg-[#0f1626] p-3">
          <span className="text-slate-400 block text-[11px]">Indexed Documents</span>
          <span className="text-lg font-bold text-white block mt-0.5">{documents.length}</span>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#0f1626] p-3">
          <span className="text-slate-400 block text-[11px]">Total Pages</span>
          <span className="text-lg font-bold text-slate-200 block mt-0.5">{totalPages}</span>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#0f1626] p-3">
          <span className="text-slate-400 block text-[11px]">Vector Chunks</span>
          <span className="text-lg font-bold text-sky-400 block mt-0.5">{totalChunks}</span>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#0f1626] p-3">
          <span className="text-slate-400 block text-[11px]">Embedding Engine</span>
          <span className="text-sm font-semibold text-slate-300 block mt-1 truncate">all-MiniLM-L6-v2</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-[#0f1626] px-3 py-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers by filename or document UUID..."
            className="w-full bg-transparent pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 outline-none"
          />
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {filtered.length} of {documents.length}
        </span>
      </div>

      {/* Documents Table / Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-800 p-10 text-center">
          <FileText size={24} className="text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-300">No documents matched</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {searchQuery ? `No records found matching "${searchQuery}".` : 'Upload a PDF to store in ChromaDB.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0f1626]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-[#121b2f] font-mono text-[11px] text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3">Document Title</th>
                <th className="px-4 py-3">Pages</th>
                <th className="px-4 py-3">Chunks</th>
                <th className="px-4 py-3">Document UUID</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {filtered.map((doc) => (
                <tr key={doc.doc_id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-sky-400 shrink-0" />
                      <span className="truncate max-w-xs">{doc.filename ?? doc.doc_id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {doc.page_numbers?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {doc.chunk_count}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    {doc.doc_id.slice(0, 12)}…
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link
                      to={`/documents/${doc.doc_id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white"
                    >
                      <span>Inspect</span>
                      <ArrowRight size={11} />
                    </Link>
                    <Link
                      to={`/?docId=${encodeURIComponent(doc.doc_id)}`}
                      className="inline-flex items-center gap-1 rounded bg-sky-950 border border-sky-800/60 px-2 py-0.5 text-[11px] font-semibold text-sky-300 hover:bg-sky-900 transition"
                    >
                      <MessageSquare size={11} />
                      <span>Query</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
