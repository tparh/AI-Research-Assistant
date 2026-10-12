import {
  ArrowLeft,
  BookOpen,
  Copy,
  Database,
  FileText,
  Layers,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getDocumentDetail, getSummary } from '../api/client'
import type { DocumentDetail } from '../types/api'

export function DocumentDetailPage() {
  const { docId } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<DocumentDetail | null>(null)
  const [summary, setSummary] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chunkSearch, setChunkSearch] = useState('')
  const [copiedId, setCopiedId] = useState(false)

  useEffect(() => {
    if (!docId) {
      navigate('/documents')
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const nextDetail = await getDocumentDetail(docId)
        setDetail(nextDetail)
      } catch {
        setError('This document could not be loaded from ChromaDB. Verify that the document UUID exists.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [docId, navigate])

  const handleGenerateSummary = async () => {
    if (!docId) return
    try {
      setSummaryLoading(true)
      const res = await getSummary(docId)
      setSummary(res.summary)
    } catch {
      setSummary('Failed to generate summary. Verify GEMINI_API_KEY is configured in backend/.env.')
    } finally {
      setSummaryLoading(false)
    }
  }

  const copyDocId = () => {
    if (docId) {
      navigator.clipboard.writeText(docId)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-12 animate-pulse rounded bg-slate-800/40" />
        <div className="h-72 animate-pulse rounded bg-slate-800/30" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="max-w-md mx-auto my-12 rounded-lg border border-rose-800/50 bg-rose-950/20 p-6 text-center">
        <h2 className="text-sm font-semibold text-rose-200">Document Unavailable</h2>
        <p className="mt-1 text-xs text-rose-300/80">{error ?? 'Document not found.'}</p>
        <button
          type="button"
          onClick={() => navigate('/documents')}
          className="mt-4 rounded bg-slate-800 px-3 py-1.5 text-xs text-white hover:bg-slate-700"
        >
          Return to Library
        </button>
      </div>
    )
  }

  const documentName =
    typeof detail.chunks[0]?.metadata?.filename === 'string'
      ? detail.chunks[0].metadata.filename
      : detail.doc_id

  const filteredChunks = detail.chunks.filter((c) =>
    c.text.toLowerCase().includes(chunkSearch.toLowerCase()),
  )

  const distinctPages = new Set(detail.chunks.map((c) => c.page_number ?? 0)).size

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
            title="Back to library"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Document Detail</span>
              <button
                type="button"
                onClick={copyDocId}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-300"
                title="Copy Document ID"
              >
                {copiedId ? 'Copied' : docId?.slice(0, 8) + '…'}
              </button>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">{documentName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/?docId=${encodeURIComponent(docId ?? '')}`}
            className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition"
          >
            <MessageSquare size={13} />
            <span>Query Paper</span>
          </Link>
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={summaryLoading}
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            {summaryLoading ? <Loader2 size={13} className="animate-spin text-sky-400" /> : <Sparkles size={13} />}
            <span>{summaryLoading ? 'Generating…' : 'Synthesize Summary'}</span>
          </button>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="grid grid-cols-3 gap-3 font-mono text-xs">
        <div className="rounded-lg border border-slate-800 bg-[#0f1626] p-3">
          <span className="text-slate-400 text-[10px] block">Extracted Pages</span>
          <span className="text-base font-bold text-white mt-0.5 block">{distinctPages}</span>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#0f1626] p-3">
          <span className="text-slate-400 text-[10px] block">Indexed Chunks</span>
          <span className="text-base font-bold text-sky-400 mt-0.5 block">{detail.chunks.length}</span>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#0f1626] p-3">
          <span className="text-slate-400 text-[10px] block">Chunk Size / Overlap</span>
          <span className="text-base font-bold text-slate-300 mt-0.5 block">1000 / 200</span>
        </div>
      </div>

      {/* Executive Summary Block */}
      <div className="rounded-lg border border-slate-800 bg-[#0f1626] p-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles size={13} className="text-sky-400" />
            <span>Gemini Executive Summary</span>
          </span>
          {summary && (
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              className="text-[11px] text-sky-400 hover:underline"
            >
              Re-run
            </button>
          )}
        </div>

        {summary ? (
          <div className="text-xs sm:text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
            {summary}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            <p>No executive summary generated yet for this paper.</p>
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              className="mt-2 text-sky-400 hover:underline font-medium inline-block"
            >
              Generate summary with Gemini
            </button>
          </div>
        )}
      </div>

      {/* Chunks Explorer */}
      <div className="rounded-lg border border-slate-800 bg-[#0f1626] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-200">
            Passage Chunks ({filteredChunks.length})
          </span>
          <div className="relative w-56">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={chunkSearch}
              onChange={(e) => setChunkSearch(e.target.value)}
              placeholder="Search in chunks..."
              className="w-full rounded border border-slate-700 bg-slate-900 py-1 pl-7 pr-2.5 text-xs text-slate-200 outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredChunks.map((chunk, i) => (
            <div
              key={`${chunk.doc_id}-${chunk.chunk_index ?? i}`}
              className="rounded border border-slate-800/80 bg-slate-950/70 p-3 text-xs"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/60 pb-1.5 mb-2">
                <span className="text-sky-300 font-semibold">
                  Chunk #{chunk.chunk_index ?? i}
                </span>
                <span>Page {chunk.page_number ?? 'N/A'}</span>
              </div>
              <p className="whitespace-pre-wrap text-slate-300 leading-relaxed font-sans">
                {chunk.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
