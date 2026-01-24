"""Supabase client initialization."""

from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    """Get cached Supabase client instance.
    
    Uses the service key for backend operations (bypasses RLS).
    """
    settings = get_settings()
    
    if not settings.supabase_url or not settings.supabase_service_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment"
        )
    
    return create_client(
        settings.supabase_url,
        settings.supabase_service_key,
    )
