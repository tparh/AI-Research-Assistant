def local_fallback_answer(question: str, retrieved_chunks) -> str:
    """Simple deterministic fallback for development: combine retrieved chunks."""
    if not retrieved_chunks:
        return "I don't have any indexed documents to answer that question. Please upload PDFs first."

    # Use first few chunks to form a very simple answer
    excerpts = []
    for i, item in enumerate(retrieved_chunks[:3], start=1):
        excerpts.append(f"[{i}] {item.get('document','')}")

    return (
        "Based on the indexed excerpts:\n\n" + "\n\n".join(excerpts) + "\n\n" +
        "I can't call the configured LLM right now; this is a local fallback answer."
    )
