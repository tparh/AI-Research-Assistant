# AI Research Assistant

An AI-powered research assistant that allows users to upload PDF documents, search their content using semantic similarity, and ask questions using a Retrieval-Augmented Generation (RAG) pipeline.

## Features

* 📄 PDF document upload and text extraction
* 🔎 Semantic search using Sentence Transformers
* 🗄️ ChromaDB vector storage
* 🤖 Retrieval-Augmented Generation (RAG)
* ✨ Google Gemini integration
* 🛡️ Local fallback responses when Gemini is unavailable
* 📚 Document management
* 💬 Chat history
* 📝 Document summarization
* ⚡ FastAPI backend
* ⚛️ React + Vite frontend

## Project Structure

```text
AI-Research-Assistant/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   └── services/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

## How to Run

### 1. Clone the Repository

```powershell
git clone https://github.com/tparh/AI-Research-Assistant.git
cd AI-Research-Assistant
```

### 2. Run the Backend

Open a terminal in the project root:

```powershell
cd backend
```

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the dependencies:

```powershell
pip install -r requirements.txt
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Add your Gemini API key to `.env`.

Start the backend:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

The backend will run at:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

Health check:

```text
http://localhost:8000/health
```

### 3. Run the Frontend

Open a **second terminal** in the project root:

```powershell
cd frontend
```

Install frontend dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Vite will display the frontend URL in the terminal.

## Backend API

The backend currently provides:

| Method | Endpoint                | Description                   |
| ------ | ----------------------- | ----------------------------- |
| GET    | `/health`               | Check backend status          |
| POST   | `/upload/pdf`           | Upload a PDF document         |
| POST   | `/chat/`                | Ask questions about documents |
| GET    | `/documents/`           | List uploaded documents       |
| GET    | `/documents/{doc_id}`   | Get document details          |
| GET    | `/history/{session_id}` | Retrieve chat history         |
| GET    | `/summarize/{doc_id}`   | Generate a document summary   |

Interactive API testing is available through FastAPI's Swagger UI at:

```text
http://localhost:8000/docs
```

## Technologies Used

### Backend

* Python
* FastAPI
* Uvicorn
* LangChain
* Google Gemini
* Sentence Transformers
* ChromaDB
* PyPDF
* SQLAlchemy
* Pydantic

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Axios
* React Router
* Lucide React

## Future Scope

* 🌐 Multi-document conversations
* 🔎 Hybrid search and result re-ranking
* 📑 Improved source citations
* 📂 Support for DOCX, PPTX, TXT, CSV, and Markdown
* 🧠 Improved research-focused summarization
* 🖼️ OCR support for scanned PDFs
* 👤 User authentication and private document collections
* ☁️ Cloud deployment
* ⚡ Streaming AI responses
* 🔬 Automatic extraction of research questions, methodology, results, limitations, and contributions
* 📤 Export conversations and summaries to PDF, DOCX, or Markdown
* 📊 RAG evaluation and retrieval-quality metrics

## Notes

The following are intentionally excluded from Git because they are generated locally or contain sensitive/local data:

* `.venv`
* `node_modules`
* `.env`
* SQLite database
* ChromaDB data
* Uploaded documents
* Build output
* IDE configuration
* Log files

These files can be recreated locally using the setup instructions above.
