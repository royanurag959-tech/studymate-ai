from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class EvidenceItem(BaseModel):
    id: str
    source_filename: str
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    excerpt: str
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    is_direct_quote: bool = True

class DocumentChunk(BaseModel):
    id: str
    doc_id: str
    source_filename: str
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    content: str
    start_char: int
    end_char: int

class DocumentMetadata(BaseModel):
    id: str
    filename: str
    file_type: str
    session_id: str
    topic: str
    word_count: int
    char_count: int
    page_count: int
    status: str  # 'processed', 'warning_scanned', 'failed'
    status_message: Optional[str] = None
    created_at: str

class DocumentUploadResponse(BaseModel):
    document: DocumentMetadata
    extracted_preview: str
    chunks_count: int

class PasteNotesRequest(BaseModel):
    title: str = "Pasted Notes"
    content: str
    topic: str
    session_id: str

class AskRequest(BaseModel):
    session_id: str
    topic: str
    question: str
    language: str = "english"  # 'english' | 'hinglish'
    depth: str = "detailed"     # 'short' | 'detailed' | 'step_by_step'
    level: str = "intermediate" # 'beginner' | 'intermediate' | 'advanced'

class AskResponse(BaseModel):
    answer: str
    supporting_evidence: List[EvidenceItem]
    has_sufficient_evidence: bool
    direct_evidence_summary: str
    reasonable_explanation: str
    information_not_found: Optional[str] = None
    source_coverage_percent: float
    language: str
    depth: str
    level: str
    is_demo_mode: bool
    model_used: str

class QuizQuestion(BaseModel):
    id: str
    question_type: str  # 'multiple_choice', 'true_false', 'short_answer'
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    hint: str
    explanation: str
    source_excerpt: str
    source_filename: str
    page_number: Optional[int] = None
    concept: str

class QuizGenerateRequest(BaseModel):
    session_id: str
    topic: str
    num_questions: int = 4
    types: Optional[List[str]] = ["multiple_choice", "true_false", "short_answer"]

class QuizGenerateResponse(BaseModel):
    session_id: str
    topic: str
    questions: List[QuizQuestion]
    is_demo_mode: bool
    message: Optional[str] = None

class QuizEvaluateRequest(BaseModel):
    session_id: str
    question_id: str
    question: str
    question_type: str
    student_answer: str
    correct_answer: str
    concept: str
    source_excerpt: str

class QuizEvaluateResponse(BaseModel):
    is_correct: bool
    score: float
    feedback: str
    concept_understood: str
    correction_explanation: str
    targeted_hint: str
    revision_recommendation: str
    next_practice_prompt: str
    supporting_evidence: Optional[str] = None

class StudySession(BaseModel):
    id: str
    name: str
    topic: str
    created_at: str
    updated_at: str
    document_count: int = 0
    questions_asked: int = 0
    quizzes_taken: int = 0

class SessionCreateRequest(BaseModel):
    name: str
    topic: str

class SessionUpdateRequest(BaseModel):
    name: Optional[str] = None
    topic: Optional[str] = None

class ProgressStats(BaseModel):
    current_topic: str
    total_documents: int
    total_questions_asked: int
    total_quizzes_taken: int
    average_quiz_score: float
    concepts_mastered: List[str]
    concepts_to_revise: List[str]
    recent_sessions: List[StudySession]
    recent_activity: List[Dict[str, Any]]
    topic_breakdown: List[Dict[str, Any]]
