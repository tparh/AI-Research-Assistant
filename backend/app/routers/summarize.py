from fastapi import APIRouter, HTTPException

from app.services.summarization_service import summarize_document

router = APIRouter(tags=["summarize"])


@router.get("/{doc_id}")
async def summarize(doc_id: str):
    """Return a map-reduce summary for a specific document."""
    try:
        summary = summarize_document(doc_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"doc_id": doc_id, "summary": summary}
