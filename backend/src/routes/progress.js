import { Router } from 'express';
import { sessionStore } from '../services/sessionStore.js';

export const progressRouter = Router();

progressRouter.get('/', (req, res) => {
  const sessionId = req.query.session_id || 'default-session';
  return res.json(sessionStore.getProgress(sessionId));
});
