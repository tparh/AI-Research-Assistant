import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas import ChatRequest, ChatResponse
from app.models.history import ChatHistory as ChatHistoryModel
from app.services.rag_service import answer_question
from app.services.vector_store import list_documents


def detect_greeting(query: str) -> bool:
    normalized = query.strip().lower()
    if not normalized:
        return False

    normalized = normalized.replace('?', '').replace('!', '').replace('.', '').replace(',', '')
    normalized = ' '.join(normalized.split())

    greetings = {
        'hi',
        'hello',
        'hey',
        'thanks',
        'thank you',
        'thank you so much',
        'good morning',
        'good afternoon',
        'good evening',
    }

    return normalized in greetings

logger = logging.getLogger("uvicorn.error")
router = APIRouter(tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    """Handle a chat request, persist it to SQLite, and return the RAG answer."""
    if not request.question.strip():
        return ChatResponse(
            answer="Your question must not be empty. Please ask something specific.",
            sources=[],
            error=True,
        )

    try:
        # Log the incoming request details for debugging
        logger.info(
            "chat_request received session_id=%s doc_ids=%s question_len=%d",
            request.session_id,
            request.doc_ids,
            len(request.question),
        )

        # Early greeting detection to prevent RAG pipeline for simple conversational queries.
        if detect_greeting(request.question):
            logger.info("Detected greeting query; returning canned response without RAG processing.")
            return ChatResponse(
                answer="Hello! Ask me anything about your uploaded documents.",
                sources=[],
                error=False,
            )

        # Early document existence check before running any embedding or retrieval.
        documents = list_documents()
        if not documents:
            logger.info("No documents available; returning upload prompt.")
            return ChatResponse(
                answer="Please upload a PDF before asking questions.",
                sources=[],
                error=False,
            )

        rag_result = answer_question(request.question, doc_ids=request.doc_ids)
        answer = rag_result.get("answer", "")
        sources = rag_result.get("sources", [])
        error_flag = rag_result.get("error", False)

        if not error_flag:
            chat_record = ChatHistoryModel(
                session_id=request.session_id,
                question=request.question,
                answer=answer,
                sources=sources,
            )
            db.add(chat_record)
            db.commit()
            db.refresh(chat_record)

        return ChatResponse(answer=answer, sources=sources, error=error_flag)
    except Exception as exc:
        # Log full traceback and request for easier debugging
        import traceback

        logger.error("Chat request unexpected error: %s", exc)
        logger.error("Request: session_id=%s doc_ids=%s question=%s", request.session_id, request.doc_ids, request.question)
        logger.error(traceback.format_exc())
        return ChatResponse(
            answer=(
                "Sorry, I couldn't process your request at the moment. "
                "Please try again in a few seconds."
            ),
            sources=[],
            error=True,
        )
