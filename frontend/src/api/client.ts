import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

export interface UploadResponse {
  doc_id: string
  filename: string
  path: string
  page_count: number
  text_length: number
  chunk_count: number
  chunks: Array<{
    page_number: number
    chunk_index: number
    text_length: number
    embedding_length: number
  }>
}

export interface ChatRequest {
  session_id: string
  question: string
  doc_ids?: string[]
}

export interface ChatResponse {
  answer: string
  sources: Array<{
    doc_id: string
    filename?: string
    page_number?: number
    chunk_index?: number
  }>
  prompt?: string
}

export interface DocumentSummary {
  doc_id: string
  filename: string
  page_numbers: number[]
  chunk_count: number
}

export interface DocumentChunk {
  doc_id: string
  chunk_index: number
  page_number: number
  text: string
  metadata: Record<string, unknown>
}

/**
 * Upload PDF (RAG ingestion)
 */
export async function uploadPdf(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<UploadResponse>(
    '/upload/pdf',
    formData
  )

  return response.data
}

/**
 * Chat with RAG system
 */
export async function postChat(request: ChatRequest) {
  const response = await api.post<ChatResponse>('/chat/', request)
  return response.data
}

/**
 * Get all uploaded documents
 */
export async function getDocuments() {
  const response = await api.get<{ documents: DocumentSummary[] }>(
    '/documents/'
  )
  return response.data.documents
}

/**
 * Get chunks for a document
 */
export async function getDocumentChunks(docId: string) {
  const response = await api.get<{ doc_id: string; chunks: DocumentChunk[] }>(
    `/documents/${docId}`
  )
  return response.data
}