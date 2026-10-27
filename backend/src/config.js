import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  APP_NAME: 'StudyMate AI',
  APP_VERSION: '1.0.0',
  PORT: process.env.PORT || 8001,
  HOST: process.env.HOST || '0.0.0.0',
  API_PREFIX: '/api',

  // Gemma 4 Configuration
  // Supported providers: 'huggingface', 'groq', 'openrouter', 'ollama', 'demo_offline'
  GEMMA_PROVIDER: process.env.GEMMA_PROVIDER || 'auto',
  GEMMA_API_KEY: process.env.GEMMA_API_KEY || '',
  GEMMA_API_URL: process.env.GEMMA_API_URL || 'https://api-inference.huggingface.co/models/google/gemma-4-it',
  GEMMA_MODEL_ID: process.env.GEMMA_MODEL_ID || 'google/gemma-4-it',

  // Storage & Guardrails
  MAX_UPLOAD_SIZE_MB: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '15', 10),
  CONFIDENCE_THRESHOLD: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.20'),
  DATA_DIR: path.join(__dirname, '..', 'data'),
  SAMPLE_NOTES_DIR: path.join(__dirname, '..', 'sample_notes'),
};
