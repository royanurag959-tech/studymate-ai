const getApiBase = () => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  // When running on Render static site in production
  if (typeof window !== 'undefined' && window.location.hostname.includes('render.com')) {
    return 'https://studymate-ai-backend-6sna.onrender.com/api';
  }
  return '/api';
};

const API_BASE = getApiBase();

async function fetchWithRetry(url, options = {}, retries = 2) {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    if (retries > 0) {
      console.warn(`Connecting to backend... Retrying (${retries} left). Server might be waking up.`);
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw new Error(
      'Could not connect to the backend server. The free-tier server may be waking up from inactivity. Please wait 15-30 seconds and try again.'
    );
  }
}

export const api = {
  // Document endpoints
  async uploadDocument(file, sessionId, topic) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);
    formData.append('topic', topic);

    const res = await fetchWithRetry(`${API_BASE}/documents`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Failed to upload document');
    }
    return res.json();
  },

  async pasteNotes(title, content, topic, sessionId) {
    const res = await fetchWithRetry(`${API_BASE}/notes`, {
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

  async getDocuments(sessionId) {
    const res = await fetchWithRetry(`${API_BASE}/documents?session_id=${encodeURIComponent(sessionId)}`);
    if (!res.ok) throw new Error('Failed to load documents');
    return res.json();
  },

  async deleteDocument(docId, sessionId) {
    const res = await fetchWithRetry(`${API_BASE}/documents/${docId}?session_id=${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  async loadSampleNotes(sampleType, sessionId) {
    const formData = new FormData();
    formData.append('sample_type', sampleType);
    formData.append('session_id', sessionId);

    const res = await fetchWithRetry(`${API_BASE}/documents/load-sample`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to load sample notes');
    return res.json();
  },

  // Q&A / Tutor endpoints
  async askQuestion(req) {
    const res = await fetchWithRetry(`${API_BASE}/ask`, {
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
  async generateQuiz(sessionId, topic, numQuestions = 4) {
    const res = await fetchWithRetry(`${API_BASE}/quiz/generate`, {
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

  async evaluateQuizAnswer(req) {
    const res = await fetchWithRetry(`${API_BASE}/quiz/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('Failed to evaluate answer');
    return res.json();
  },

  // Sessions endpoints
  async getSessions() {
    const res = await fetchWithRetry(`${API_BASE}/sessions`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  async createSession(name, topic) {
    const res = await fetchWithRetry(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, topic }),
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
  },

  async updateSession(sessionId, name, topic) {
    const res = await fetchWithRetry(`${API_BASE}/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, topic }),
    });
    if (!res.ok) throw new Error('Failed to update session');
    return res.json();
  },

  async deleteSession(sessionId) {
    const res = await fetchWithRetry(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete session');
  },

  async resetSession(sessionId) {
    const res = await fetchWithRetry(`${API_BASE}/sessions/${sessionId}/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset session');
  },

  // Progress endpoint
  async getProgress(sessionId) {
    const res = await fetchWithRetry(`${API_BASE}/progress?session_id=${encodeURIComponent(sessionId)}`);
    if (!res.ok) throw new Error('Failed to fetch learning progress');
    return res.json();
  },

  // AI Status endpoint
  async getAIStatus() {
    const res = await fetchWithRetry(`${API_BASE}/ai/status`);
    if (!res.ok) throw new Error('Failed to check AI status');
    return res.json();
  },
};
