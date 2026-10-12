import { useCallback, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react'
import { getApiErrorMessage, uploadPdf } from '../api/client'
import type { UploadResponse } from '../types/api'

interface UploadModalProps {
  open: boolean
  onClose: () => void
  onUploadComplete?: (result: UploadResponse) => void
}

export function UploadModal({ open, onClose, onUploadComplete }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>('Select a PDF to import')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setFile(null)
    setStatus('Select a PDF to import')
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const selectFile = useCallback((selected: File | null) => {
    setFile(selected)
    setResult(null)
    if (selected && !selected.name.toLowerCase().endsWith('.pdf')) {
      setFile(null)
      setStatus('Only .pdf files are accepted by the backend service.')
      return
    }
    setStatus(selected ? selected.name : 'Select a PDF to import')
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file) return

    setLoading(true)
    setStatus('Processing PDF through PyPDF extraction, text chunking, and embedding...')

    try {
      const response = await uploadPdf(file)
      setResult(response)

      if (response.success) {
        setStatus('Document parsed and indexed in ChromaDB.')
        onUploadComplete?.(response)
        window.setTimeout(() => {
          onClose()
          reset()
        }, 1200)
      } else {
        setStatus(response.message || 'Upload processing error occurred.')
      }
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Upload failed. Ensure backend FastAPI service is running on port 8000.',
      )
      setResult({ success: false, doc_id: null, message })
      setStatus(message)
    } finally {
      setLoading(false)
    }
  }, [file, onClose, onUploadComplete, reset])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0f1626] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Import Research PDF</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingests text with PyPDF and stores 384-dimensional vectors in ChromaDB.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="mt-5 space-y-3">
          <label
            htmlFor="pdf-file-input"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              selectFile(e.dataTransfer.files?.[0] ?? null)
            }}
            className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${
              file
                ? 'border-emerald-500/60 bg-emerald-950/20'
                : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-900'
            }`}
          >
            <UploadCloud size={28} className={file ? 'text-emerald-400' : 'text-slate-400'} />
            <span className="mt-2 text-xs font-semibold text-slate-200">
              {file ? file.name : 'Click to select or drop a PDF document'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
              {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF files with extractable text'}
            </span>

            <input
              ref={fileInputRef}
              id="pdf-file-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {/* Status Message */}
          <div className="rounded border border-slate-800 bg-slate-950 p-2.5 text-[11px] font-mono text-slate-300 flex items-center justify-between">
            <span className="truncate pr-2">{status}</span>
            {loading && <Loader2 size={13} className="animate-spin text-sky-400 shrink-0" />}
          </div>

          {/* Result details */}
          {result && (
            <div
              className={`rounded border p-3 text-xs font-mono ${
                result.success
                  ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-200'
                  : 'border-rose-800/60 bg-rose-950/30 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {result.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{result.success ? 'Upload Success' : 'Upload Failed'}</span>
              </div>
              <p className="mt-1 font-sans text-xs">{result.message}</p>
              {result.success && (
                <div className="mt-2 grid grid-cols-3 gap-1 border-t border-emerald-900/40 pt-2 text-[10px] text-slate-300">
                  <span>Pages: {result.page_count ?? 0}</span>
                  <span>Chunks: {result.chunk_count ?? 0}</span>
                  <span>Length: {result.text_length ?? 0}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={reset}
              disabled={loading}
              className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                if (!file) {
                  fileInputRef.current?.click()
                  return
                }
                void handleUpload()
              }}
              disabled={loading}
              className="rounded bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : file ? 'Start Ingestion' : 'Select File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}