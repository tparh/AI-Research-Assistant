from typing import List

from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings
from app.services.vector_store import get_document_chunks


CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def summarize_document(doc_id: str) -> str:
    """Summarize a document using a prompt-based LLM approach."""
    chunks = get_document_chunks(doc_id)
    if not chunks:
        raise ValueError("Document not found")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
    )

    chunk_texts = [chunk["text"] for chunk in chunks]
    split_texts = []
    for text in chunk_texts:
        split_texts.extend(text_splitter.split_text(text))

    document_text = "\n\n".join(split_texts)
    if len(document_text) > 16000:
        document_text = document_text[:16000] + "\n\n[TRUNCATED DUE TO LENGTH]"

    model_names = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-flash-latest", "gemini-pro-latest"]
    llm = None
    for model_name in model_names:
        try:
            llm = init_chat_model(
                model=model_name,
                model_provider="google_genai",
                api_key=settings.GEMINI_API_KEY,
            )
            logger = __import__('logging').getLogger('uvicorn.error')
            logger.info("Selected Gemini model for summarization: %s", model_name)
            break
        except Exception as exc:
            logger = __import__('logging').getLogger('uvicorn.error')
            logger.error("Failed to initialize Gemini model %s for summarization: %s", model_name, exc)
            logger.error(__import__('traceback').format_exc())
            continue

    if llm is None:
        raise RuntimeError("No compatible Gemini model available.")

    prompt = (
        "You are an AI assistant. Summarize the document text provided below. "
        "Preserve the main ideas, important facts, and structure. "
        "Do not invent details.\n\n"
        "Document text:\n"
        f"{document_text}\n\n"
        "Summary:"
    )

    response = llm.generate(messages=[[HumanMessage(content=prompt)]])
    if response and response.generations and response.generations[0]:
        return response.generations[0][0].text
    return ""
