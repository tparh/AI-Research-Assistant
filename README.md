\# AI Research Assistant



An AI-powered research assistant that allows users to upload PDF documents, search their content using semantic similarity, and ask questions using a \*\*Retrieval-Augmented Generation (RAG)\*\* pipeline.



\## ✨ Features



\* 📄 PDF document upload

\* 📝 Text extraction from PDFs

\* 🧠 Semantic embeddings using Sentence Transformers

\* 💾 ChromaDB vector storage

\* 🔎 Semantic similarity search

\* 🤖 Retrieval-Augmented Generation (RAG)

\* ✨ Google Gemini integration

\* 🛟 Local fallback responses when Gemini is unavailable

\* 📚 Document management

\* 💬 Chat history

\* 📋 Document summarization

\* ⚡ FastAPI backend

\* ⚛️ React + Vite frontend



\## 🏗️ Project Structure



```text

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

```



\## ⚙️ Backend Setup



Open a terminal in the project root and move into the backend directory:



```powershell

cd backend

```



\### 1. Create a Virtual Environment



```powershell

python -m venv .venv

```



\### 2. Activate the Virtual Environment



\*\*Windows PowerShell:\*\*



```powershell

.\\.venv\\Scripts\\Activate.ps1

```



\### 3. Install Dependencies



```powershell

pip install -r requirements.txt

```



\### 4. Configure Environment Variables



Create your local `.env` file from the provided example:



```powershell

Copy-Item .env.example .env

```



Open `.env` and add your Gemini API key if you want to use Gemini-powered responses.



> \*\*Important:\*\* `.env` is intentionally ignored by Git and must never be committed to the repository.



\### 5. Start the Backend



Make sure you are inside the `backend` directory:



```powershell

python -m uvicorn app.main:app --reload --port 8000

```



The backend will be available at:



\*\*http://localhost:8000\*\*



Interactive API documentation:



\*\*http://localhost:8000/docs\*\*



Health check:



\*\*http://localhost:8000/health\*\*



\## 💻 Frontend Setup



Open a \*\*second terminal\*\*.



From the project root, move into the frontend directory:



```powershell

cd frontend

```



Install the frontend dependencies:



```powershell

npm install

```



Start the development server:



```powershell

npm run dev

```



Vite will display the local frontend URL in the terminal.



\## 🧰 Tech Stack



\### Backend



\* Python

\* FastAPI

\* Uvicorn

\* SQLAlchemy

\* SQLite



\### AI \& RAG



\* Google Gemini

\* LangChain

\* LangChain Google GenAI

\* LangChain Text Splitters

\* Sentence Transformers

\* ChromaDB

\* Retrieval-Augmented Generation (RAG)



\### Document Processing



\* PyPDF



\### Frontend



\* React

\* TypeScript

\* Vite

\* Tailwind CSS

\* Axios

\* React Router

\* Lucide React



\## 📦 Dependencies



\### Backend



The backend dependencies are defined in:



```text

backend/requirements.txt

```



Install them with:



```powershell

pip install -r requirements.txt

```



\### Frontend



The frontend dependencies are defined in:



```text

frontend/package.json

```



Install them with:



```powershell

npm install

```



\## 🔌 API Endpoints



| Method | Endpoint                | Description           |

| ------ | ----------------------- | --------------------- |

| GET    | `/health`               | Check backend health  |

| POST   | `/upload/pdf`           | Upload a PDF document |

| POST   | `/chat/`                | Ask a question        |

| GET    | `/documents/`           | List documents        |

| GET    | `/documents/{doc\_id}`   | Get document details  |

| GET    | `/history/{session\_id}` | Get chat history      |

| GET    | `/summarize/{doc\_id}`   | Summarize a document  |



For interactive API testing and the complete OpenAPI schema:



\*\*http://localhost:8000/docs\*\*



\## 🔄 How the RAG Pipeline Works



```text

PDF Upload

&#x20;   ↓

Text Extraction

&#x20;   ↓

Text Chunking

&#x20;   ↓

Generate Embeddings

&#x20;   ↓

Store Vectors in ChromaDB

&#x20;   ↓

User Asks a Question

&#x20;   ↓

Generate Query Embedding

&#x20;   ↓

Similarity Search

&#x20;   ↓

Retrieve Relevant Chunks

&#x20;   ↓

Build RAG Prompt

&#x20;   ↓

Gemini Generates Answer

&#x20;   ↓

Return Answer + Sources

```



The application retrieves the most relevant document chunks before sending the context to Gemini. This allows the model to generate answers grounded in the uploaded documents rather than relying only on its general knowledge.



\## 💾 Data and Generated Files



The following files and directories are intentionally excluded from Git:



\* `.venv`

\* `node\_modules`

\* `.env`

\* SQLite databases

\* ChromaDB data

\* Uploaded files

\* Build output

\* IDE configuration

\* Log files



These files are generated locally and can be recreated when setting up the project.



\## 🚀 Running the Project from Scratch



Clone the repository:



```powershell

git clone https://github.com/tparh/AI-Research-Assistant.git

cd AI-Research-Assistant

```



\### Backend



```powershell

cd backend

python -m venv .venv

.\\.venv\\Scripts\\Activate.ps1

pip install -r requirements.txt

Copy-Item .env.example .env

```



Add your Gemini API key to `.env`, then start the backend:



```powershell

python -m uvicorn app.main:app --reload --port 8000

```



\### Frontend



Open a second terminal:



```powershell

cd AI-Research-Assistant\\frontend

npm install

npm run dev

```



The project is now ready to run locally.



\## 🔮 Future Scope



Potential future improvements include:



\* \*\*Multi-document conversations\*\* — Ask questions across multiple uploaded documents.

\* \*\*Improved RAG\*\* — Add hybrid search, re-ranking, and improved document chunking.

\* \*\*Source citations\*\* — Display document names, page numbers, and relevant sections used to generate answers.

\* \*\*More file formats\*\* — Support DOCX, PPTX, TXT, CSV, and Markdown files.

\* \*\*Advanced summarization\*\* — Generate summaries focused on findings, methodology, results, and conclusions.

\* \*\*OCR support\*\* — Process scanned and image-based PDF documents.

\* \*\*User authentication\*\* — Provide separate accounts and private document collections.

\* \*\*Cloud deployment\*\* — Deploy the application for remote access and scalability.

\* \*\*Streaming responses\*\* — Display AI-generated responses in real time.

\* \*\*Research insights\*\* — Automatically identify research questions, methodology, results, limitations, and key contributions.

\* \*\*Export functionality\*\* — Export summaries and conversations as PDF, DOCX, or Markdown.

\* \*\*RAG evaluation\*\* — Add evaluation metrics to measure retrieval quality and answer accuracy.



\## 📝 Notes



The Python virtual environment and frontend `node\_modules` directory are intentionally not included in the repository because they can be recreated using the dependency files.



The local database, vector database, uploaded documents, and environment variables are also kept outside Git to keep the repository lightweight and avoid committing local or sensitive data.



