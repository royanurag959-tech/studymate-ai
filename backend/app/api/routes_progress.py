from fastapi import APIRouter, Query
from ..models.schemas import ProgressStats
from ..services.session_store import session_store

router = APIRouter(prefix="/progress", tags=["Learning Progress"])

@router.get("", response_model=ProgressStats)
async def get_progress(session_id: str = Query("default-session")):
    return session_store.get_progress(session_id)
