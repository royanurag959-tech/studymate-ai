import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_session_lifecycle_and_persistence():
    """Test 8: Verify that sessions and progress persist according to the selected storage design."""
    # 1. Create a session
    resp = client.post("/api/sessions", json={"name": "Neuroscience 101", "topic": "Synaptic Transmission"})
    assert resp.status_code == 200
    sess = resp.json()
    sess_id = sess["id"]
    assert sess["name"] == "Neuroscience 101"
    assert sess["topic"] == "Synaptic Transmission"

    # 2. Verify it appears in list
    list_resp = client.get("/api/sessions")
    assert list_resp.status_code == 200
    all_sessions = list_resp.json()
    assert any(s["id"] == sess_id for s in all_sessions)

    # 3. Update session name
    update_resp = client.put(f"/api/sessions/{sess_id}", json={"name": "Advanced Neuroscience 202"})
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Advanced Neuroscience 202"

    # 4. Check progress endpoint
    prog_resp = client.get(f"/api/progress?session_id={sess_id}")
    assert prog_resp.status_code == 200
    prog = prog_resp.json()
    assert prog["current_topic"] == "Synaptic Transmission"
    assert prog["total_documents"] == 0

    # 5. Delete session
    del_resp = client.delete(f"/api/sessions/{sess_id}")
    assert del_resp.status_code == 200

    # 6. Verify deleted
    list_resp2 = client.get("/api/sessions")
    assert not any(s["id"] == sess_id for s in list_resp2.json())
