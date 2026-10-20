export interface EvidenceItem {
  id: string;
  source_filename: string;
  page_number?: number | null;
  section_title?: string | null;
  excerpt: string;
  relevance_score: number;
  is_direct_quote: boolean;
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  file_type: string;
  session_id: string;
  topic: string;
  word_count: number;
  char_count: number;
  page_count: number;
  status: 'processed' | 'warning_scanned' | 'failed';
  status_message?: string | null;
  created_at: string;
}

export interface DocumentUploadResponse {
  document: DocumentMetadata;
  extracted_preview: string;
  chunks_count: number;
}

export interface AskRequest {
  session_id: string;
  topic: string;
  question: string;
  language: 'english' | 'hinglish';
  depth: 'short' | 'detailed' | 'step_by_step';
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface AskResponse {
  answer: string;
  supporting_evidence: EvidenceItem[];
  has_sufficient_evidence: boolean;
  direct_evidence_summary: string;
  reasonable_explanation: string;
  information_not_found?: string | null;
  source_coverage_percent: number;
  language: string;
  depth: string;
  level: string;
  is_demo_mode: boolean;
  model_used: string;
}

export interface QuizQuestion {
  id: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[] | null;
  correct_answer: string;
  hint: string;
  explanation: string;
  source_excerpt: string;
  source_filename: string;
  page_number?: number | null;
  concept: string;
}

export interface QuizGenerateResponse {
  session_id: string;
  topic: string;
  questions: QuizQuestion[];
  is_demo_mode: boolean;
  message?: string | null;
}

export interface QuizEvaluateRequest {
  session_id: string;
  question_id: string;
  question: string;
  question_type: string;
  student_answer: string;
  correct_answer: string;
  concept: string;
  source_excerpt: string;
}

export interface QuizEvaluateResponse {
  is_correct: boolean;
  score: number;
  feedback: string;
  concept_understood: string;
  correction_explanation: string;
  targeted_hint: string;
  revision_recommendation: string;
  next_practice_prompt: string;
  supporting_evidence?: string | null;
}

export interface StudySession {
  id: string;
  name: string;
  topic: string;
  created_at: string;
  updated_at: string;
  document_count: number;
  questions_asked: number;
  quizzes_taken: number;
}

export interface ProgressStats {
  current_topic: string;
  total_documents: number;
  total_questions_asked: number;
  total_quizzes_taken: number;
  average_quiz_score: number;
  concepts_mastered: string[];
  concepts_to_revise: string[];
  recent_sessions: StudySession[];
  recent_activity: {
    type: 'question' | 'quiz';
    title: string;
    status: string;
    timestamp: string;
  }[];
  topic_breakdown: {
    name: string;
    mastery: number;
  }[];
}

export interface AIStatus {
  status: string;
  model_family: string;
  model_id: string;
  provider: string;
  mode: string;
  is_live_connected: boolean;
  anti_hallucination_guardrails: string;
  supported_providers: {
    id: string;
    name: string;
    env_key: string;
    sample_model: string;
  }[];
  configuration_instructions: string;
}
