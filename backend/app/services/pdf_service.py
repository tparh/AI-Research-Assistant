import logging
from pathlib import Path
from typing import Dict, List
import uuid

from fastapi import UploadFile
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from app.core.config import settings
from app.services.embedding_service import embed_chunks
from app.services.vector_store import add_documents, delete_documents

logger = logging.getLogger("uvicorn.error")


UPLOAD_DIR = Path(settings.UPLOAD_FOLDER)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Chunking settings chosen for production-ready tradeoffs:
# - chunk_size=1000 keeps chunks small enough for semantic matching and prompt budgeting.
# - chunk_overlap=200 preserves context between adjacent chunks so split boundaries do not lose meaning.
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


class UploadProcessingError(Exception):
    """Expected upload failure that can be shown safely to the user."""


async def save_upload_file(upload_file: UploadFile, destination: Path) -> None:
    """Write an uploaded file to the local file system asynchronously."""
    try:
        contents = await upload_file.read()
        destination.write_bytes(contents)
    finally:
        await upload_file.close()


def extract_pdf_pages(file_path: Path) -> List[str]:
    """Read a PDF from disk and return the extracted text for each page."""
    reader = PdfReader(str(file_path))
    pages = [page.extract_text() or "" for page in reader.pages]
    return pages


def chunk_page_text(page_text: str, page_number: int) -> List[Dict[str, object]]:
    """Split page text into chunks, storing page number and chunk index in metadata."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
    )
    chunks = splitter.split_text(page_text)
    return [
        {
            "page_number": page_number,
            "chunk_index": index,
            "text_length": len(chunk),
            "text": chunk,
        }
        for index, chunk in enumerate(chunks)
    ]


async def process_pdf_upload(upload_file: UploadFile) -> Dict[str, object]:
    """Save the PDF locally, chunk its text, persist embeddings, and return metadata."""
    file_name = Path(upload_file.filename).name
    if not file_name.lower().endswith(".pdf"):
        return {
            "success": False,
            "doc_id": None,
            "message": "File extension must be .pdf.",
        }

    doc_id = uuid.uuid4().hex
    destination = UPLOAD_DIR / f"{doc_id}_{file_name}"
    doc_chunk_ids: List[str] = []
    stage = "saving"

    try:
        await save_upload_file(upload_file, destination)
        logger.info("pdf_loaded %s", destination)

        stage = "reading"
        pages = extract_pdf_pages(destination)
        logger.info("text_extracted %s pages=%d", doc_id, len(pages))

        all_chunks = []
        for page_index, page_text in enumerate(pages, start=1):
            page_chunks = chunk_page_text(page_text, page_index)
            for chunk in page_chunks:
                chunk["doc_id"] = doc_id
                chunk["filename"] = file_name
            all_chunks.extend(page_chunks)

        logger.info("chunks_created %s chunk_count=%d", doc_id, len(all_chunks))
        if not all_chunks:
            raise UploadProcessingError(
                "This PDF does not contain extractable text. Try a text-based PDF instead."
            )

        stage = "embedding"
        chunks_with_embeddings = embed_chunks(all_chunks)
        logger.info("embeddings_generated %s embeddings=%d", doc_id, len(chunks_with_embeddings))

        stage = "storing"
        doc_chunk_ids = add_documents(chunks_with_embeddings)
        logger.info("stored_in_chroma %s stored_chunks=%d", doc_id, len(doc_chunk_ids))

        text_length = sum(chunk["text_length"] for chunk in chunks_with_embeddings)

        return {
            "success": True,
            "doc_id": doc_id,
            "filename": file_name,
            "message": "Upload completed successfully.",
            "page_count": len(pages),
            "text_length": text_length,
            "chunk_count": len(chunks_with_embeddings),
        }
    except UploadProcessingError as exc:
        logger.warning("upload_processing_rejected %s: %s", doc_id, exc)
        if destination.exists():
            try:
                destination.unlink()
            except Exception:
                logger.exception("cleanup_failed_delete_file %s", doc_id)
        return {
            "success": False,
            "doc_id": None,
            "message": str(exc),
        }
    except Exception as exc:
        logger.exception("upload_pipeline_failed %s", doc_id)
        if destination.exists():
            try:
                destination.unlink()
                logger.info("cleanup_deleted_file %s", destination)
            except Exception:
                logger.exception("cleanup_failed_delete_file %s", destination)
        if doc_chunk_ids:
            try:
                delete_documents(doc_chunk_ids)
                logger.info("cleanup_deleted_chroma %s deleted_count=%d", doc_id, len(doc_chunk_ids))
            except Exception:
                logger.exception("cleanup_failed_delete_chroma %s", doc_id)

        stage_messages = {
            "reading": "We couldn't read that PDF. Check that it is a valid, text-based PDF.",
            "embedding": "The PDF was read, but its text could not be prepared for research. Please try again.",
            "storing": "The PDF was processed, but it could not be added to the research library. Please try again.",
        }
        return {
            "success": False,
            "doc_id": None,
            "message": stage_messages.get(stage, "The PDF could not be uploaded. Please try again."),
        }
