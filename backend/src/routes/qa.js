import { Router } from 'express';
import { retriever } from '../services/retrieval.js';
import { gemmaService } from '../services/gemmaService.js';
import { sessionStore } from '../services/sessionStore.js';

export const qaRouter = Router();

qaRouter.post('/ask', async (req, res) => {
  const { session_id, topic, question, language, depth, level } = req.body;
  const cleanQ = (question || '').trim();

  if (!cleanQ) {
    return res.status(400).json({ detail: 'Question cannot be empty.' });
  }

  const sessionId = session_id || 'default-session';
  const chunks = sessionStore.getChunksForSession(sessionId);

  if (!chunks || chunks.length === 0) {
    return res.json({
      answer:
        "I couldn't find sufficient evidence in your supplied notes to answer this question confidently.\n\n" +
        "You haven't uploaded or pasted any study notes in this session yet. " +
        "Please head over to the 'My Notes' tab to add your material first.",
      supporting_evidence: [],
      has_sufficient_evidence: false,
      direct_evidence_summary: 'No notes uploaded for current session.',
      reasonable_explanation: 'Cannot generate grounded responses without student notes.',
      information_not_found: 'Session has 0 uploaded documents.',
      source_coverage_percent: 0.0,
      language: language || 'english',
      depth: depth || 'detailed',
      level: level || 'intermediate',
      is_demo_mode: !gemmaService.isLiveConfigured(),
      model_used: gemmaService.modelId,
    });
  }

  const { evidence, coveragePercent, hasSufficient } = retriever.retrievePassages(cleanQ, chunks, 4);

  const response = await gemmaService.answerQuestion(
    cleanQ,
    topic || 'General Topic',
    evidence,
    coveragePercent,
    hasSufficient,
    language || 'english',
    depth || 'detailed',
    level || 'intermediate'
  );

  sessionStore.recordQuestion(sessionId, cleanQ, response.answer, response.has_sufficient_evidence);

  return res.json(response);
});
