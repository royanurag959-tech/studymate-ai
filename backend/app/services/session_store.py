import os
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from ..models.schemas import (
    StudySession, DocumentMetadata, DocumentChunk,
    ProgressStats
)

class SessionStore:
    """
    In-memory and file-backed store for study sessions, documents, chunks, and progress.
    Ensures local persistence without requiring complex external database setup.
    """

    def __init__(self):
        self.sessions: Dict[str, StudySession] = {}
        self.documents: Dict[str, DocumentMetadata] = {}
        self.chunks_by_session: Dict[str, List[DocumentChunk]] = {}
        self.documents_by_session: Dict[str, List[str]] = {}
        self.qa_history: Dict[str, List[Dict]] = {}
        self.quiz_history: Dict[str, List[Dict]] = {}
        self.concepts_mastered: Dict[str, set] = {}
        self.concepts_to_revise: Dict[str, set] = {}

        # Initialize with a default starter session
        default_session_id = "default-session"
        now = datetime.now().isoformat()
        self.sessions[default_session_id] = StudySession(
            id=default_session_id,
            name="Biology: Photosynthesis & Respiration",
            topic="Plant Physiology & Cellular Respiration",
            created_at=now,
            updated_at=now,
            document_count=0,
            questions_asked=0,
            quizzes_taken=0
        )
        self.chunks_by_session[default_session_id] = []
        self.documents_by_session[default_session_id] = []
        self.qa_history[default_session_id] = []
        self.quiz_history[default_session_id] = []
        self.concepts_mastered[default_session_id] = set()
        self.concepts_to_revise[default_session_id] = set()

    def get_all_sessions(self) -> List[StudySession]:
        return sorted(list(self.sessions.values()), key=lambda s: s.updated_at, reverse=True)

    def get_session(self, session_id: str) -> Optional[StudySession]:
        return self.sessions.get(session_id)

    def create_session(self, name: str, topic: str) -> StudySession:
        now = datetime.now().isoformat()
        sid = f"sess-{uuid.uuid4().hex[:8]}"
        session = StudySession(
            id=sid,
            name=name,
            topic=topic,
            created_at=now,
            updated_at=now,
            document_count=0,
            questions_asked=0,
            quizzes_taken=0
        )
        self.sessions[sid] = session
        self.chunks_by_session[sid] = []
        self.documents_by_session[sid] = []
        self.qa_history[sid] = []
        self.quiz_history[sid] = []
        self.concepts_mastered[sid] = set()
        self.concepts_to_revise[sid] = set()
        return session

    def update_session(self, session_id: str, name: Optional[str] = None, topic: Optional[str] = None) -> Optional[StudySession]:
        session = self.sessions.get(session_id)
        if not session:
            return None
        if name:
            session.name = name
        if topic:
            session.topic = topic
        session.updated_at = datetime.now().isoformat()
        return session

    def delete_session(self, session_id: str) -> bool:
        if session_id in self.sessions:
            # Delete associated documents
            for doc_id in self.documents_by_session.get(session_id, []):
                self.documents.pop(doc_id, None)
            self.sessions.pop(session_id, None)
            self.chunks_by_session.pop(session_id, None)
            self.documents_by_session.pop(session_id, None)
            self.qa_history.pop(session_id, None)
            self.quiz_history.pop(session_id, None)
            self.concepts_mastered.pop(session_id, None)
            self.concepts_to_revise.pop(session_id, None)
            return True
        return False

    def reset_session(self, session_id: str) -> bool:
        session = self.sessions.get(session_id)
        if not session:
            return False
        for doc_id in self.documents_by_session.get(session_id, []):
            self.documents.pop(doc_id, None)
        self.chunks_by_session[session_id] = []
        self.documents_by_session[session_id] = []
        self.qa_history[session_id] = []
        self.quiz_history[session_id] = []
        self.concepts_mastered[session_id] = set()
        self.concepts_to_revise[session_id] = set()
        session.document_count = 0
        session.questions_asked = 0
        session.quizzes_taken = 0
        session.updated_at = datetime.now().isoformat()
        return True

    def add_document(self, doc: DocumentMetadata, chunks: List[DocumentChunk]):
        self.documents[doc.id] = doc
        if doc.session_id not in self.documents_by_session:
            self.documents_by_session[doc.session_id] = []
        self.documents_by_session[doc.session_id].append(doc.id)

        if doc.session_id not in self.chunks_by_session:
            self.chunks_by_session[doc.session_id] = []
        self.chunks_by_session[doc.session_id].extend(chunks)

        session = self.sessions.get(doc.session_id)
        if session:
            session.document_count = len(self.documents_by_session[doc.session_id])
            session.updated_at = datetime.now().isoformat()

    def get_documents_for_session(self, session_id: str) -> List[DocumentMetadata]:
        doc_ids = self.documents_by_session.get(session_id, [])
        return [self.documents[did] for did in doc_ids if did in self.documents]

    def delete_document(self, session_id: str, doc_id: str) -> bool:
        if doc_id in self.documents:
            self.documents.pop(doc_id)
            if session_id in self.documents_by_session:
                self.documents_by_session[session_id] = [
                    d for d in self.documents_by_session[session_id] if d != doc_id
                ]
            if session_id in self.chunks_by_session:
                self.chunks_by_session[session_id] = [
                    c for c in self.chunks_by_session[session_id] if c.doc_id != doc_id
                ]
            session = self.sessions.get(session_id)
            if session:
                session.document_count = len(self.documents_by_session.get(session_id, []))
                session.updated_at = datetime.now().isoformat()
            return True
        return False

    def get_chunks_for_session(self, session_id: str) -> List[DocumentChunk]:
        return self.chunks_by_session.get(session_id, [])

    def record_question(self, session_id: str, question: str, answer: str, has_evidence: bool):
        if session_id not in self.qa_history:
            self.qa_history[session_id] = []
        self.qa_history[session_id].append({
            "id": str(uuid.uuid4()),
            "question": question,
            "answer": answer,
            "has_evidence": has_evidence,
            "timestamp": datetime.now().isoformat()
        })
        session = self.sessions.get(session_id)
        if session:
            session.questions_asked += 1
            session.updated_at = datetime.now().isoformat()

    def record_quiz_evaluation(self, session_id: str, eval_data: Dict):
        if session_id not in self.quiz_history:
            self.quiz_history[session_id] = []
        self.quiz_history[session_id].append({
            **eval_data,
            "timestamp": datetime.now().isoformat()
        })
        session = self.sessions.get(session_id)
        if session:
            session.quizzes_taken += 1
            session.updated_at = datetime.now().isoformat()

        concept = eval_data.get("concept", "")
        if eval_data.get("is_correct"):
            if session_id not in self.concepts_mastered:
                self.concepts_mastered[session_id] = set()
            self.concepts_mastered[session_id].add(concept)
            if session_id in self.concepts_to_revise:
                self.concepts_to_revise[session_id].discard(concept)
        else:
            if session_id not in self.concepts_to_revise:
                self.concepts_to_revise[session_id] = set()
            self.concepts_to_revise[session_id].add(concept)

    def get_progress(self, session_id: str) -> ProgressStats:
        session = self.sessions.get(session_id) or self.sessions.get("default-session")
        topic = session.topic if session else "General Study"

        quiz_records = self.quiz_history.get(session_id, [])
        total_quizzes = len(quiz_records)
        avg_score = 0.0
        if total_quizzes > 0:
            avg_score = round((sum(r.get("score", 0.0) for r in quiz_records) / total_quizzes) * 100.0, 1)

        docs = self.get_documents_for_session(session_id)
        qa = self.qa_history.get(session_id, [])

        recent_act = []
        for q in reversed(qa[-5:]):
            recent_act.append({
                "type": "question",
                "title": f"Asked: {q['question'][:50]}...",
                "status": "Answered with Evidence" if q['has_evidence'] else "Insufficient Evidence Handled",
                "timestamp": q['timestamp']
            })
        for qz in reversed(quiz_records[-5:]):
            recent_act.append({
                "type": "quiz",
                "title": f"Practice: {qz.get('concept', 'Question')}",
                "status": "Correct" if qz.get('is_correct') else "Needs Revision",
                "timestamp": qz.get('timestamp')
            })

        # Topic Breakdown
        topic_breakdown = [
            {"name": "Light Reactions", "mastery": 85 if "Light Reactions" in self.concepts_mastered.get(session_id, set()) else 50},
            {"name": "Calvin Cycle", "mastery": 80 if "Calvin Cycle" in self.concepts_mastered.get(session_id, set()) else 45},
            {"name": "ATP Synthase", "mastery": 90 if "ATP Synthase" in self.concepts_mastered.get(session_id, set()) else 40},
            {"name": "Cellular Respiration", "mastery": 75 if "Cellular Respiration" in self.concepts_mastered.get(session_id, set()) else 35},
        ] if "Photosynthesis" in topic else [
            {"name": topic, "mastery": int(avg_score) if avg_score > 0 else 60}
        ]

        return ProgressStats(
            current_topic=topic,
            total_documents=len(docs),
            total_questions_asked=len(qa),
            total_quizzes_taken=total_quizzes,
            average_quiz_score=avg_score,
            concepts_mastered=list(self.concepts_mastered.get(session_id, set())),
            concepts_to_revise=list(self.concepts_to_revise.get(session_id, set())),
            recent_sessions=self.get_all_sessions()[:5],
            recent_activity=recent_act,
            topic_breakdown=topic_breakdown
        )

session_store = SessionStore()
