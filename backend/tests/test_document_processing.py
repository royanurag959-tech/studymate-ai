import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.document_processor import document_processor

client = TestClient(app)

def test_extract_txt_and_chunking():
    """Test 1: Upload valid notes and extract their text successfully."""
    sample_text = (
        "# General Genetics\n\n"
        "## Mendelian Inheritance\n"
        "Gregor Mendel discovered the fundamental laws of inheritance through breeding garden pea plants. "
        "The Law of Segregation states that every individual organism possesses two alleles for each trait, "
        "which segregate during gamete formation so each gamete carries only one allele.\n\n"
        "## Independent Assortment\n"
        "The Law of Independent Assortment asserts that genes for different traits sort independently of one another during gamete formation."
    )
    full_text, pages = document_processor.extract_from_txt(sample_text.encode('utf-8'), "genetics.txt")
    assert "Mendelian Inheritance" in full_text
    assert len(pages) == 1

    chunks = document_processor.chunk_document("doc-test-1", "genetics.txt", pages)
    assert len(chunks) >= 1
    assert any("Mendelian" in (c.section_title or "") or "Mendel" in c.content for c in chunks)

def test_upload_valid_document_api():
    """Test 1 (API): Upload valid txt file through POST /api/documents."""
    content = b"Photosynthesis produces glucose and oxygen from carbon dioxide and water using light energy."
    response = client.post(
        "/api/documents",
        files={"file": ("test_bio.txt", content, "text/plain")},
        data={"session_id": "default-session", "topic": "Biology"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["document"]["filename"] == "test_bio.txt"
    assert data["document"]["status"] == "processed"
    assert data["chunks_count"] >= 1

def test_empty_notes_rejected():
    """Test 6: Handle empty notes."""
    response = client.post(
        "/api/documents",
        files={"file": ("empty.txt", b"", "text/plain")},
        data={"session_id": "default-session", "topic": "Empty"}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_invalid_file_extension_rejected():
    """Test 6: Handle unsupported file types."""
    response = client.post(
        "/api/documents",
        files={"file": ("malicious.exe", b"binarycontent", "application/octet-stream")},
        data={"session_id": "default-session", "topic": "Testing"}
    )
    assert response.status_code == 400
    assert "unsupported" in response.json()["detail"].lower()

def test_paste_notes_empty_validation():
    """Test 6: Reject blank pasted notes."""
    response = client.post(
        "/api/notes",
        json={"title": "Empty Paste", "content": "   ", "topic": "Test", "session_id": "default-session"}
    )
    assert response.status_code == 400
