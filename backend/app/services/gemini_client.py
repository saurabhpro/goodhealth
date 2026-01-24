"""Google Gemini AI client wrapper."""

import json
import logging
from typing import Any, Optional

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.config import get_settings

logger = logging.getLogger(__name__)


class GeminiClient:
    """Wrapper for Google Gemini AI API."""

    def __init__(self) -> None:
        """Initialize the Gemini client."""
        settings = get_settings()
        
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY must be set in environment")
        
        genai.configure(api_key=settings.gemini_api_key)
        self.model_name = settings.gemini_model
        self.model = genai.GenerativeModel(self.model_name)

    async def generate_content(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 16000,
        top_k: int = 40,
        top_p: float = 0.95,
    ) -> str:
        """Generate content using Gemini.
        
        Args:
            prompt: The prompt to send to the model
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum output tokens
            top_k: Top-k sampling parameter
            top_p: Top-p (nucleus) sampling parameter
            
        Returns:
            Generated text response
            
        Raises:
            Exception: If generation fails
        """
        try:
            generation_config = GenerationConfig(
                temperature=temperature,
                top_k=top_k,
                top_p=top_p,
                max_output_tokens=max_tokens,
            )

            response = await self.model.generate_content_async(
                prompt,
                generation_config=generation_config,
            )

            return response.text

        except Exception as e:
            logger.error(f"Gemini generation error: {e}")
            raise

    async def generate_json(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 16000,
    ) -> dict[str, Any]:
        """Generate JSON content using Gemini.
        
        Args:
            prompt: The prompt (should request JSON output)
            temperature: Sampling temperature
            max_tokens: Maximum output tokens
            
        Returns:
            Parsed JSON response as a dictionary
            
        Raises:
            ValueError: If response is not valid JSON
        """
        text = await self.generate_content(
            prompt=prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        # Extract JSON from potential markdown code blocks
        json_text = self._extract_json(text)

        try:
            return json.loads(json_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response text (first 500 chars): {text[:500]}")
            raise ValueError(f"Invalid JSON response from Gemini: {e}")

    @staticmethod
    def _extract_json(text: str) -> str:
        """Extract JSON from text, handling markdown code blocks.
        
        Args:
            text: Raw text that may contain JSON in code blocks
            
        Returns:
            Cleaned JSON string
        """
        text = text.strip()

        # Remove markdown code blocks if present
        if "```" in text:
            start = text.find("```")
            end = text.rfind("```")
            if end > start:
                inner = text[start + 3:end]
                # Remove optional language tag (e.g., "json")
                if inner.startswith("json"):
                    inner = inner[4:]
                text = inner.strip()

        # Remove any remaining backticks
        while text.startswith("`"):
            text = text[1:]
        while text.endswith("`"):
            text = text[:-1]

        # Remove "json" prefix if present
        if text.lower().startswith("json"):
            text = text[4:].strip()

        return text.strip()


# Singleton instance
_gemini_client: Optional[GeminiClient] = None


def get_gemini_client() -> GeminiClient:
    """Get or create the Gemini client singleton."""
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = GeminiClient()
    return _gemini_client
