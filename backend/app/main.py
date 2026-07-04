from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.database import Base, engine
import app.models.history  # noqa: F401

app = FastAPI(title="AI Research Assistant - Backend", version="0.1.0")

# Configure CORS
origins = settings.allowed_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.on_event("startup")
def on_startup():
    """Create database tables on startup if they do not exist."""
    Base.metadata.create_all(bind=engine)


# Register routers
try:
    from app.routers.upload import router as upload_router  # noqa: F401
    from app.routers.chat import router as chat_router  # noqa: F401
    from app.routers.documents import router as documents_router  # noqa: F401
    from app.routers.history import router as history_router  # noqa: F401
    from app.routers.summarize import router as summarize_router  # noqa: F401

    app.include_router(upload_router, prefix="/upload")
    app.include_router(chat_router, prefix="/chat")
    app.include_router(documents_router, prefix="/documents")
    app.include_router(history_router, prefix="/history")
    app.include_router(summarize_router, prefix="/summarize")
except Exception as e:
    logging.getLogger("uvicorn.error").warning(
        "Router modules not found yet, skipping router registration: %s", e
    )
