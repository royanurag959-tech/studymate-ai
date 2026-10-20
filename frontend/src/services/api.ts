import {
  DocumentMetadata,
  DocumentUploadResponse,
  AskRequest,
  AskResponse,
  QuizQuestion,
  QuizGenerateResponse,
  QuizEvaluateRequest,
  QuizEvaluateResponse,
  StudySession,
  ProgressStats,
  AIStatus
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

export const api = {
  // Document endpoints
  async uploadDocument(file: File, sessionId: string, topic: string): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);
    formData.append('topic', topic);

    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Failed to upload document');
    }
    return res.json();
  },

  async pasteNotes(title: string, content: string, topic: string, sessionId: string): Promise<DocumentUploadResponse> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, topic, session_id: sessionId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to save notes' }));
      throw new Error(err.detail || 'Failed to save notes');
    }
    return res.json();
  },

  async getDocuments(sessionId: string): Promise<DocumentMetadata[]> {
    const res = await fetch(`${API_BASE}/documents?session_id=${encodeURIComponent(sessionId)}`);
    if (!res.ok) throw new Error('Failed to load documents');
    return res.json();
  },

  async deleteDocument(docId: string, sessionId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${docId}?session_id=${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  async loadSampleNotes(sampleType: 'photosynthesis' | 'networks', sessionId: string): Promise<any> {
    const formData = new FormData();
    formData.append('sample_type', sampleType);
    formData.append('session_id', sessionId);

    const res = await fetch(`${API_BASE}/documents/load-sample`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to load sample notes');
    return res.json();
  },

  // Q&A / Tutor endpoints
  async askQuestion(req: AskRequest): Promise<AskResponse> {
    const res = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error generating answer' }));
      throw new Error(err.detail || 'Error generating answer');
    }
    return res.json();
  },

  // Quiz endpoints
  async generateQuiz(sessionId: string, topic: string, numQuestions: number = 4): Promise<QuizGenerateResponse> {
    const res = await fetch(`${API_BASE}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        topic,
        num_questions: numQuestions,
        types: ['multiple_choice', 'true_false', 'short_answer'],
      }),
    });
    if (!res.ok) throw new Error('Failed to generate practice quiz');
    return res.json();
  },

  async evaluateQuizAnswer(req: QuizEvaluateRequest): Promise<QuizEvaluateResponse> {
    const res = await fetch(`${API_BASE}/quiz/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Failed to evaluate answer');
    return res.json();
  },

  // Sessions endpoints
  async getSessions(): Promise<StudySession[]> {
    const res = await fetch(`${API_BASE}/sessions`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  async createSession(name: string, topic: string): Promise<StudySession> {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, topic }),
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
  },

  async updateSession(sessionId: string, name?: string, topic?: string): Promise<StudySession> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, topic }),
    });
    if (!res.ok) throw new Error('Failed to update session');
    return res.json();
  },

  async deleteSession(sessionId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete session');
  },

  async resetSession(sessionId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset session');
  },

  // Progress endpoint
  async getProgress(sessionId: string): Promise<ProgressStats> {
    const res = await fetch(`${API_BASE}/progress?session_id=${encodeURIComponent(sessionId)}`);
    if (!res.ok) throw new Error('Failed to fetch learning progress');
    return res.json();
  },

  // AI Status endpoint
  async getAIStatus(): Promise<AIStatus> {
    const res = await fetch(`${API_BASE}/ai/status`);
    if (!res.ok) throw new Error('Failed to check AI status');
    return res.json();
  },
};
