import {
  Calendar,
  Clock,
  ExternalLink,
  History,
  MessageSquare,
  Search,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getHistory, getRecentSessions } from '../api/client'
import type { ChatHistoryEntry, SessionSummary } from '../types/api'

export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlSessionId = searchParams.get('sessionId') ?? ''
  const [sessionId, setSessionId] = useState(urlSessionId)
  const [entries, setEntries] = useState<ChatHistoryEntry[]>([])
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch recent active sessions from backend database
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const sessions = await getRecentSessions()
        setRecentSessions(sessions)
      } catch {
        // graceful silence if backend doesn't support yet
      }
    }
    void fetchRecent()
  }, [])

  useEffect(() => {
    if (urlSessionId) {
      setSessionId(urlSessionId)
    }
  }, [urlSessionId])

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId.trim()) {
        setEntries([])
        setError(null)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const res = await getHistory(sessionId)
        setEntries(res)
      } catch {
        setEntries([])
        setError('No history records found for this session ID. History is stored in SQLite when a RAG query succeeds.')
      } finally {
        setLoading(false)
      }
    }

    void loadSession()
  }, [sessionId])

  const selectSession = (id: string) => {
    setSessionId(id)
    setSearchParams(id ? { sessionId: id } : {}, { replace: true })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Title & Scope */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">Audit Trail</span>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Conversation History Archive
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={sessionId}
            onChange={(e) => selectSession(e.target.value)}
            placeholder="Search by session ID..."
            className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-sky-500 w-52 sm:w-64"
          />
        </div>
      </div>

      {/* Discovered Recent Sessions Bar */}
      {recentSessions.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-[#0f1626] p-3 space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">
            Recent SQLite Sessions
          </span>
          <div className="flex flex-wrap gap-2">
            {recentSessions.map((s) => (
              <button
                key={s.session_id}
                type="button"
                onClick={() => selectSession(s.session_id)}
                className={`rounded border px-2.5 py-1 text-xs font-mono transition ${
                  sessionId === s.session_id
                    ? 'border-sky-500 bg-sky-950 text-sky-200'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {s.session_id.slice(-8)} ({s.turn_count} turns)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Records Feed */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-28 animate-pulse rounded bg-slate-800/40" />
          <div className="h-28 animate-pulse rounded bg-slate-800/40" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-6 text-center text-xs text-amber-200/80">
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-800 p-10 text-center text-xs text-slate-400">
          <History size={22} className="mx-auto mb-2 text-slate-600" />
          <p className="font-medium text-slate-300">
            {sessionId ? 'No turns saved for this session.' : 'Select or input a session ID to review turns.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-400">
            Showing {entries.length} turns recorded in SQLite for session: <span className="text-slate-200">{sessionId}</span>
          </div>

          {entries.map((entry, idx) => (
            <div key={entry.id || idx} className="rounded-lg border border-slate-800 bg-[#0f1626] p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/80 pb-2">
                <span>Turn #{idx + 1} (Row ID: {entry.id})</span>
                <span>{entry.timestamp ?? entry.created_at ?? 'Saved'}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-sky-400 block mb-1">Question</span>
                <p className="font-medium text-slate-200 font-sans text-sm">{entry.question}</p>
              </div>

              <div className="border-t border-slate-800/60 pt-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Answer</span>
                <p className="whitespace-pre-wrap text-slate-300 font-sans leading-relaxed">{entry.answer}</p>
              </div>

              {entry.sources && entry.sources.length > 0 && (
                <div className="border-t border-slate-800/60 pt-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Retrieved Sources</span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                    {entry.sources.map((s, i) => (
                      <span key={i} className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-slate-300">
                        {s.filename ?? s.doc_id ?? 'Doc'} {s.page_number ? `p.${s.page_number}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
