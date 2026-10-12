# Backend Technical Analysis

Source of truth: files under `backend/`, not README claims. No secrets are reproduced. This is an educational source analysis; runtime behavior not established by code is identified as such.

## 1. What the backend does

This FastAPI service ingests research PDFs and answers questions about their extracted text.

1. Save an uploaded PDF locally.
2. Extract page text with PyPDF.
3. Split text into overlapping chunks.
4. Embed chunks with Sentence Transformers.
5. Store text, vectors, and metadata in ChromaDB.
6. Embed a question and retrieve similar chunks.
7. Put retrieved excerpts into a Gemini prompt.
8. Return an answer and sources; persist successful answers in SQLite.

Storage responsibilities differ: filesystem stores source PDFs, ChromaDB stores searchable chunks/vectors, and SQLite stores chat history. There is no SQL document table.

## 2. Backend tree

```text
backend/
├── .env / .env.example       # Local settings / template
├── requirements.txt
├── db.sqlite3                # Local runtime database
├── chroma_db/                # Local vector data
├── uploads/                  # Local uploaded PDFs
├── app/
│   ├── main.py               # FastAPI setup, CORS, startup, router mounts
│   ├── core/
│   │   ├── config.py         # Settings
│   │   └── database.py       # SQLite engine/session dependency
│   ├── models/
│   │   ├── history.py        # SQLAlchemy history table
│   │   └── schemas.py        # Pydantic API models
│   ├── routers/
│   │   ├── upload.py         # POST /upload/pdf
│   │   ├── chat.py           # POST /chat/
│   │   ├── documents.py      # GET document list/detail
│   │   ├── history.py        # GET history by session ID
│   │   └── summarize.py      # GET document summary
│   └── services/
│       ├── pdf_service.py    # Save, parse, chunk, embed, store, cleanup
│       ├── embedding_service.py
│       ├── vector_store.py   # Chroma initialization and operations
│       ├── rag_service.py    # Retrieval, prompt, Gemini, sources
│       ├── rag_fallback.py   # Local excerpt response
│       └── summarization_service.py
├── check_chroma.py
├── debug_imports.py
├── inspect_genai.py
├── inspect_init_chat.py
├── inspect_models.py
├── inspect_models_list.py
├── list_models.py
├── list_models_lowlevel.py
└── test_rag_run.py
```

Generated folders/database are runtime data, not source modules. `app/__init__.py`, `core/__init__.py`, and `models/__init__.py` contain only package comments. `routers/__init__.py` exports upload/chat routers, but `main.py` imports all routers directly.

## 3. File and dependency map

| File | Main contents and role |
|---|---|
| `app/main.py` | `app`, `health()`, `on_startup()`; CORS and router registration |
| `app/core/config.py` | `Settings`, global `settings`, CORS origin parsing |
| `app/core/database.py` | SQLite URL, `engine`, `SessionLocal`, `Base`, `get_db()` |
| `app/models/history.py` | ORM `ChatHistory` table |
| `app/models/schemas.py` | `ChatRequest`, `ChatResponse`, Pydantic `ChatHistory` |
| `app/routers/upload.py` | MIME check; delegates to `process_pdf_upload()` |
| `app/routers/chat.py` | `detect_greeting()`, `chat()`; validates flow and persists successful results |
| `app/routers/documents.py` | `documents()`, `document_detail()`; reads Chroma data |
| `app/routers/history.py` | Queries history by `session_id` |
| `app/routers/summarize.py` | Delegates to `summarize_document()` |
| `app/services/pdf_service.py` | Save/extract/split pipeline and cleanup |
| `app/services/embedding_service.py` | Global model, `embed_texts()`, `embed_chunks()` |
| `app/services/vector_store.py` | Global Chroma client/collection; add/list/detail/search/delete helpers |
| `app/services/rag_service.py` | `embed_question()`, retrieval, prompt, Gemini calls, `answer_question()` |
| `app/services/rag_fallback.py` | `local_fallback_answer()` concatenates excerpts |
| `app/services/summarization_service.py` | Retrieves chunk text and calls Gemini for summary |
| `requirements.txt` | Dependency declarations |
| `.env.example` | Names/default examples for settings; contains no production credential |

Root utilities: `check_chroma.py` prints Chroma documents; `debug_imports.py` attempts service/router imports; `inspect_*` and `list_models*` inspect Google SDK/LangChain model APIs; `test_rag_run.py` manually calls `answer_question()`. They are diagnostics, not production routes or a formal test suite.

## 4. Actual technology stack

| Technology | Use in this backend |
|---|---|
| Python | All application and diagnostic code |
| FastAPI | Routing, request parsing, dependencies, OpenAPI |
| Uvicorn | ASGI server for `app.main:app` |
| Pydantic | Request/response models and validation |
| pydantic-settings | Environment-backed `Settings` |
| SQLAlchemy + SQLite | ORM and persistent chat history |
| ChromaDB | Vector collection, chunk storage, semantic retrieval |
| Sentence Transformers | Embeds document chunks and questions |
| `all-MiniLM-L6-v2` | Exact model name configured in `embedding_service.py` |
| PyPDF (`pypdf`) | PDF page text extraction |
| LangChain | Recursive splitter and chat-model abstraction |
| `langchain-google-genai` | Gemini provider integration through LangChain |
| `python-multipart` | Multipart uploads required by FastAPI's file parsing |

LangChain does not own the complete RAG pipeline. Search, prompt assembly, filtering, sources, persistence, and fallback are implemented in this project.

## 5. Dependencies

Declared in `requirements.txt`:

| Package | Version in file | Directly used / evidence |
|---|---:|---|
| `fastapi` | Unpinned | Yes; app and routers |
| `uvicorn` | Unpinned | Yes operationally; launch server |
| `python-dotenv` | Unpinned | No direct import found; may be indirect |
| `langchain` | Unpinned | Yes; `init_chat_model`, `HumanMessage` |
| `langchain-community` | Unpinned | No direct application import found |
| `langchain-google-genai` | Unpinned | Provider used through LangChain |
| `chromadb` | Unpinned | Yes; vector store |
| `sentence-transformers` | Unpinned | Yes; embeddings |
| `pypdf` | Unpinned | Yes; PDF extraction |
| `sqlalchemy` | Unpinned | Yes; ORM and sessions |
| `python-multipart` | Unpinned | Required for file form parsing |
| `pydantic-settings` | Unpinned | Yes; configuration |
| `langchain-text-splitters` | `1.1.2` | Yes; chunk/split operations |
| `pydantic` | `2.13.4` | Yes; schemas |

No removal recommendation follows merely from lack of a direct import; dependencies may be transitive or intentionally retained. Diagnostic scripts import `google.genai` directly, but production routes use LangChain's `google_genai` provider.

## 6. Configuration

`Settings` is defined in `app/core/config.py` and instantiated globally. It loads `.env` with UTF-8 encoding through Pydantic Settings.

| Environment variable | Default | Purpose / consumer |
|---|---|---|
| `GEMINI_API_KEY` | Empty string | Gemini calls in RAG and summarization |
| `UPLOAD_FOLDER` | `uploads` | PDF destination |
| `CHROMA_DB_PATH` | `./chroma_db` | Chroma persistence path |
| `SQLITE_PATH` | `./db.sqlite3` | SQLite database path |
| `ALLOWED_ORIGINS` | `*` | CORS origins |

`allowed_origins_list` maps blank or `*` to `['*']`; otherwise it splits comma-separated values and trims them. The actual `.env` secret values are intentionally not examined/reproduced. Paths are relative by default, so their effective locations depend on the process working directory.

## 7. Startup and application lifecycle

Run from `backend/`:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

```text
Uvicorn imports app.main
  -> settings and SQLAlchemy engine are created
  -> history ORM model is imported into Base metadata
  -> FastAPI object is created
  -> CORS middleware is added
  -> /health is registered
  -> routers are imported and mounted
  -> service globals initialize through imports
  -> startup event creates missing SQL tables
  -> Uvicorn serves requests
```

`main.py` creates `FastAPI(title='AI Research Assistant - Backend', version='0.1.0')`. It configures CORS with configured origins, credentials enabled, all methods and all headers. Since default origin is `*`, production configuration should use a specific allowlist, especially with credentials enabled.

Routers mount at `/upload`, `/chat`, `/documents`, `/history`, and `/summarize`. Their imports are in one broad `try/except`; an import failure may skip registration while the app object still exists.

`on_startup()` runs `Base.metadata.create_all(bind=engine)`. It creates missing SQL tables but does not migrate schemas, create document tables, or test Gemini. There is no shutdown hook.

`embedding_service.py` loads its model at import time; `vector_store.py` creates its client and collection at import time. These are global resources, not per-request objects.

## 8. API endpoint reference

| Method / URL | Function | Input | Response | Error behavior |
|---|---|---|---|---|
| `GET /health` | `main.py:health` | None | `{"status":"ok"}` | `200`; no dependency health checks |
| `POST /upload/pdf` | `routers/upload.py:upload_pdf` | Multipart `file: UploadFile` | Upload result envelope | Missing field normally `422`; most failures return `200`, `success:false` |
| `POST /chat/` | `routers/chat.py:chat` | JSON `ChatRequest` | `ChatResponse` | Invalid body normally `422`; application errors often `200` |
| `GET /documents/` | `routers/documents.py:documents` | None | `{"documents":[...]}` | `200`; store errors may become `500` |
| `GET /documents/{doc_id}` | `routers/documents.py:document_detail` | Path `doc_id` | ID and chunks | `404` if no chunks |
| `GET /history/{session_id}` | `routers/history.py:history` | Path `session_id` | List of history entries | `404` if empty; schema mismatch may fail serialization |
| `GET /summarize/{doc_id}` | `routers/summarize.py:summarize` | Path `doc_id` | ID and summary string | `404` on missing document; other errors may be `500` |

No query parameters are declared in route signatures. The app does not define special request headers. FastAPI's normal validation/documentation behavior applies.

### Request and response shapes

`ChatRequest`:

```python
class ChatRequest(BaseModel):
    session_id: str
    doc_ids: Optional[List[str]] = None
    question: str
```

There are no explicit length constraints or custom validators. `ChatResponse` contains `answer: str`, `sources: List[dict]`, and `error: bool = False`. Internal RAG results include `prompt`, but the response model omits it.

A generated source contains `doc_id`, `filename`, `page_number`, and `chunk_index`.

Upload requires multipart field exactly named `file`. The router compares the client-provided MIME type to exact string `application/pdf`; service separately checks `.pdf` suffix. Successful upload shape:

```json
{"success":true,"doc_id":"...","filename":"paper.pdf","message":"Upload completed successfully.","page_count":3,"text_length":25000,"chunk_count":30}
```

Values are illustrative. Logical failures usually preserve keys `success`, `doc_id`, and `message` and use HTTP 200.

## 9. PDF upload and processing

Entry: `routers/upload.py:upload_pdf()`; pipeline: `services/pdf_service.py:process_pdf_upload()`.

```text
multipart UploadFile
 -> exact MIME check
 -> sanitize basename and check .pdf suffix
 -> generate UUID doc_id
 -> save file
 -> PyPDF page extraction
 -> per-page chunking
 -> attach document metadata
 -> embed chunks
 -> insert in Chroma
 -> return counts and ID
```

`Path(upload_file.filename).name` strips directory components. The service checks `.lower().endswith('.pdf')`, but MIME and suffix do not prove that file bytes are actually a valid PDF.

The path is `{UPLOAD_FOLDER}/{doc_id}_{filename}` where `doc_id = uuid.uuid4().hex`. `save_upload_file()` reads the whole upload into memory, writes it to disk, and closes the `UploadFile` in `finally`. No explicit size limit or chunked disk streaming is present.

`extract_pdf_pages()` uses `PdfReader` and returns one string per page using `page.extract_text() or ''`. Empty-text pages remain empty strings. There is no normalization, OCR, header/footer removal, or language handling. Scanned/image-only PDFs generally yield no chunks and are rejected with a text-extraction message.

`chunk_page_text()` uses `RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, length_function=len)`. Splitting occurs per page; `chunk_index` restarts at zero per page. Each chunk has `page_number`, `chunk_index`, `text_length`, `text`, then receives `doc_id` and `filename`.

An empty chunk set raises `UploadProcessingError` before embedding. Reading, embedding, and storage failures are caught by stage, logged server-side, and returned as safe messages. The service attempts file cleanup and, when known, deletion of inserted Chroma IDs. No SQL document metadata is written.

## 10. Embedding pipeline

`services/embedding_service.py` defines:

```python
MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)
```

The model loads once during module import. `embed_texts()` calls `model.encode(texts, convert_to_numpy=True, show_progress_bar=False)` and normalizes each vector to native Python floats. `embed_chunks()` embeds chunk text in a batch, verifies vector count, and attaches `embedding` to each chunk.

Ingestion: `chunk text -> SentenceTransformer -> float vector -> Chroma`.

Query: `question -> same model -> query vector -> Chroma query`.

An embedding is a numeric representation intended to preserve semantic relations. Using the same encoder for chunks and questions puts both in a comparable vector space. The code does not select CPU/GPU or assert vector dimension. `all-MiniLM-L6-v2` commonly yields 384 dimensions, but the backend does not hard-code this.

## 11. ChromaDB and document representation

`services/vector_store.py` creates `Path(settings.CHROMA_DB_PATH)`, a Chroma `Client(Settings(persist_directory=...))`, and collection `research_documents` with `embedding_function=None`. The application supplies embeddings itself.

Each record contains chunk text, vector, and metadata:

```python
{
    "doc_id": str(...),
    "filename": str(...),
    "page_number": int(...),
    "chunk_index": int(...),
}
```

Vector IDs are:

```text
{doc_id}::page_{page_number}::chunk_{chunk_index}
```

`add_documents()` checks generated IDs for duplicates before `collection.add()`.

`similarity_search(query_embedding, k=5, doc_ids=None)` validates numeric vector values and requests `n_results=search_k`. With no IDs, `search_k=k`; with IDs, it is `max(k, len(doc_ids)*2)`. It filters returned candidates in Python, preserving Chroma result order and stopping at `k` matches. This is not a Chroma-side metadata filter and can miss relevant requested-document chunks outside the initial candidates.

No distance metric is explicitly configured. Chroma's version-specific default applies. Internal results include `distance`; the API does not expose or reinterpret it.

`list_documents()` and `get_document_chunks()` use `collection.peek()` then group/filter results in Python. Source alone does not establish that `peek()` returns every record for arbitrarily large collections.

`delete_documents(ids)` deletes supplied IDs. `delete_document(doc_id)` deletes the bare document ID, but inserted IDs include page/chunk suffixes, so that helper does not match the insertion scheme. Neither helper has an HTTP route.

**Why two databases?** SQLite/SQLAlchemy stores structured session history; ChromaDB stores vectors and associated chunks for semantic search. They support different queries.

## 12. Chat and RAG pipeline

Entry: `routers/chat.py:chat()`; orchestration: `services/rag_service.py:answer_question()`.

```text
POST /chat/
 -> Pydantic ChatRequest validation
 -> blank-question check
 -> greeting check
 -> list_documents() check
 -> embed_question()
 -> retrieve_top_chunks(top_k=5)
 -> build_rag_prompt()
 -> try Gemini models
 -> local excerpt fallback if all fail
 -> construct source metadata
 -> save when error is false
 -> return ChatResponse
```

### Early checks

Blank questions return an error response but HTTP 200. `detect_greeting()` trims, lowercases, removes `? ! . ,`, normalizes spaces, then checks a fixed greeting/thanks set. Greeting responses bypass RAG and are not saved. If `list_documents()` is empty, the route returns an upload prompt; it is not saved.

### Retrieval

`embed_question()` calls `embed_texts([question])`. `retrieve_top_chunks()` calls `similarity_search()` with `top_k=5`. If no chunks are returned, RAG returns an error response and does not call Gemini.

Keyword search looks for matching terms; semantic search compares embeddings and can match different wording with related meaning. This backend uses semantic vector search only: no keyword hybrid, reranker, or score threshold is visible.

### Prompt and Gemini

`build_rag_prompt()` inserts the question, retrieved chunk text, numbered source labels, filename/page/chunk metadata, and instructions to use only excerpts, avoid unsupported claims, and cite with markers such as `[1]`. Prompt instructions do not guarantee model compliance.

`call_gemini()` tries, in order:

1. `gemini-2.5-flash`
2. `gemini-2.5-pro`
3. `gemini-flash-latest`
4. `gemini-pro-latest`

It calls `init_chat_model(model=..., model_provider='google_genai', api_key=settings.GEMINI_API_KEY)`, sends one `HumanMessage` through `llm.generate()`, and reads `response.generations[0][0].text`.

The API key is supplied by configuration; it is not hard-coded in service code. Exceptions are logged and trigger the next candidate. Diagnostic scripts use the direct `google.genai` SDK, but production services use LangChain.

### Fallback, sources, persistence

`local_fallback_answer()` concatenates up to the first three retrieved chunk texts and states that the LLM is unavailable. It is deterministic for the same retrieved results and does not synthesize an answer from the question. If fallback fails, the outer RAG handler returns a generic error.

Sources map each retrieved item to `doc_id`, filename, page number, and chunk index. Chat saves results only when `error` is false; successful fallback answers are therefore saved. Blank/greeting/no-document/no-context/error responses are not.

PDF content is untrusted and inserted directly into the prompt. No robust prompt-injection isolation is implemented.

## 13. SQLAlchemy, SQLite, sessions, and history

`core/database.py` builds `sqlite:///{settings.SQLITE_PATH}`, an engine with `check_same_thread=False`, a `SessionLocal` factory, and declarative `Base`. `get_db()` yields a session and closes it in `finally`; routes request it with `Depends(get_db)`.

`models/history.py` defines the sole ORM table, `chat_history`:

| Column | Definition |
|---|---|
| `id` | Integer primary key, indexed |
| `session_id` | String, required, indexed |
| `question` | Text, required |
| `answer` | Text, required |
| `sources` | JSON, required |
| `created_at` | String, required; SQLite server default `datetime('now')` |

The inspected local SQLite schema contained this table and indexes on `id` and `session_id`. There are no foreign keys, relationships, or document rows.

The backend does not create session IDs; the caller supplies a string in `ChatRequest`. A session is just rows sharing that value. `GET /history/{session_id}` queries exact equality and returns 404 when empty. There is no session listing, ownership, expiry, or user isolation.

**Schema mismatch:** ORM field is `created_at`, but Pydantic `ChatHistory` requires `timestamp`. This may break response serialization. The schema uses `orm_mode = True`, an older configuration form for the pinned Pydantic v2; actual compatibility should be verified in the chosen environment.

## 14. Summarization

`GET /summarize/{doc_id}` calls `summarize_document()`; router converts service `ValueError` to 404.

The service retrieves matching chunks from Chroma, extracts their text, splits again with size 1000/overlap 200, joins with blank lines, and truncates at 16,000 characters with a marker. It tries the same four Gemini model names, sends one prompt, and returns the first generation's text.

The prompt asks for main ideas, important facts, structure, and no invented details. It is not a true map-reduce flow despite the route docstring. Truncation is character-based (not token-based) and may omit later text. There is no summary cache or local fallback; unhandled Gemini errors can result in HTTP 500.

## 15. Error behavior

| Case | Behavior in source |
|---|---|
| Missing upload field | FastAPI validation; normally 422 |
| Wrong upload MIME | HTTP 200 with `success:false` |
| Wrong extension | HTTP 200 failure envelope |
| Corrupt/unreadable PDF | Logged; cleanup attempted; safe stage message |
| No extracted chunks | Safe failure before embedding |
| Embedding/Chroma failure | Logged; cleanup attempted; safe stage message |
| Blank chat question | HTTP 200, `error:true` |
| Greeting/no documents | HTTP 200 informational response; not stored |
| No retrieved chunks | Error result, no Gemini call |
| Gemini failure | Try next model, then local fallback |
| Fallback failure | Generic RAG error response |
| Chat DB failure | Broad handler returns generic chat error |
| Missing document | Detail/summary route returns 404 when no chunks found |
| Missing history | History route returns 404 |
| Other summary/store exception | Not consistently translated; may be HTTP 500 |

Upload and chat exceptions are caught and converted to safe response bodies; tracebacks are logged server-side. Chat's unexpected-error path logs the question, session ID, and document IDs, which may put sensitive research text in logs.

## 16. Security review

- **Secrets:** Gemini key comes from settings; no key literal is required by application code. Keep `.env` protected.
- **CORS:** default `*` with credentials enabled; production should configure explicit trusted origins.
- **File validation:** checks client MIME and filename extension, not PDF signature/content. No size limit, malware scan, encryption check, or quota is implemented.
- **Paths:** `Path(filename).name` strips directory components and generated UUID prefixes the stored name; no endpoint takes arbitrary filesystem paths.
- **Memory/resources:** upload is read entirely into memory; no rate limiting, quotas, or background processing queue is present.
- **SQL injection:** history uses SQLAlchemy expression filtering, not concatenated SQL; no obvious injection in inspected query.
- **Authentication/isolation:** no auth, authorization, user IDs, tenant separation, or ownership checks. Data is shared by this service instance.
- **Prompt injection:** untrusted PDF text shares the prompt with instructions; there is no robust separation.
- **Logging:** questions and traces may be logged. Review privacy, redaction, access, and retention for deployment.
- **Storage:** files and databases use local paths; backup, retention, and permissions are not managed by application code.

## 17. LangChain's actual role

Used components:

- `RecursiveCharacterTextSplitter` in PDF processing and summary preparation.
- `init_chat_model` in RAG and summarization.
- `HumanMessage` for prompts.

Handwritten parts include Sentence Transformer encoding, Chroma operations, result filtering, prompt building, source mapping, Gemini fallback sequence, local fallback, and SQL persistence. LangChain is a utility/provider layer, not the complete RAG orchestrator.

## 18. Architectural patterns

- **Router/service separation:** HTTP routes delegate work, e.g. `upload_pdf()` to `process_pdf_upload()`.
- **Dependency injection:** `Depends(get_db)` provides a request-scoped session; generator cleanup closes it.
- **ORM:** `ChatHistory` maps Python attributes to the relational history table.
- **Central configuration:** one `Settings` object exposes environment-backed values.
- **Global resources:** settings, engine, embedding model, Chroma client, and collection are module globals; they avoid per-request recreation but initialize during imports.
- **Service decomposition:** PDF, embedding, storage, RAG, fallback, and summary logic are separate modules.

## 19. Important source-level caveats

These are source observations, not claims that every issue has been reproduced:

1. `ChatHistory.created_at` and response schema `timestamp` differ; history serialization may fail.
2. `vector_store.py` calls `logging.getLogger()` in the Chroma exception handler without a visible module-level `import logging`; that exception path may itself raise `NameError`.
3. Document listing/detail use `collection.peek()`; complete coverage of large collections is not established by the source.
4. `doc_ids` filtering occurs after vector search and may omit matching chunks.
5. `delete_document()` uses a bare `doc_id`, unlike stored IDs with page/chunk suffixes; it is not exposed by a route.
6. Router imports share a broad `try/except`, so one import error can prevent the group from registering.
7. Sentence Transformer and Chroma globals initialize during imports.
8. Summary is one truncated prompt, not map-reduce.
9. Many upload/chat application failures are encoded in HTTP 200 response bodies.

## 20. Capabilities not implemented

The inspected source has no implementation for authentication, authorization, multi-user isolation, session listing/ownership/expiry, HTTP document deletion, OCR, non-PDF ingestion, streaming, hybrid retrieval, reranking, retrieval evaluation, cloud object storage, background jobs, upload limits/quotas, rate limiting, virus scanning, robust PDF signature validation, strong prompt-injection defense, summary caching/fallback, SQL document metadata, or explicit migrations.

`doc_ids` is accepted, but that alone does not establish robust multi-document search because filtering is post-query.

## 21. Code-reading order

1. `app/main.py` — app, middleware, routers, startup.
2. `app/core/config.py`, then `app/core/database.py` — configuration and SQL setup.
3. `app/models/history.py` and `app/models/schemas.py` — persisted/API structures.
4. `app/routers/upload.py` -> `app/services/pdf_service.py` — upload path.
5. `app/services/embedding_service.py` -> `app/services/vector_store.py` — vectors and storage.
6. `app/routers/chat.py` -> `app/services/rag_service.py` -> `rag_fallback.py` — question path.
7. `app/routers/documents.py` and `app/routers/history.py` — retrieval APIs.
8. `app/routers/summarize.py` -> `app/services/summarization_service.py` — summary path.
9. Root diagnostic scripts — library experiments and manual smoke test.

## 22. Learning roadmap

| Level | Topics | Why this project needs them / source |
|---|---|---|
| 1. Foundations | Python modules/exceptions; HTTP, REST, JSON, multipart | Understand request flow; `main.py`, routers |
| 2. FastAPI | routes, `UploadFile`, `Depends`, validation, middleware, startup | Understand API behavior; `main.py`, `routers/` |
| 3. Database/config | env vars, SQLite, SQLAlchemy sessions/ORM/transactions | Understand history; `config.py`, `database.py`, `history.py` |
| 4. PDF processing | extraction, scans vs text PDFs, OCR, chunks, overlap | Understand ingestion; `pdf_service.py` |
| 5. Embeddings | vectors, encoder, semantic distance | Understand text-to-vector; `embedding_service.py` |
| 6. Vector DB | collections, metadata, nearest neighbors, persistence | Understand retrieval; `vector_store.py` |
| 7. RAG | context selection, prompting, sources, evaluation | Understand grounded answers; `rag_service.py`, `chat.py` |
| 8. LLM integration | API key, model setup, prompt, parsing, fallback | Understand generation; RAG and summary services |
| 9. Production | auth, isolation, limits, logging, migrations, queues, security, evaluation | Understand gaps before deployment |

Before advancing from embeddings to RAG, explain why both chunks and questions use the same encoder. Before production topics, trace storage side effects and failure handling.

## 23. Study checklist

1. What happens from `POST /upload/pdf` to Chroma insertion?
2. Where is the file stored, and how is its name generated?
3. How are pages represented when extraction returns no text?
4. Why do scans fail, and is OCR present?
5. What are chunk size, overlap, and metadata fields?
6. Which model embeds text, and when is it loaded?
7. What exactly is stored in each Chroma record?
8. Why is `embedding_function=None` used?
9. How does a question become a query vector?
10. How many results are retrieved, and how is `doc_ids` applied?
11. How does semantic search differ from keyword search?
12. How are retrieved chunks included in the Gemini prompt?
13. What do citations in the prompt mean, and what do they not guarantee?
14. Which Gemini models are attempted?
15. What does the local fallback actually generate?
16. Which chat outcomes are saved?
17. How is a session represented, and can sessions be listed?
18. Why might history serialization fail?
19. Why are SQLite and Chroma both used?
20. Does SQL store document records?
21. What does `/health` verify?
22. What does `create_all()` do and not do?
23. What text does summarization use and truncate?
24. Is summary truly map-reduce?
25. How do upload, embedding, Chroma, Gemini, and DB errors surface?
26. Which environment variable supplies the Gemini key?
27. What upload validation/resource controls are absent?
28. What are the prompt-injection and logging risks?
29. Which tasks use LangChain versus custom code?
30. Which resources initialize at import time?

## 24. Trace-the-code exercises

### Exercise 1 — Upload

Follow `routers/upload.py:upload_pdf()` -> `services/pdf_service.py:process_pdf_upload()` -> `save_upload_file()` -> `extract_pdf_pages()` -> `chunk_page_text()` -> `embedding_service.py:embed_chunks()` -> `embed_texts()` -> `vector_store.py:add_documents()`. Record the changing data shape and metadata.

### Exercise 2 — Retrieval

Follow `routers/chat.py:chat()` -> `rag_service.py:answer_question()` -> `embed_question()` -> `embed_texts()` -> `retrieve_top_chunks()` -> `vector_store.py:similarity_search()`. Mark where `doc_ids` is applied and what the result contains.

### Exercise 3 — Gemini and prompt

Follow `build_rag_prompt()` -> `call_gemini()`. Label prompt text as application instruction, user question, retrieved PDF text, or metadata. Find how generated text is extracted.

### Exercise 4 — Fallback

Follow the Gemini exception path into `local_fallback_answer()`. Check how many chunks it includes, whether it synthesizes an answer, and whether its result is persisted.

### Exercise 5 — History

Trace `ChatRequest.session_id` -> ORM creation -> `db.add/commit` -> `GET /history/{session_id}`. Compare `created_at` with schema `timestamp` and check Pydantic v2 ORM configuration.

### Exercise 6 — Summary

Trace `summarize()` -> `summarize_document()` -> `get_document_chunks()` -> re-split/join/truncate -> Gemini prompt/call. Compare this path with chat and note missing fallbacks.

## 25. Architecture diagram

```mermaid
flowchart TD
    Client[HTTP caller] --> App[FastAPI: app/main.py]
    App --> Health[GET /health]
    App --> Upload[POST /upload/pdf]
    App --> Chat[POST /chat/]
    App --> Docs[GET /documents/ and /documents/{doc_id}]
    App --> History[GET /history/{session_id}]
    App --> Summary[GET /summarize/{doc_id}]

    Upload --> PDF[pdf_service: save, extract, chunk]
    PDF --> Files[Local uploads directory]
    PDF --> Embed[SentenceTransformer]
    Embed --> Chroma[ChromaDB research_documents]
    PDF --> Chroma
    Docs --> Chroma

    Chat --> RAG[rag_service: query embedding and retrieval]
    RAG --> Embed
    RAG --> Chroma
    Chroma --> Context[Retrieved chunks + metadata]
    Context --> Prompt[Prompt construction]
    Prompt --> Gemini[Gemini via LangChain]
    Gemini --> Answer[Answer + sources]
    Gemini -. failure .-> Fallback[Local excerpt fallback]
    Fallback --> Answer
    Answer --> SQLite[(SQLite chat_history)]
    History --> SQLite
    Summary --> Chroma
    Summary --> Gemini

    Config[Settings from .env/environment] --> App
    Config --> Embed
    Config --> Chroma
    Config --> SQLite
    Config --> Gemini
```

## 26. Explain it simply

If you remember one thing, remember this: **the backend turns PDF text into vectors, retrieves chunks whose vectors are close to a question's vector, and supplies those chunks to Gemini as context.**

During upload, FastAPI receives a file, the service saves it, PyPDF extracts page text, a recursive splitter creates overlapping chunks, and `all-MiniLM-L6-v2` encodes them. ChromaDB stores chunk text, vectors, and page/document metadata.

During chat, the same model encodes the question. ChromaDB finds nearby chunk vectors. The backend builds a prompt from the question and those excerpts, then calls Gemini through LangChain. If Gemini attempts all fail, the fallback returns raw excerpts rather than a synthesized answer. Responses include source metadata.

SQLite serves a different purpose: it stores successful questions, answers, sources, and caller-provided session IDs. It does not store PDFs. ChromaDB is for semantic retrieval; SQLite is for structured history.

This is a useful RAG prototype, but it lacks authentication, user isolation, OCR, streaming, upload limits, session discovery, hybrid retrieval, robust prompt-injection defenses, and evaluation. Reading the upload and chat paths end to end explains both the core design and its current boundaries.