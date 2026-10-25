import { Router } from 'express';
import { quizService } from '../services/quizService.js';
import { sessionStore } from '../services/sessionStore.js';
import { gemmaService } from '../services/gemmaService.js';

export const quizRouter = Router();

quizRouter.post('/generate', (req, res) => {
  const { session_id, topic, num_questions, types } = req.body;
  const sessionId = session_id || 'default-session';
  const chunks = sessionStore.getChunksForSession(sessionId);

  if (!chunks || chunks.length === 0) {
    return res.json({
      session_id: sessionId,
      topic: topic || 'General Topic',
      questions: [],
      is_demo_mode: !gemmaService.isLiveConfigured(),
      message: 'No study notes available in this session. Please upload or paste notes to generate a quiz.',
    });
  }

  const totalWords = chunks.reduce((acc, c) => acc + c.content.split(/\s+/).filter(Boolean).length, 0);
  if (totalWords < 30) {
    return res.json({
      session_id: sessionId,
      topic: topic || 'General Topic',
      questions: [],
      is_demo_mode: !gemmaService.isLiveConfigured(),
      message: 'Your supplied notes are too brief to generate a reliable grounded quiz. Please add more study content.',
    });
  }

  const questions = quizService.generateQuizFromChunks(
    chunks,
    topic || 'General Topic',
    num_questions || 4,
    types || ['multiple_choice', 'true_false', 'short_answer']
  );

  return res.json({
    session_id: sessionId,
    topic: topic || 'General Topic',
    questions,
    is_demo_mode: !gemmaService.isLiveConfigured(),
    message: 'Generated practice quiz grounded strictly in your notes.',
  });
});

quizRouter.post('/evaluate', (req, res) => {
  const {
    session_id,
    question_id,
    question,
    question_type,
    student_answer,
    correct_answer,
    concept,
    source_excerpt,
  } = req.body;

  const evalResp = quizService.evaluateAnswer({
    questionId: question_id,
    question,
    questionType: question_type,
    studentAnswer: student_answer,
    correctAnswer: correct_answer,
    concept,
    sourceExcerpt: source_excerpt,
  });

  const sessionId = session_id || 'default-session';
  sessionStore.recordQuizEvaluation(sessionId, {
    question_id,
    concept,
    is_correct: evalResp.is_correct,
    score: evalResp.score,
    student_answer,
    correct_answer,
  });

  return res.json(evalResp);
});
