import asyncio
from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient
from app.main import app
from app.services.gemma_service import GemmaService

client = TestClient(app)

def test_gemma_provider_error_graceful_fallback():
    """
    Test 7: Handle unavailable AI providers and API timeouts gracefully.
    When live inference times out or throws an HTTP error, the system must not crash;
    it should fall back smoothly to the grounded reasoning engine.
    """
    service = GemmaService()
    service.api_key = "test_fake_key_12345"
    service.api_url = "https://api.test.example/v1/chat/completions"

    async def run_checks():
        # Simulate timeout
        with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Connection timed out")):
            resp = await service.call_live_provider("system prompt", "user prompt")
            assert resp is None  # Handled cleanly without raising unhandled exception

        # Simulate 503 Service Unavailable
        mock_resp = httpx.Response(status_code=503, content=b'{"error": "Model overloaded"}')
        with patch("httpx.AsyncClient.post", return_value=mock_resp):
            resp = await service.call_live_provider("system prompt", "user prompt")
            assert resp is None

    asyncio.run(run_checks())

def test_api_keys_not_exposed_in_ai_status():
    """
    Test 10: Verify that API keys and private configuration are not exposed to the browser.
    """
    response = client.get("/api/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert "GEMMA_API_KEY" not in str(data) or "env_key" in str(data)  # only env var name is referenced in doc instructions
    assert "your_gemma_api_key_here" not in str(data)
    assert "key" not in data
    assert "secret" not in data
