from fastapi import APIRouter, HTTPException
from ..models.schemas import AskRequest, AskResponse
from ..services.retrieval import retriever
from ..services.gemma_service import gemma_service
from ..services.session_store import session_store

router = APIRouter(prefix="", tags=["QA & AI Tutor"])

@router.post("/ask", response_model=AskResponse)
async def ask_question(req: AskRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Fetch chunks associated with this session
    chunks = session_store.get_chunks_for_session(req.session_id)
    if not chunks:
        return AskResponse(
            answer="I couldn't find sufficient evidence in your supplied notes to answer this question confidently.\n\n"
                   "You haven't uploaded or pasted any study notes in this session yet. "
                   "Please head over to the 'My Notes' tab to add your material first.",
            supporting_evidence=[],
            has_sufficient_evidence=False,
            direct_evidence_summary="No notes uploaded for current session.",
            reasonable_explanation="Cannot generate grounded responses without student notes.",
            information_not_found="Session has 0 uploaded documents.",
            source_coverage_percent=0.0,
            language=req.language,
            depth=req.depth,
            level=req.level,
            is_demo_mode=not gemma_service.is_live_configured(),
            model_used=gemma_service.model_id
        )

    # Passage retrieval
    evidence, coverage_percent, has_sufficient = retriever.retrieve_passages(
        query=question,
        chunks=chunks,
        top_k=4
    )

    # Gemma 4 reasoning (live or grounded emulator)
    response = await gemma_service.answer_question(
        question=question,
        topic=req.topic,
        evidence=evidence,
        coverage_percent=coverage_percent,
        has_sufficient=has_sufficient,
        language=req.language,
        depth=req.depth,
        level=req.level
    )

    # Persist in session history
    session_store.record_question(
        session_id=req.session_id,
        question=question,
        answer=response.answer,
        has_evidence=response.has_sufficient_evidence
    )

    return response
