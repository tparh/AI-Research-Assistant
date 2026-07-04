from fastapi import APIRouter, HTTPException

from app.services.vector_store import list_documents, get_document_chunks

router = APIRouter(tags=["documents"])


@router.get("/")
async def documents():
    """List all stored documents and document summary metadata."""
    return {"documents": list_documents()}


@router.get("/{doc_id}")
async def document_detail(doc_id: str):
    """Return all chunks for a given document id."""
    chunks = get_document_chunks(doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"doc_id": doc_id, "chunks": chunks}
