import { useCallback, useState } from 'react'
import { X, UploadCloud } from 'lucide-react'
import { uploadPdf, UploadResponse } from '../api/client'

interface UploadModalProps {
  open: boolean
  onClose: () => void
}

export function UploadModal({ open, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>('Choose a PDF to upload')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResponse | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setResult(null)
    setStatus(selected ? selected.name : 'Choose a PDF to upload')
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file) return
    setLoading(true)
    setStatus('Uploading...')

    try {
      const response = await uploadPdf(file)
      setResult(response)
      setStatus('Upload successful')
    } catch (error) {
      console.error(error)
      setStatus('Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [file])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/40">
        
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-sky-400/80">
              Upload document
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Upload a PDF for semantic search
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 bg-slate-950 p-3 text-slate-300 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* DROP AREA */}
        <div className="mt-8 grid gap-5">

          <label
            htmlFor="pdf-upload"
            className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-8 text-center text-slate-400 transition hover:border-slate-500 hover:bg-slate-900/80"
          >
            <UploadCloud size={38} className="text-sky-400" />
            <span className="mt-4 text-base text-slate-100">
              Drag & drop a PDF, or click to browse
            </span>
            <span className="mt-2 text-sm text-slate-500">
              PDF files only · max 50MB
            </span>

            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* STATUS + ACTIONS */}
          <div className="flex flex-col gap-2 text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <p>{status}</p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!file || loading}
                onClick={handleUpload}
                className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? 'Uploading…' : 'Upload PDF'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setStatus('Choose a PDF to upload')
                  setResult(null)
                }}
                className="rounded-full border border-slate-700 px-5 py-3 text-sm"
              >
                Reset
              </button>
            </div>
          </div>

          {/* RESULT */}
          {result && (
            <div className="rounded-3xl bg-slate-950/90 p-5 text-slate-200">
              <p className="text-sm text-slate-400">Uploaded file</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {result.filename}
              </p>

              <div className="mt-3 grid gap-2 text-sm text-slate-400 sm:grid-cols-3">
                <span>{result.page_count} pages</span>
                <span>{result.chunk_count} chunks</span>
                <span>{result.text_length} chars</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}