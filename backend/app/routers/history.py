from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.history import ChatHistory as ChatHistoryModel
from app.models.schemas import ChatHistory

router = APIRouter(tags=["history"])


@router.get("/sessions/recent")
async def list_recent_sessions(db: Session = Depends(get_db)):
    """Return distinct active sessions with entry counts and most recent timestamp."""
    try:
        from sqlalchemy import func

        results = (
            db.query(
                ChatHistoryModel.session_id,
                func.count(ChatHistoryModel.id).label("turn_count"),
                func.max(ChatHistoryModel.created_at).label("last_active"),
            )
            .group_by(ChatHistoryModel.session_id)
            .order_by(func.max(ChatHistoryModel.id).desc())
            .limit(20)
            .all()
        )
        return [
            {
                "session_id": r[0],
                "turn_count": r[1],
                "last_active": r[2],
            }
            for r in results
        ]
    except Exception:
        return []


@router.get("/{session_id}", response_model=list[ChatHistory])
async def history(session_id: str, db: Session = Depends(get_db)):
    """Return chat history entries for a specific session."""
    entries = db.query(ChatHistoryModel).filter(ChatHistoryModel.session_id == session_id).all()
    if not entries:
        raise HTTPException(status_code=404, detail="Session history not found.")
    return entries
