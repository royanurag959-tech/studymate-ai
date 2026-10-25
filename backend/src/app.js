import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { documentsRouter } from './routes/documents.js';
import { qaRouter } from './routes/qa.js';
import { quizRouter } from './routes/quiz.js';
import { sessionsRouter } from './routes/sessions.js';
import { progressRouter } from './routes/progress.js';
import { aiRouter } from './routes/ai.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check & Root Info
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: config.APP_NAME,
    version: config.APP_VERSION,
    runtime: 'node-express',
    message: 'StudyMate AI Backend API is running successfully.',
    health_endpoint: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: config.APP_NAME,
    version: config.APP_VERSION,
    runtime: 'node-express',
    model_target: config.GEMMA_MODEL_ID,
  });
});

// Mount modular API routes under /api
app.use(config.API_PREFIX, documentsRouter);
app.use(config.API_PREFIX, qaRouter);
app.use(`${config.API_PREFIX}/quiz`, quizRouter);
app.use(`${config.API_PREFIX}/sessions`, sessionsRouter);
app.use(`${config.API_PREFIX}/progress`, progressRouter);
app.use(`${config.API_PREFIX}/ai`, aiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    detail: err.message || 'Internal server error',
  });
});
