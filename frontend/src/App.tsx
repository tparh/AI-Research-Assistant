import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { UploadModal } from './components/UploadModal'
import { ChatWindow } from './components/chat/ChatWindow'

function App() {
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-10 rounded-[32px] border border-slate-800 bg-slate-950/95 p-6 shadow-[0_40px_100px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-6 rounded-[28px] bg-slate-900/90 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm uppercase tracking-[0.28em] text-sky-400/80">
                AI Research Assistant
              </p>

              <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                Chat with your research documents
              </h1>

              <p className="text-slate-300 leading-8">
                Upload PDFs, ask questions, and receive answers with source
                citations. This single-page interface keeps the entire research
                workflow in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                console.log('Upload button clicked')
                setUploadOpen(true)
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              <UploadCloud size={18} />
              Upload PDF
            </button>
          </div>
        </section>

        <ChatWindow selectedDocument={null} />
      </main>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
    </div>
  )
}

export default App