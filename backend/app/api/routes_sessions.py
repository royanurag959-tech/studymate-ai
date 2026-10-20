from fastapi import APIRouter, HTTPException
from typing import List
from ..models.schemas import StudySession, SessionCreateRequest, SessionUpdateRequest
from ..services.session_store import session_store

router = APIRouter(prefix="/sessions", tags=["Study Sessions"])

@router.get("", response_model=List[StudySession])
async def list_sessions():
    return session_store.get_all_sessions()

@router.post("", response_model=StudySession)
async def create_session(req: SessionCreateRequest):
    name = req.name.strip()
    topic = req.topic.strip()
    if not name or not topic:
        raise HTTPException(status_code=400, detail="Session name and topic are required.")
    return session_store.create_session(name=name, topic=topic)

@router.put("/{session_id}", response_model=StudySession)
async def update_session(session_id: str, req: SessionUpdateRequest):
    updated = session_store.update_session(session_id, name=req.name, topic=req.topic)
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found.")
    return updated

@router.delete("/{session_id}")
async def delete_session(session_id: str):
    success = session_store.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"message": "Session deleted successfully."}

@router.post("/{session_id}/reset")
async def reset_session(session_id: str):
    success = session_store.reset_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"message": "Session cleared and reset successfully."}
