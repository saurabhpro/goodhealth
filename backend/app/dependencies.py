"""FastAPI dependencies for dependency injection."""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from supabase import Client

from app.utils.supabase_client import get_supabase_client


def get_current_user_id(request: Request) -> str:
    """Get the current authenticated user's ID from request state.
    
    This dependency requires the JWTAuthMiddleware to be active.
    Raises 401 if user is not authenticated.
    
    Args:
        request: The FastAPI request object
        
    Returns:
        The authenticated user's ID
        
    Raises:
        HTTPException: 401 if not authenticated
    """
    user_id = getattr(request.state, "user_id", None)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_id


def get_db() -> Client:
    """Get Supabase client instance.
    
    Returns:
        Supabase client for database operations
    """
    return get_supabase_client()


# Type aliases for cleaner dependency injection
CurrentUser = Annotated[str, Depends(get_current_user_id)]
Database = Annotated[Client, Depends(get_db)]
