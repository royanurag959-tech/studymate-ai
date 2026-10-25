import { Router } from 'express';
import { gemmaService } from '../services/gemmaService.js';
import { config } from '../config.js';

export const aiRouter = Router();

aiRouter.get('/status', (req, res) => {
  const isLive = gemmaService.isLiveConfigured();
  return res.json({
    status: 'online',
    model_family: 'Gemma 4',
    model_id: config.GEMMA_MODEL_ID,
    provider: config.GEMMA_PROVIDER,
    mode: isLive ? 'live_inference' : 'grounded_demo_mode',
    is_live_connected: isLive,
    anti_hallucination_guardrails: 'active',
    supported_providers: [
      {
        id: 'huggingface',
        name: 'Hugging Face Inference API / Dedicated Endpoints',
        env_key: 'GEMMA_API_KEY',
        sample_model: 'google/gemma-4-it',
      },
      {
        id: 'groq',
        name: 'Groq Cloud (Fast LPUs)',
        env_key: 'GEMMA_API_KEY',
        sample_model: 'gemma-4-it',
      },
      {
        id: 'openrouter',
        name: 'OpenRouter API',
        env_key: 'GEMMA_API_KEY',
        sample_model: 'google/gemma-4-it',
      },
      {
        id: 'ollama',
        name: 'Local Ollama Instance',
        env_key: 'GEMMA_API_URL (e.g. http://localhost:11434/v1)',
        sample_model: 'gemma4',
      },
    ],
    configuration_instructions:
      'To connect live Gemma 4 inference: set GEMMA_API_KEY in your backend .env file. StudyMate AI automatically detects the key and switches from Grounded Demo Mode to live Gemma 4 inference.',
  });
});
