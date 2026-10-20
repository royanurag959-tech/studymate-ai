import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.session_store import session_store
from app.services.document_processor import document_processor

client = TestClient(app)

def setup_module():
    """Ensure sample notes on Photosynthesis are loaded in default-session."""
    notes_text = (
        "## Chloroplast Structure\n"
        "The chloroplast contains stroma and thylakoid membranes.\n\n"
        "## Light-Dependent Reactions\n"
        "The light-dependent reactions occur specifically within the thylakoid membrane and convert radiant solar energy "
        "into chemical energy in the form of ATP and NADPH. The Oxygen-Evolving Complex catalyzes the photolysis of water molecules: "
        "2 H2O -> 4 H+ + 4 e- + O2. Molecular oxygen is released as a byproduct.\n\n"
        "## RuBisCO and Calvin Cycle\n"
        "RuBisCO is the enzyme responsible for fixing atmospheric CO2 to RuBP in the stroma."
    )
    chunks = document_processor.chunk_document("doc-test-photo", "photo_notes.txt", [(1, notes_text)])
    from app.models.schemas import DocumentMetadata
    from datetime import datetime
    meta = DocumentMetadata(
        id="doc-test-photo",
        filename="photo_notes.txt",
        file_type="txt",
        session_id="test-qa-session",
        topic="Photosynthesis",
        word_count=len(notes_text.split()),
        char_count=len(notes_text),
        page_count=1,
        status="processed",
        created_at=datetime.now().isoformat()
    )
    session_store.create_session("Test QA Session", "Photosynthesis")
    session_store.sessions["test-qa-session"] = session_store.get_session("test-qa-session") or session_store.create_session("Test QA", "Photosynthesis")
    session_store.sessions["test-qa-session"].id = "test-qa-session"
    session_store.add_document(meta, chunks)

def test_grounded_answer_with_supporting_evidence():
    """Test 2: Ask a question that the notes explicitly answer; display a grounded answer with correct evidence."""
    response = client.post(
        "/api/ask",
        json={
            "session_id": "test-qa-session",
            "topic": "Photosynthesis",
            "question": "What reaction does the Oxygen-Evolving Complex catalyze?",
            "language": "english",
            "depth": "detailed",
            "level": "intermediate"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["has_sufficient_evidence"] is True
    assert len(data["supporting_evidence"]) > 0
    assert "photolysis" in data["answer"].lower() or "water" in data["answer"].lower()
    # Check that evidence has source filename and excerpt
    first_ev = data["supporting_evidence"][0]
    assert first_ev["source_filename"] == "photo_notes.txt"
    assert "Oxygen-Evolving" in first_ev["excerpt"] or "photolysis" in first_ev["excerpt"]
    assert data["source_coverage_percent"] > 0

def test_insufficient_evidence_response():
    """
    Test 3: Ask a question that the notes do not answer; clearly communicate the limitation instead of guessing.
    Strictly checks the required phrase:
    'I couldn't find sufficient evidence in your supplied notes to answer this question confidently.'
    """
    response = client.post(
        "/api/ask",
        json={
            "session_id": "test-qa-session",
            "topic": "Photosynthesis",
            "question": "What is Quantum Chromodynamics and the strong nuclear force coupling constant?",
            "language": "english",
            "depth": "detailed",
            "level": "intermediate"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["has_sufficient_evidence"] is False
    expected_phrase = "I couldn't find sufficient evidence in your supplied notes to answer this question confidently."
    assert expected_phrase in data["answer"]
    assert len(data["supporting_evidence"]) == 0
    assert data["source_coverage_percent"] == 0.0

def test_hinglish_and_levels():
    """Test AI Tutor customization options: Hindi/Hinglish mode and step-by-step."""
    response = client.post(
        "/api/ask",
        json={
            "session_id": "test-qa-session",
            "topic": "Photosynthesis",
            "question": "Where do light-dependent reactions occur?",
            "language": "hinglish",
            "depth": "step_by_step",
            "level": "beginner"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["has_sufficient_evidence"] is True
    assert data["language"] == "hinglish"
    assert "notes" in data["answer"].lower() or "thylakoid" in data["answer"].lower()
