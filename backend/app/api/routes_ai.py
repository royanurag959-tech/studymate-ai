from fastapi import APIRouter
from ..services.gemma_service import gemma_service
from ..config import settings

router = APIRouter(prefix="/ai", tags=["AI Configuration"])

@router.get("/status")
async def get_ai_status():
    is_live = gemma_service.is_live_configured()
    return {
        "status": "online",
        "model_family": "Gemma 4",
        "model_id": settings.GEMMA_MODEL_ID,
        "provider": settings.GEMMA_PROVIDER,
        "mode": "live_inference" if is_live else "grounded_demo_mode",
        "is_live_connected": is_live,
        "anti_hallucination_guardrails": "active",
        "supported_providers": [
            {
                "id": "huggingface",
                "name": "Hugging Face Inference API / Dedicated Endpoints",
                "env_key": "GEMMA_API_KEY",
                "sample_model": "google/gemma-4-it"
            },
            {
                "id": "groq",
                "name": "Groq Cloud (Fast LPUs)",
                "env_key": "GEMMA_API_KEY",
                "sample_model": "gemma-4-it"
            },
            {
                "id": "openrouter",
                "name": "OpenRouter API",
                "env_key": "GEMMA_API_KEY",
                "sample_model": "google/gemma-4-it"
            },
            {
                "id": "ollama",
                "name": "Local Ollama Instance",
                "env_key": "GEMMA_API_URL (e.g. http://localhost:11434/v1)",
                "sample_model": "gemma4"
            }
        ],
        "configuration_instructions": (
            "To connect live Gemma 4 inference: set GEMMA_API_KEY in your backend .env file. "
            "StudyMate AI automatically detects the key and switches from Grounded Demo Mode to live Gemma 4 inference."
        )
    }
