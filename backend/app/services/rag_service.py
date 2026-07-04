import logging
from typing import Dict, List
import traceback

from app.core.config import settings
from app.services.embedding_service import embed_texts
from app.services.vector_store import similarity_search
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage

logger = logging.getLogger("uvicorn.error")


def embed_question(question: str) -> List[float]:
    embeddings = embed_texts([question])
    emb = embeddings[0]

    # FIX: force pure Python list
    if hasattr(emb, "tolist"):
        emb = emb.tolist()

    return emb

def retrieve_top_chunks(
    query_embedding: List[float], top_k: int = 5, doc_ids: List[str] | None = None
) -> List[Dict[str, object]]:
    """Retrieve the most similar document chunks from the persistent vector store.

    If doc_ids are provided, the search is filtered to those document IDs.
    """
    results = similarity_search(query_embedding=query_embedding, k=top_k, doc_ids=doc_ids)
    logger.info("similarity_search returned %d items for top_k=%d doc_ids=%s", len(results), top_k, doc_ids)
    return results


def build_rag_prompt(question: str, retrieved_chunks: List[Dict[str, object]]) -> str:
    """Construct a single prompt for Gemini using retrieved chunks as context."""
    prompt_lines = [
        "You are an AI assistant. Use the provided document excerpts to answer the question.",
        "Cite each source using the source number and metadata in brackets.",
        "Do not hallucinate information that is not supported by the excerpts.",
        "",
        f"Question: {question}",
        "",
        "Context:",
    ]

    for index, result in enumerate(retrieved_chunks, start=1):
        metadata = result.get("metadata", {})
        source_label = (
            f"source {index}: {metadata.get('filename', 'unknown')} "
            f"page {metadata.get('page_number', 'unknown')} "
            f"chunk {metadata.get('chunk_index', 'unknown')}"
        )
        document_text = result.get("document", "")
        prompt_lines.append(f"[{index}] {source_label}")
        prompt_lines.append(document_text)
        prompt_lines.append("")

    prompt_lines.append(
        "Answer the question using only the information above. Include citations like [1], [2] where relevant."
    )
    return "\n".join(prompt_lines)


def call_gemini(prompt: str) -> str:
    """Send the assembled prompt to Gemini and return the raw model response."""
    model_names = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-flash-latest", "gemini-pro-latest"]
    last_error: Exception | None = None

    for model_name in model_names:
        try:
            llm = init_chat_model(
                model=model_name,
                model_provider="google_genai",
                api_key=settings.GEMINI_API_KEY,
            )
            logger.info("calling Gemini with model=%s prompt_len=%d", model_name, len(prompt))
            response = llm.generate(messages=[[HumanMessage(content=prompt)]])
            logger.info("gemini response object type=%s", type(response))
            # Attempt to log any returned text safely
            try:
                if response and response.generations and response.generations[0]:
                    logger.info("gemini returned text length=%d", len(response.generations[0][0].text or ""))
            except Exception:
                logger.debug("Could not introspect gemini response object: %s", traceback.format_exc())
            if response and response.generations and response.generations[0]:
                return response.generations[0][0].text
        except Exception as exc:
            logger.error("Gemini model %s failed: %s", model_name, exc)
            logger.error(traceback.format_exc())
            last_error = exc
            continue

    if last_error is not None:
        raise RuntimeError("Failed to generate a response from Gemini.") from last_error

    raise RuntimeError("Gemini generation returned no answer.")


def answer_question(question: str, doc_ids: List[str] | None = None) -> Dict[str, object]:
    """Run the complete RAG workflow and return a cited answer."""
    try:
        # 1) Embed the incoming user question.
        logger.info("Embedding question: len=%d", len(question))
        query_embedding = embed_question(question)
        logger.info("Query embedding length=%d", len(query_embedding))

        # 2) Retrieve the top 5 most relevant chunks from ChromaDB.
        retrieved_chunks = retrieve_top_chunks(query_embedding, top_k=5, doc_ids=doc_ids)
        logger.info("Retrieved chunks count=%d", len(retrieved_chunks))

        # 3) Build a prompt that includes the question and retrieved excerpts.
        if not retrieved_chunks:
            logger.warning("No retrieved chunks available for question=%s; returning informative message.", question)
            return {
                "answer": (
                    "I couldn't find any indexed documents or relevant context to answer this question. "
                    "Please upload PDFs first or try a different query."
                ),
                "sources": [],
                "prompt": "",
                "error": True,
            }

        prompt = build_rag_prompt(question, retrieved_chunks)
        logger.info("Constructed prompt length=%d", len(prompt))

        # 4) Call Gemini with the constructed prompt.
        try:
            answer_text = call_gemini(prompt)
            logger.info("Gemini produced answer length=%d", len(answer_text or ""))
        except Exception as exc:
            # If Gemini is not available, fall back to a local deterministic answer for dev/testing.
            logger.error("Primary LLM call failed; using local fallback. Error: %s", exc)
            logger.error(traceback.format_exc())
            try:
                from app.services.rag_fallback import local_fallback_answer

                answer_text = local_fallback_answer(question, retrieved_chunks)
                # mark as fallback in the prompt for visibility
                prompt = prompt + "\n\n[LOCAL_FALLBACK_USED]"
            except Exception:
                logger.error("Local fallback failed: %s", traceback.format_exc())
                raise

        # 5) Return the answer and the source citations used for retrieval.
        sources = [
            {
                "doc_id": item["doc_id"],
                "filename": item["metadata"].get("filename"),
                "page_number": item["metadata"].get("page_number"),
                "chunk_index": item["metadata"].get("chunk_index"),
            }
            for item in retrieved_chunks
        ]

        return {
            "answer": answer_text,
            "sources": sources,
            "prompt": prompt,
            "error": False,
        }
    except Exception as exc:
        logger.exception("RAG pipeline failed")
        return {
            "answer": (
                "Sorry, something went wrong while generating your answer. "
                "Please try again in a few moments."
            ),
            "sources": [],
            "prompt": "",
            "error": True,
        }
