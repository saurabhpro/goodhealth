"""Application configuration using pydantic-settings."""

from functools import lru_cache
import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # API Settings
    app_name: str = "GoodHealth Backend"
    debug: bool = False
    api_prefix: str = "/api"

    # CORS Settings (JSON array or comma-separated in .env)
    cors_origins: list[str] = []

    # Gemini AI
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.0-flash"

    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""  # Service key for backend operations

    @field_validator("cors_origins", mode="before")
    @classmethod
    def normalize_cors_origins(cls, value: object) -> list[str]:
        if value is None:
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []
            if raw.startswith("["):
                parsed = json.loads(raw)
                if not isinstance(parsed, list):
                    raise ValueError("CORS_ORIGINS JSON must decode to a list")
                return parsed
            return [item.strip() for item in raw.split(",") if item.strip()]
        raise ValueError("CORS_ORIGINS must be a list, JSON array, or comma-separated string")

    def assert_required_for_runtime(self) -> None:
        missing = [
            name
            for name, value in (
                ("SUPABASE_URL", self.supabase_url),
                ("SUPABASE_SERVICE_KEY", self.supabase_service_key),
                ("GEMINI_API_KEY", self.gemini_api_key),
            )
            if not value
        ]
        if missing:
            raise RuntimeError(
                f"Missing required environment variables: {', '.join(missing)}"
            )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
