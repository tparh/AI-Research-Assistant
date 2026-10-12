export interface HealthStatus {
  status: string
}

export interface UploadResponse {
  success: boolean
  doc_id: string | null
  filename?: string
  message: string
  page_count?: number
  text_length?: number
  chunk_count?: number
}

export interface DocumentSummary {
  doc_id: string
  filename?: string
  page_numbers: number[]
  chunk_count: number
}

export interface DocumentChunk {
  doc_id: string
  chunk_index?: number
  page_number?: number
  text: string
  metadata: Record<string, unknown>
}

export interface DocumentDetail {
  doc_id: string
  chunks: DocumentChunk[]
}

export interface ChatSource {
  doc_id?: string
  filename?: string
  page_number?: number
  chunk_index?: number
}

export interface ChatResponse {
  answer: string
  sources: ChatSource[]
  error?: boolean
  prompt?: string
}

export interface ChatHistoryEntry {
  id: number
  session_id: string
  question: string
  answer: string
  sources: ChatSource[]
  timestamp?: string
  created_at?: string
}

export interface SessionSummary {
  session_id: string
  turn_count: number
  last_active?: string
}

export interface ChatRequest {
  session_id: string
  question: string
  doc_ids?: string[]
}
