"""JWT Authentication middleware for Supabase tokens."""

import logging
import sys

import httpx
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.config import get_settings

# Configure logging to stdout for visibility in Railway/Vercel logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("auth.middleware")


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
        path = request.url.path
        method = request.method

        logger.info(f"[REQUEST] {method} {path}")

        # Skip auth for public paths
        if path in self.PUBLIC_PATHS:
            logger.info(f"[AUTH] Skipping auth for public path: {path}")
            return await call_next(request)

        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        user_id = None

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove "Bearer " prefix
            token_preview = f"{token[:20]}...{token[-10:]}" if len(token) > 30 else token
            logger.info(f"[AUTH] Token received: {token_preview}")
            user_id = await self._verify_token_with_supabase(token)
        else:
            logger.warning(f"[AUTH] No Bearer token in request to {path}")
            if auth_header:
                logger.warning(f"[AUTH] Auth header present but not Bearer: {auth_header[:20]}...")

        # Attach user_id to request state (may be None if not authenticated)
        request.state.user_id = user_id

        if user_id:
            logger.info(f"[AUTH] Request authenticated for user: {user_id}")
        else:
            logger.warning(f"[AUTH] Request NOT authenticated for {method} {path}")

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
            logger.error("[AUTH] SUPABASE_URL not configured!")
            return None

        if not settings.supabase_service_key:
            logger.error("[AUTH] SUPABASE_SERVICE_KEY not configured!")
            return None

        logger.info(f"[AUTH] Verifying token with Supabase at {settings.supabase_url}")
        api_key_preview = f"{settings.supabase_service_key[:15]}..." if settings.supabase_service_key else "NOT SET"
        logger.info(f"[AUTH] Using API key: {api_key_preview}")

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

            logger.info(f"[AUTH] Supabase response status: {response.status_code}")

            if response.status_code == 200:
                user_data = response.json()
                user_id = user_data.get("id")
                email = user_data.get("email", "unknown")
                if user_id:
                    logger.info(f"[AUTH] ✓ Authenticated user: {user_id} ({email})")
                    return user_id
                logger.warning("[AUTH] User data missing 'id' field")
                logger.warning(f"[AUTH] Response data: {user_data}")
                return None
            elif response.status_code == 401:
                logger.warning("[AUTH] ✗ Token is invalid or expired (401)")
                try:
                    error_data = response.json()
                    logger.warning(f"[AUTH] Error details: {error_data}")
                except Exception:
                    logger.warning(f"[AUTH] Raw response: {response.text[:200]}")
                return None
            elif response.status_code == 403:
                logger.warning("[AUTH] ✗ Token forbidden (403) - possibly bad JWT signature")
                try:
                    error_data = response.json()
                    logger.warning(f"[AUTH] Error details: {error_data}")
                except Exception:
                    logger.warning(f"[AUTH] Raw response: {response.text[:200]}")
                return None
            else:
                logger.error(f"[AUTH] ✗ Supabase auth error: {response.status_code}")
                logger.error(f"[AUTH] Response: {response.text[:200]}")
                return None

        except httpx.TimeoutException:
            logger.error("[AUTH] ✗ Supabase auth request timed out")
            return None
        except Exception as e:
            logger.error(f"[AUTH] ✗ Unexpected error verifying token: {e}")
            return None
