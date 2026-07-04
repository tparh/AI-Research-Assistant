from typing import Dict, List

from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"

# Load the sentence-transformers model once at module import.
# This model is small, fast, and well-suited for semantic search embeddings.
model = SentenceTransformer(MODEL_NAME)


def _normalize_embedding(embedding) -> List[float]:
    if hasattr(embedding, "tolist"):
        raw = embedding.tolist()
    else:
        raw = embedding

    if not isinstance(raw, list):
        raw = list(raw)

    return [float(x) for x in raw]


def _assert_embedding_vector(embedding: List[float]) -> List[float]:
    if not isinstance(embedding, list):
        raise TypeError("Embedding must be a list of float values.")

    normalized = []
    for value in embedding:
        if hasattr(value, "tolist"):
            raise TypeError(
                f"Embedding contains non-native value {type(value).__name__}; "
                "convert to native Python floats before persisting."
            )
        if not isinstance(value, (float, int)):
            raise TypeError(
                f"Embedding contains unsupported type {type(value).__name__}; "
                "expected float or int values."
            )
        normalized.append(float(value))

    return normalized


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Generate dense embeddings for a list of text strings."""
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return [_assert_embedding_vector(_normalize_embedding(vector)) for vector in embeddings]


def embed_chunks(chunks: List[Dict[str, object]]) -> List[Dict[str, object]]:
    """Attach embeddings to each text chunk in the provided metadata list."""
    texts = [chunk["text"] for chunk in chunks]
    embeddings = embed_texts(texts)

    if len(embeddings) != len(chunks):
        raise ValueError("Embedding count does not match chunk count")

    for chunk, embedding in zip(chunks, embeddings):
        chunk["embedding"] = embedding

    return chunks
