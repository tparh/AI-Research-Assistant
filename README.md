AI Research Assistant

An AI-powered research assistant that allows users to upload PDF documents, search their content using semantic similarity, and ask questions using a Retrieval-Augmented Generation (RAG) pipeline.

Features
PDF document upload
Text extraction from PDFs
Semantic embeddings using Sentence Transformers
ChromaDB vector storage
Retrieval-Augmented Generation (RAG)
Google Gemini integration
Local fallback responses when Gemini is unavailable
Document management
Chat history
Document summarization
FastAPI backend
React + Vite frontend
Project Structure
AI Research Assistant/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   ├── .env.example
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── ...
├── .gitignore
└── README.md

Backend Setup

Open a terminal in the project root and move into the backend directory:

cd backend


Create a Python virtual environment:

python -m venv .venv


Activate the virtual environment:

.\.venv\Scripts\Activate.ps1


Install the backend dependencies:

pip install -r requirements.txt

Environment Variables

Create your local .env file from the provided example:

Copy-Item .env.example .env


Open .env and add your Gemini API key if you want to use Gemini-powered responses.

.env is intentionally ignored by Git and must never be committed to the repository.

Start the Backend

Make sure you are inside the backend directory, then run:

python -m uvicorn app.main:app --reload --port 8000


The backend will be available at:

http://localhost:8000


Interactive API documentation:

http://localhost:8000/docs


Health check:

http://localhost:8000/health

Frontend Setup

Open a second terminal and move into the frontend directory:

cd frontend


Install the frontend dependencies:

npm install


Start the frontend development server:

npm run dev


Vite will display the local frontend URL in the terminal.

Dependencies
Backend

The backend uses:

FastAPI
Uvicorn
Python Dotenv
LangChain
LangChain Community
LangChain Google GenAI
LangChain Text Splitters
ChromaDB
Sentence Transformers
PyPDF
SQLAlchemy
Python Multipart
Pydantic
Pydantic Settings

Install all backend dependencies with:

pip install -r requirements.txt

Frontend

The frontend uses:

React
Vite
TypeScript
Tailwind CSS
Other dependencies defined in package.json

Install frontend dependencies with:

npm install

Data and Generated Files

The following files and directories are intentionally excluded from Git:

Python virtual environments (.venv)
node_modules
.env
SQLite databases
ChromaDB data
Uploaded files
Build output
IDE configuration
Log files

These files are generated locally and are not required to be stored in the repository.

API Endpoints

The backend currently provides the following endpoints:

GET /health
POST /upload/pdf
POST /chat/
GET /documents/
GET /documents/{doc_id}
GET /history/{session_id}
GET /summarize/{doc_id}

For the complete API schema and interactive API testing, open:

http://localhost:8000/docs

Running the Project from Scratch

After cloning the repository:

git clone https://github.com/tparh/AI-Research-Assistant.git
cd AI-Research-Assistant

Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env


Add your Gemini API key to .env if required, then start the backend:

python -m uvicorn app.main:app --reload --port 8000

Frontend

Open a second terminal:

cd AI-Research-Assistant\frontend
npm install
npm run dev


The project is now ready to run locally.

Future Scope

The project can be further improved with the following features:

Multi-document conversations — Ask questions across multiple uploaded documents.
Improved RAG — Add hybrid search, re-ranking, and better document chunking for more accurate retrieval.
Source citations — Show document names, page numbers, and relevant sections used to generate answers.
More file formats — Support DOCX, PPTX, TXT, CSV, and Markdown files.
Advanced summarization — Generate summaries focused on key findings, methodology, results, and conclusions.
OCR support — Process scanned and image-based PDF documents.
User authentication — Provide separate accounts and private document collections.
Cloud deployment — Deploy the application for remote access and scalable usage.
Streaming responses — Display AI-generated responses in real time.
Research insights — Automatically identify research questions, methodology, results, limitations, and key contributions.
Export functionality — Export summaries and conversations as PDF, DOCX, or Markdown.
RAG evaluation — Add evaluation metrics to measure retrieval quality and answer accuracy.
Notes

The Python virtual environment and frontend node_modules directory are intentionally not included in the repository because they can be recreated using the dependency files.

The local database, vector database, uploaded documents, and environment variables are also kept outside Git to keep the repository lightweight and avoid committing local or sensitive data.
