import os
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from typing import Optional, List
from ..models.schemas import DocumentMetadata, DocumentUploadResponse, PasteNotesRequest
from ..services.document_processor import document_processor
from ..services.session_store import session_store
from ..config import settings

router = APIRouter(prefix="", tags=["Documents"])

@router.post("/documents", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    session_id: str = Form("default-session"),
    topic: str = Form("Plant Physiology & Cellular Respiration")
):
    # Validate file extension
    filename = file.filename or "uploaded_note.txt"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".txt", ".md"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. StudyMate AI supports .pdf, .txt, and .md files."
        )

    # Read bytes and validate size
    content_bytes = await file.read()
    if len(content_bytes) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty. Please provide notes with content.")

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    doc_id = f"doc-{uuid.uuid4().hex[:8]}"
    is_scanned = False
    pages_data = []

    try:
        if ext == ".pdf":
            full_text, pages_data, is_scanned = document_processor.extract_from_pdf(content_bytes, filename)
        else:
            full_text, pages_data = document_processor.extract_from_txt(content_bytes, filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to process document: {str(e)}")

    word_count = len(full_text.split())
    char_count = len(full_text)
    page_count = len(pages_data)

    status = "processed"
    status_msg = "Successfully extracted and chunked."

    if is_scanned or word_count < 10:
        status = "warning_scanned"
        status_msg = (
            "OCR Notice: Extracted text is very short or appears to be a scanned image. "
            "For best results with Gemma 4, ensure your PDF contains selectable digital text."
        )

    # Chunk the document
    chunks = document_processor.chunk_document(doc_id=doc_id, filename=filename, pages=pages_data)

    metadata = DocumentMetadata(
        id=doc_id,
        filename=filename,
        file_type=ext.replace(".", ""),
        session_id=session_id,
        topic=topic,
        word_count=word_count,
        char_count=char_count,
        page_count=page_count,
        status=status,
        status_message=status_msg,
        created_at=datetime.now().isoformat()
    )

    session_store.add_document(metadata, chunks)

    preview_text = full_text[:400] + ("..." if len(full_text) > 400 else "")

    return DocumentUploadResponse(
        document=metadata,
        extracted_preview=preview_text,
        chunks_count=len(chunks)
    )

@router.post("/notes", response_model=DocumentUploadResponse)
async def paste_notes(req: PasteNotesRequest):
    content = req.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Pasted notes cannot be empty.")

    doc_id = f"doc-{uuid.uuid4().hex[:8]}"
    filename = f"{req.title}.txt" if req.title else "Pasted_Notes.txt"
    sanitized_text = document_processor.sanitize_untrusted_study_text(content)
    pages_data = [(1, sanitized_text)]

    chunks = document_processor.chunk_document(doc_id=doc_id, filename=filename, pages=pages_data)

    metadata = DocumentMetadata(
        id=doc_id,
        filename=filename,
        file_type="txt",
        session_id=req.session_id,
        topic=req.topic,
        word_count=len(sanitized_text.split()),
        char_count=len(sanitized_text),
        page_count=1,
        status="processed",
        status_message="Directly saved from notes editor.",
        created_at=datetime.now().isoformat()
    )

    session_store.add_document(metadata, chunks)

    preview_text = sanitized_text[:400] + ("..." if len(sanitized_text) > 400 else "")

    return DocumentUploadResponse(
        document=metadata,
        extracted_preview=preview_text,
        chunks_count=len(chunks)
    )

@router.get("/documents", response_model=List[DocumentMetadata])
async def list_documents(session_id: str = Query("default-session")):
    return session_store.get_documents_for_session(session_id)

@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, session_id: str = Query("default-session")):
    deleted = session_store.delete_document(session_id, doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"message": "Document deleted successfully."}

@router.post("/documents/load-sample")
async def load_sample_notes(sample_type: str = Form("photosynthesis"), session_id: str = Form("default-session")):
    """Helper endpoint to load bundled academic notes for instant live demonstration."""
    sample_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sample_notes")
    
    if sample_type == "networks":
        filename = "computer_networks_notes.txt"
        topic = "Computer Networks & Internet Protocols"
    else:
        filename = "photosynthesis_notes.txt"
        topic = "Plant Physiology & Cellular Respiration"

    file_path = os.path.join(sample_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample notes file not found.")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    doc_id = f"doc-{uuid.uuid4().hex[:8]}"
    pages_data = [(1, content)]
    chunks = document_processor.chunk_document(doc_id=doc_id, filename=filename, pages=pages_data)

    metadata = DocumentMetadata(
        id=doc_id,
        filename=filename,
        file_type="txt",
        session_id=session_id,
        topic=topic,
        word_count=len(content.split()),
        char_count=len(content),
        page_count=1,
        status="processed",
        status_message=f"Preloaded verified sample notes on {topic}.",
        created_at=datetime.now().isoformat()
    )

    session_store.add_document(metadata, chunks)
    session_store.update_session(session_id, topic=topic)

    return {
        "message": f"Successfully loaded sample notes for {topic}.",
        "document": metadata,
        "chunks_count": len(chunks)
    }
