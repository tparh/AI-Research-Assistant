import axios from 'axios'
import type {
  ChatHistoryEntry,
  ChatRequest,
  ChatResponse,
  DocumentDetail,
  DocumentSummary,
  HealthStatus,
  UploadResponse,
} from '../types/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
})

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (typeof error.response?.data?.message === 'string') return error.response.data.message
    if (error.code === 'ERR_NETWORK') return 'The backend is unavailable. Start the API and try again.'
  }

  return fallback
}

export const getHealth = async () => {
  const response = await api.get<HealthStatus>('/health')
  return response.data
}

export const uploadPdf = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<UploadResponse>('/upload/pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data
}

export const getDocuments = async () => {
  const response = await api.get<{ documents: DocumentSummary[] }>('/documents/')
  return response.data.documents
}

export const getDocumentDetail = async (docId: string) => {
  const response = await api.get<DocumentDetail>(`/documents/${docId}`)
  return response.data
}

export const postChat = async (request: ChatRequest) => {
  const response = await api.post<ChatResponse>('/chat/', request)
  return response.data
}

export const getHistory = async (sessionId: string) => {
  const response = await api.get<ChatHistoryEntry[]>(`/history/${sessionId}`)
  return response.data
}

export const getSummary = async (docId: string) => {
  const response = await api.get<{ doc_id: string; summary: string }>(`/summarize/${docId}`)
  return response.data
}

export const getRecentSessions = async () => {
  const response = await api.get<Array<{ session_id: string; turn_count: number; last_active?: string }>>('/history/sessions/recent')
  return response.data
}

export type {
  ChatHistoryEntry,
  ChatRequest,
  ChatResponse,
  DocumentDetail,
  DocumentSummary,
  HealthStatus,
  UploadResponse,
}