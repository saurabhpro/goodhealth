"""JWT Authentication middleware for Supabase tokens."""

import logging

import httpx
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.config import get_settings

logger = logging.getLogger(__name__)


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to extract and verify Supabase JWT tokens.

    Uses Supabase's auth.getUser() API to verify tokens.
    Attaches user_id to request.state if token is valid.
    Does not block requests - authentication is enforced at route level.
    """

    # Paths that don't require authentication
    PUBLIC_PATHS = {"/", "/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Process the request and extract user info from JWT."""
        # Skip auth for public paths
        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)

        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        user_id = None

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove "Bearer " prefix
            user_id = await self._verify_token_with_supabase(token)

        # Attach user_id to request state (may be None if not authenticated)
        request.state.user_id = user_id

        return await call_next(request)

    async def _verify_token_with_supabase(self, token: str) -> str | None:
        """Verify JWT token using Supabase's auth.getUser() API.

        This is more reliable than manual JWT verification as it:
        - Handles key rotation automatically
        - Validates token hasn't been revoked
        - Works with both HS256 and ES256 tokens

        Args:
            token: The JWT access token string

        Returns:
            User ID if token is valid, None otherwise
        """
        settings = get_settings()

        if not settings.supabase_url:
            print("[AUTH] ERROR: SUPABASE_URL not configured")
            return None

        try:
            # Call Supabase auth.getUser() endpoint
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.supabase_url}/auth/v1/user",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "apikey": settings.supabase_service_key,
                    },
                    timeout=10.0,
                )

            if response.status_code == 200:
                user_data = response.json()
                user_id = user_data.get("id")
                if user_id:
                    print(f"[AUTH] Authenticated user: {user_id}")
                    return user_id
                print("[AUTH] User data missing 'id'")
                return None
            elif response.status_code == 401:
                print("[AUTH] Token is invalid or expired")
                return None
            else:
                print(f"[AUTH] Supabase auth error: {response.status_code}")
                return None

        except httpx.TimeoutException:
            print("[AUTH] Supabase auth request timed out")
            return None
        except Exception as e:
            print(f"[AUTH] Unexpected error verifying token: {e}")
            return None
