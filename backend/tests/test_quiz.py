import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.session_store import session_store
from app.services.document_processor import document_processor

client = TestClient(app)

def setup_module():
    notes_text = (
        "## RuBisCO\n"
        "RuBisCO is the enzyme that catalyzes carbon fixation during the Calvin cycle in the stroma. "
        "The reaction fixes carbon dioxide into 3-phosphoglycerate.\n\n"
        "## Light Reactions\n"
        "Photolysis of water occurs in the thylakoid lumen, producing protons, electrons, and oxygen gas. "
        "ATP Synthase utilizes the proton motive force to synthesize ATP from ADP and inorganic phosphate."
    )
    chunks = document_processor.chunk_document("doc-test-quiz", "quiz_notes.txt", [(1, notes_text)])
    from app.models.schemas import DocumentMetadata
    from datetime import datetime
    meta = DocumentMetadata(
        id="doc-test-quiz",
        filename="quiz_notes.txt",
        file_type="txt",
        session_id="test-quiz-session",
        topic="Plant Biology",
        word_count=len(notes_text.split()),
        char_count=len(notes_text),
        page_count=1,
        status="processed",
        created_at=datetime.now().isoformat()
    )
    session_store.create_session("Quiz Session", "Plant Biology")
    session_store.sessions["test-quiz-session"] = session_store.get_session("test-quiz-session") or session_store.create_session("Quiz Session", "Plant Biology")
    session_store.sessions["test-quiz-session"].id = "test-quiz-session"
    session_store.add_document(meta, chunks)

def test_generate_quiz_from_notes():
    """Test 4: Generate a quiz using only supported material."""
    response = client.post(
        "/api/quiz/generate",
        json={
            "session_id": "test-quiz-session",
            "topic": "Plant Biology",
            "num_questions": 3,
            "types": ["multiple_choice", "true_false", "short_answer"]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["questions"]) >= 1
    for q in data["questions"]:
        assert q["question"]
        assert q["correct_answer"]
        assert q["hint"]
        assert q["explanation"]
        assert q["source_excerpt"]
        assert q["source_filename"] == "quiz_notes.txt"

def test_submit_wrong_answer_explanation_and_hint():
    """Test 5: Submit a wrong answer; provide a correct explanation and useful hint."""
    response = client.post(
        "/api/quiz/evaluate",
        json={
            "session_id": "test-quiz-session",
            "question_id": "q-test-1",
            "question": "What does RuBisCO do?",
            "question_type": "multiple_choice",
            "student_answer": "It splits water molecules in the cytoplasm",
            "correct_answer": "RuBisCO is the enzyme that catalyzes carbon fixation during the Calvin cycle in the stroma.",
            "concept": "RuBisCO",
            "source_excerpt": "RuBisCO is the enzyme that catalyzes carbon fixation during the Calvin cycle in the stroma."
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_correct"] is False
    assert data["score"] == 0.0
    assert "RuBisCO" in data["concept_understood"]
    assert "The correct understanding" in data["correction_explanation"] or "notes" in data["correction_explanation"].lower()
    assert len(data["targeted_hint"]) > 0
    assert len(data["revision_recommendation"]) > 0

def test_submit_correct_answer():
    """Test evaluating a correct response."""
    response = client.post(
        "/api/quiz/evaluate",
        json={
            "session_id": "test-quiz-session",
            "question_id": "q-test-2",
            "question": "Where does photolysis occur?",
            "question_type": "multiple_choice",
            "student_answer": "Photolysis of water occurs in the thylakoid lumen, producing protons, electrons, and oxygen gas.",
            "correct_answer": "Photolysis of water occurs in the thylakoid lumen, producing protons, electrons, and oxygen gas.",
            "concept": "Light Reactions",
            "source_excerpt": "Photolysis of water occurs in the thylakoid lumen, producing protons, electrons, and oxygen gas."
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_correct"] is True
    assert data["score"] == 1.0
    assert "Great work" in data["feedback"]
