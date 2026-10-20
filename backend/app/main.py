import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.routes_documents import router as documents_router
from .api.routes_qa import router as qa_router
from .api.routes_quiz import router as quiz_router
from .api.routes_sessions import router as sessions_router
from .api.routes_progress import router as progress_router
from .api.routes_ai import router as ai_router
from .services.session_store import session_store
from .services.document_processor import document_processor

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Pre-populate default session with verified sample notes
    try:
        sample_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "sample_notes",
            "photosynthesis_notes.txt"
        )
        if os.path.exists(sample_path):
            with open(sample_path, "r", encoding="utf-8") as f:
                content = f.read()
            doc_id = "doc-default-photo"
            chunks = document_processor.chunk_document(
                doc_id=doc_id,
                filename="photosynthesis_notes.txt",
                pages=[(1, content)]
            )
            from .models.schemas import DocumentMetadata
            from datetime import datetime
            meta = DocumentMetadata(
                id=doc_id,
                filename="photosynthesis_notes.txt",
                file_type="txt",
                session_id="default-session",
                topic="Plant Physiology & Cellular Respiration",
                word_count=len(content.split()),
                char_count=len(content),
                page_count=1,
                status="processed",
                status_message="Preloaded verified study notes on Plant Physiology.",
                created_at=datetime.now().isoformat()
            )
            session_store.add_document(meta, chunks)
    except Exception as e:
        print(f"Warning: Could not pre-populate sample notes: {e}")

    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="StudyMate AI — Study Companion from Real Notes for Hacktoberfest Hackday 2026 (Gemma 4 Track)",
    lifespan=lifespan
)

# Enable CORS for local Vite development and production hosts
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(documents_router, prefix=settings.API_PREFIX)
app.include_router(qa_router, prefix=settings.API_PREFIX)
app.include_router(quiz_router, prefix=settings.API_PREFIX)
app.include_router(sessions_router, prefix=settings.API_PREFIX)
app.include_router(progress_router, prefix=settings.API_PREFIX)
app.include_router(ai_router, prefix=settings.API_PREFIX)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "model_target": settings.GEMMA_MODEL_ID
    }
