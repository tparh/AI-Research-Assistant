from pathlib import Path
from typing import Dict, List, Optional

from chromadb import Client
from chromadb.config import Settings

from app.core.config import settings


CHROMA_DIR = Path(settings.CHROMA_DB_PATH)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

client = Client(Settings(persist_directory=str(CHROMA_DIR)))
collection = client.get_or_create_collection(
    name="research_documents",
    embedding_function=None,
)


def _normalize_embedding(embedding) -> List[float]:
    if hasattr(embedding, "tolist"):
        raw = embedding.tolist()
    else:
        raw = embedding

    if not isinstance(raw, list):
        raw = list(raw)

    return [float(x) for x in raw]


def _normalize_embeddings(embeddings: List) -> List[List[float]]:
    return [_normalize_embedding(vector) for vector in embeddings]


def _assert_query_embedding(embedding: List[float]) -> List[float]:
    if not isinstance(embedding, list):
        raise TypeError("Query embedding must be a list of floats.")

    normalized: List[float] = []
    for value in embedding:
        if hasattr(value, "tolist"):
            raise TypeError(
                f"Query embedding contains non-native value {type(value).__name__}; "
                "use pure Python floats."
            )
        if not isinstance(value, (float, int)):
            raise TypeError(
                f"Query embedding contains unsupported type {type(value).__name__}; "
                "expected float or int values."
            )
        normalized.append(float(value))

    return normalized


def add_documents(documents: List[Dict[str, object]]) -> List[str]:
    """Add documents with embeddings and metadata to the persistent ChromaDB store."""
    ids = [
        f"{doc['doc_id']}::page_{doc['page_number']}::chunk_{doc['chunk_index']}"
        for doc in documents
    ]

    if len(ids) != len(set(ids)):
        duplicate_ids = [item for item in ids if ids.count(item) > 1]
        raise ValueError(
            "Duplicate IDs generated for ChromaDB storage: "
            + ", ".join(sorted(set(duplicate_ids)))
        )

    texts = [str(doc["text"]) for doc in documents]
    embeddings = _normalize_embeddings([doc["embedding"] for doc in documents])
    metadatas = [
        {
            "doc_id": str(doc["doc_id"]),
            "filename": str(doc["filename"]),
            "page_number": int(doc["page_number"]),
            "chunk_index": int(doc["chunk_index"]),
        }
        for doc in documents
    ]

    collection.add(
        ids=ids,
        documents=texts,
        metadatas=metadatas,
        embeddings=embeddings,
    )
    
    return ids


def list_documents() -> List[Dict[str, object]]:
    """Return a list of unique documents based on stored metadata."""
    results = collection.peek()
    docs: Dict[str, Dict[str, object]] = {}

    for metadata in results.get("metadatas", []):
        doc_id = metadata.get("doc_id")
        if not doc_id:
            continue
        if doc_id not in docs:
            docs[doc_id] = {
                "doc_id": doc_id,
                "filename": metadata.get("filename"),
                "page_numbers": set(),
                "chunk_count": 0,
            }
        docs[doc_id]["page_numbers"].add(metadata.get("page_number"))
        docs[doc_id]["chunk_count"] += 1

    return [
        {
            "doc_id": doc_id,
            "filename": doc["filename"],
            "page_numbers": sorted(list(doc["page_numbers"])),
            "chunk_count": doc["chunk_count"],
        }
        for doc_id, doc in docs.items()
    ]


def get_document_chunks(doc_id: str) -> List[Dict[str, object]]:
    """Retrieve all chunks associated with a specific document id."""
    results = collection.peek()
    output: List[Dict[str, object]] = []

    for idx, metadata in enumerate(results.get("metadatas", [])):
        if metadata.get("doc_id") != doc_id:
            continue
        output.append(
            {
                "doc_id": doc_id,
                "chunk_index": metadata.get("chunk_index"),
                "page_number": metadata.get("page_number"),
                "text": results.get("documents", [])[idx],
                "metadata": metadata,
            }
        )

    return output


def similarity_search(
    query_embedding: List[float], k: int = 5, doc_ids: Optional[List[str]] = None
) -> List[Dict[str, object]]:
    """Perform a similarity search over the stored embeddings.

    If doc_ids are provided, filter the returned results to those documents.
    """
    normalized_query = _assert_query_embedding(query_embedding)
    search_k = k if not doc_ids else max(k, len(doc_ids) * 2)
    try:
        results = collection.query(query_embeddings=[normalized_query], n_results=search_k)
    except Exception as exc:
        # Log and re-raise so upstream can provide diagnostics
        import traceback

        logging.getLogger("uvicorn.error").error("ChromaDB query failed: %s", exc)
        logging.getLogger("uvicorn.error").error(traceback.format_exc())
        raise
    output = []

    # Defensive handling if Chroma returned an unexpected structure
    ids_list = results.get("ids", [])
    docs_list = results.get("documents", [])
    metas_list = results.get("metadatas", [])
    dists_list = results.get("distances", [])

    if not ids_list or not metas_list or not docs_list:
        logging.getLogger("uvicorn.error").warning("Chroma returned empty results for query")
        return []

    for idx in range(len(ids_list[0])):
        result_item = {
            "doc_id": results["metadatas"][0][idx].get("doc_id"),
            "document": results["documents"][0][idx],
            "metadata": results["metadatas"][0][idx],
            "distance": results["distances"][0][idx],
        }
        if doc_ids is None or result_item["doc_id"] in doc_ids:
            output.append(result_item)
        if len(output) >= k:
            break

    return output


def delete_document(doc_id: str) -> bool:
    """Delete a stored document by its identifier."""
    collection.delete(ids=[doc_id])
    client.persist()
    return True


def delete_documents(ids: List[str]) -> bool:
    """Delete multiple stored embeddings by their identifiers."""
    if not ids:
        return False
    collection.delete(ids=ids)
    client.persist()
    return True
