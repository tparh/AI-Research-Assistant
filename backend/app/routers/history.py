from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.history import ChatHistory as ChatHistoryModel
from app.models.schemas import ChatHistory

router = APIRouter(tags=["history"])


@router.get("/{session_id}", response_model=list[ChatHistory])
async def history(session_id: str, db: Session = Depends(get_db)):
    """Return chat history entries for a specific session."""
    entries = db.query(ChatHistoryModel).filter(ChatHistoryModel.session_id == session_id).all()
    if not entries:
        raise HTTPException(status_code=404, detail="Session history not found.")
    return entries
