"""Application configuration using pydantic-settings."""

from functools import lru_cache

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

    # CORS Settings (JSON array in .env)
    cors_origins: list[str] = [
        "http://localhost:3000",
        "https://goodhealth.vercel.app",
    ]

    # Gemini AI
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.0-flash"

    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""  # Service key for backend operations


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
