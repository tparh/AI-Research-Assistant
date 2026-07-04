AI Research Assistant (Phase 1)

Overview
- Backend scaffold for a Retrieval-Augmented Generation (RAG) AI Research Assistant.
- Phase 1 creates the project skeleton, core config loader, FastAPI entrypoint, and SQLAlchemy bootstrap.

Files created in Phase 1
- `backend/requirements.txt`
- `backend/.env.example`
- `backend/app/main.py`
- `backend/app/core/config.py`
- `backend/app/core/database.py`

Setup and run (Windows)
1. Open a terminal and navigate to the backend folder:

```bash
cd "c:\Users\tparh\Desktop\AI Research Assistant\backend"
```

2. Create and activate a virtual environment (PowerShell example):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

(Or cmd):

```cmd
python -m venv .venv
.\.venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and edit if needed. You can leave `GEMINI_API_KEY` as a placeholder for now:

```bash
copy .env.example .env
```

5. Run the FastAPI app with uvicorn:

```bash
uvicorn app.main:app --reload --port 8000
```

Verification
- Visit `http://localhost:8000/health` in your browser or run:

```bash
curl http://localhost:8000/health
```

Expected response: `{ "status": "ok" }`

Notes
- Router modules are not implemented in Phase 1; `app/main.py` includes safe placeholders so the app starts without them.
- Next phase will add upload handling, embedding services, and RAG pipeline.

.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
uvicorn app.main:app --reload
npm run dev