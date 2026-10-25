import { Router } from 'express';
import { sessionStore } from '../services/sessionStore.js';

export const sessionsRouter = Router();

sessionsRouter.get('/', (req, res) => {
  return res.json(sessionStore.getAllSessions());
});

sessionsRouter.post('/', (req, res) => {
  const { name, topic } = req.body;
  const cleanName = (name || '').trim();
  const cleanTopic = (topic || '').trim();

  if (!cleanName || !cleanTopic) {
    return res.status(400).json({ detail: 'Session name and topic are required.' });
  }

  const session = sessionStore.createSession(cleanName, cleanTopic);
  return res.json(session);
});

sessionsRouter.put('/:id', (req, res) => {
  const { name, topic } = req.body;
  const updated = sessionStore.updateSession(req.params.id, name, topic);
  if (!updated) {
    return res.status(404).json({ detail: 'Session not found.' });
  }
  return res.json(updated);
});

sessionsRouter.delete('/:id', (req, res) => {
  const success = sessionStore.deleteSession(req.params.id);
  if (!success) {
    return res.status(404).json({ detail: 'Session not found.' });
  }
  return res.json({ message: 'Session deleted successfully.' });
});

sessionsRouter.post('/:id/reset', (req, res) => {
  const success = sessionStore.resetSession(req.params.id);
  if (!success) {
    return res.status(404).json({ detail: 'Session not found.' });
  }
  return res.json({ message: 'Session cleared and reset successfully.' });
});
