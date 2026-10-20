from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    QuizGenerateRequest, QuizGenerateResponse,
    QuizEvaluateRequest, QuizEvaluateResponse
)
from ..services.quiz_service import quiz_service
from ..services.session_store import session_store
from ..services.gemma_service import gemma_service

router = APIRouter(prefix="/quiz", tags=["Practice Quiz"])

@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(req: QuizGenerateRequest):
    chunks = session_store.get_chunks_for_session(req.session_id)
    if not chunks:
        return QuizGenerateResponse(
            session_id=req.session_id,
            topic=req.topic,
            questions=[],
            is_demo_mode=not gemma_service.is_live_configured(),
            message="No study notes available in this session. Please upload or paste notes to generate a quiz."
        )

    # Check total words
    total_words = sum(len(c.content.split()) for c in chunks)
    if total_words < 30:
        return QuizGenerateResponse(
            session_id=req.session_id,
            topic=req.topic,
            questions=[],
            is_demo_mode=not gemma_service.is_live_configured(),
            message="Your supplied notes are too brief to generate a reliable grounded quiz. Please add more study content."
        )

    questions = quiz_service.generate_quiz_from_chunks(
        chunks=chunks,
        topic=req.topic,
        num_questions=req.num_questions,
        allowed_types=req.types
    )

    return QuizGenerateResponse(
        session_id=req.session_id,
        topic=req.topic,
        questions=questions,
        is_demo_mode=not gemma_service.is_live_configured(),
        message="Generated practice quiz grounded strictly in your notes."
    )

@router.post("/evaluate", response_model=QuizEvaluateResponse)
async def evaluate_quiz_answer(req: QuizEvaluateRequest):
    eval_resp = quiz_service.evaluate_answer(req)
    
    # Record result for learning progress tracking
    session_store.record_quiz_evaluation(
        session_id=req.session_id,
        eval_data={
            "question_id": req.question_id,
            "concept": req.concept,
            "is_correct": eval_resp.is_correct,
            "score": eval_resp.score,
            "student_answer": req.student_answer,
            "correct_answer": req.correct_answer
        }
    )

    return eval_resp
