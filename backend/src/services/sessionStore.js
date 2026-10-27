import { v4 as uuidv4 } from 'uuid';

export class SessionStore {
  constructor() {
    this.sessions = new Map();
    this.documents = new Map();
    this.chunksBySession = new Map();
    this.documentsBySession = new Map();
    this.qaHistory = new Map();
    this.quizHistory = new Map();
    this.conceptsMastered = new Map();
    this.conceptsToRevise = new Map();

    const defaultSessionId = 'default-session';
    const now = new Date().toISOString();

    this.sessions.set(defaultSessionId, {
      id: defaultSessionId,
      name: 'My Study Notes',
      topic: 'General Study Material',
      created_at: now,
      updated_at: now,
      document_count: 0,
      questions_asked: 0,
      quizzes_taken: 0,
    });

    this.chunksBySession.set(defaultSessionId, []);
    this.documentsBySession.set(defaultSessionId, []);
    this.qaHistory.set(defaultSessionId, []);
    this.quizHistory.set(defaultSessionId, []);
    this.conceptsMastered.set(defaultSessionId, new Set());
    this.conceptsToRevise.set(defaultSessionId, new Set());
  }

  getAllSessions() {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  createSession(name, topic) {
    const now = new Date().toISOString();
    const sid = `sess-${uuidv4().slice(0, 8)}`;
    const session = {
      id: sid,
      name,
      topic,
      created_at: now,
      updated_at: now,
      document_count: 0,
      questions_asked: 0,
      quizzes_taken: 0,
    };

    this.sessions.set(sid, session);
    this.chunksBySession.set(sid, []);
    this.documentsBySession.set(sid, []);
    this.qaHistory.set(sid, []);
    this.quizHistory.set(sid, []);
    this.conceptsMastered.set(sid, new Set());
    this.conceptsToRevise.set(sid, new Set());

    return session;
  }

  updateSession(sessionId, name, topic) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (name) session.name = name;
    if (topic) session.topic = topic;
    session.updated_at = new Date().toISOString();
    return session;
  }

  deleteSession(sessionId) {
    if (!this.sessions.has(sessionId)) return false;

    const docIds = this.documentsBySession.get(sessionId) || [];
    for (const did of docIds) {
      this.documents.delete(did);
    }

    this.sessions.delete(sessionId);
    this.chunksBySession.delete(sessionId);
    this.documentsBySession.delete(sessionId);
    this.qaHistory.delete(sessionId);
    this.quizHistory.delete(sessionId);
    this.conceptsMastered.delete(sessionId);
    this.conceptsToRevise.delete(sessionId);

    return true;
  }

  resetSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const docIds = this.documentsBySession.get(sessionId) || [];
    for (const did of docIds) {
      this.documents.delete(did);
    }

    this.chunksBySession.set(sessionId, []);
    this.documentsBySession.set(sessionId, []);
    this.qaHistory.set(sessionId, []);
    this.quizHistory.set(sessionId, []);
    this.conceptsMastered.set(sessionId, new Set());
    this.conceptsToRevise.set(sessionId, new Set());

    session.document_count = 0;
    session.questions_asked = 0;
    session.quizzes_taken = 0;
    session.updated_at = new Date().toISOString();

    return true;
  }

  addDocument(doc, chunks) {
    this.documents.set(doc.id, doc);

    if (!this.documentsBySession.has(doc.session_id)) {
      this.documentsBySession.set(doc.session_id, []);
    }
    this.documentsBySession.get(doc.session_id).push(doc.id);

    if (!this.chunksBySession.has(doc.session_id)) {
      this.chunksBySession.set(doc.session_id, []);
    }
    this.chunksBySession.get(doc.session_id).push(...chunks);

    const session = this.sessions.get(doc.session_id);
    if (session) {
      session.document_count = this.documentsBySession.get(doc.session_id).length;
      session.updated_at = new Date().toISOString();
    }
  }

  getDocumentsForSession(sessionId) {
    const docIds = this.documentsBySession.get(sessionId) || [];
    return docIds.map((did) => this.documents.get(did)).filter(Boolean);
  }

  deleteDocument(sessionId, docId) {
    if (!this.documents.has(docId)) return false;

    this.documents.delete(docId);

    const docIds = this.documentsBySession.get(sessionId) || [];
    this.documentsBySession.set(
      sessionId,
      docIds.filter((d) => d !== docId)
    );

    const chunks = this.chunksBySession.get(sessionId) || [];
    this.chunksBySession.set(
      sessionId,
      chunks.filter((c) => c.doc_id !== docId)
    );

    const session = this.sessions.get(sessionId);
    if (session) {
      session.document_count = (this.documentsBySession.get(sessionId) || []).length;
      session.updated_at = new Date().toISOString();
    }

    return true;
  }

  getChunksForSession(sessionId) {
    return this.chunksBySession.get(sessionId) || [];
  }

  recordQuestion(sessionId, question, answer, hasEvidence) {
    if (!this.qaHistory.has(sessionId)) {
      this.qaHistory.set(sessionId, []);
    }
    this.qaHistory.get(sessionId).push({
      id: uuidv4(),
      question,
      answer,
      has_evidence: hasEvidence,
      timestamp: new Date().toISOString(),
    });

    const session = this.sessions.get(sessionId);
    if (session) {
      session.questions_asked += 1;
      session.updated_at = new Date().toISOString();
    }
  }

  recordQuizEvaluation(sessionId, evalData) {
    if (!this.quizHistory.has(sessionId)) {
      this.quizHistory.set(sessionId, []);
    }
    this.quizHistory.get(sessionId).push({
      ...evalData,
      timestamp: new Date().toISOString(),
    });

    const session = this.sessions.get(sessionId);
    if (session) {
      session.quizzes_taken += 1;
      session.updated_at = new Date().toISOString();
    }

    const concept = evalData.concept || '';
    if (evalData.is_correct) {
      if (!this.conceptsMastered.has(sessionId)) {
        this.conceptsMastered.set(sessionId, new Set());
      }
      this.conceptsMastered.get(sessionId).add(concept);

      if (this.conceptsToRevise.has(sessionId)) {
        this.conceptsToRevise.get(sessionId).delete(concept);
      }
    } else {
      if (!this.conceptsToRevise.has(sessionId)) {
        this.conceptsToRevise.set(sessionId, new Set());
      }
      this.conceptsToRevise.get(sessionId).add(concept);
    }
  }

  getProgress(sessionId) {
    const session = this.sessions.get(sessionId) || this.sessions.get('default-session');
    const topic = session ? session.topic : 'General Study';

    const quizRecords = this.quizHistory.get(sessionId) || [];
    const totalQuizzes = quizRecords.length;
    let avgScore = 0.0;
    if (totalQuizzes > 0) {
      const sum = quizRecords.reduce((acc, r) => acc + (r.score || 0.0), 0.0);
      avgScore = parseFloat(((sum / totalQuizzes) * 100.0).toFixed(1));
    }

    const docs = this.getDocumentsForSession(sessionId);
    const qa = this.qaHistory.get(sessionId) || [];

    const recentActivity = [];
    for (const q of qa.slice(-5).reverse()) {
      recentActivity.push({
        type: 'question',
        title: `Asked: ${q.question.slice(0, 50)}...`,
        status: q.has_evidence ? 'Answered with Evidence' : 'Insufficient Evidence Handled',
        timestamp: q.timestamp,
      });
    }

    for (const qz of quizRecords.slice(-5).reverse()) {
      recentActivity.push({
        type: 'quiz',
        title: `Practice: ${qz.concept || 'Question'}`,
        status: qz.is_correct ? 'Correct' : 'Needs Revision',
        timestamp: qz.timestamp,
      });
    }

    const masteredSet = this.conceptsMastered.get(sessionId) || new Set();

    const topicBreakdown = topic.includes('Photosynthesis')
      ? [
          { name: 'Light Reactions', mastery: masteredSet.has('Light Reactions') ? 85 : 50 },
          { name: 'Calvin Cycle', mastery: masteredSet.has('Calvin Cycle') ? 80 : 45 },
          { name: 'ATP Synthase', mastery: masteredSet.has('ATP Synthase') ? 90 : 40 },
          { name: 'Cellular Respiration', mastery: masteredSet.has('Cellular Respiration') ? 75 : 35 },
        ]
      : [{ name: topic, mastery: avgScore > 0 ? Math.round(avgScore) : 60 }];

    return {
      current_topic: topic,
      total_documents: docs.length,
      total_questions_asked: qa.length,
      total_quizzes_taken: totalQuizzes,
      average_quiz_score: avgScore,
      concepts_mastered: Array.from(masteredSet),
      concepts_to_revise: Array.from(this.conceptsToRevise.get(sessionId) || new Set()),
      recent_sessions: this.getAllSessions().slice(0, 5),
      recent_activity: recentActivity,
      topic_breakdown: topicBreakdown,
    };
  }
}

export const sessionStore = new SessionStore();
