import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "StudyMate AI"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Gemma 4 Configuration
    # Supported providers: 'huggingface', 'groq', 'openrouter', 'ollama', 'google_ai_studio', 'demo_offline'
    GEMMA_PROVIDER: str = os.getenv("GEMMA_PROVIDER", "auto")
    GEMMA_API_KEY: str = os.getenv("GEMMA_API_KEY", "")
    GEMMA_API_URL: str = os.getenv("GEMMA_API_URL", "https://api-inference.huggingface.co/models/google/gemma-4-it")
    GEMMA_MODEL_ID: str = os.getenv("GEMMA_MODEL_ID", "google/gemma-4-it")
    
    # Storage and file limits
    MAX_UPLOAD_SIZE_MB: int = 15
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    
    # Security & Guardrails
    CONFIDENCE_THRESHOLD: float = 0.28  # threshold below which insufficient evidence is reported

settings = Settings()

# Ensure data directory exists
os.makedirs(settings.DATA_DIR, exist_ok=True)
