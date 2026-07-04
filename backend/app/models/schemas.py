from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    session_id: str
    doc_ids: Optional[List[str]] = None
    question: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]
    error: bool = False


class ChatHistory(BaseModel):
    id: int
    session_id: str
    question: str
    answer: str
    sources: List[dict]
    timestamp: str

    class Config:
        orm_mode = True
