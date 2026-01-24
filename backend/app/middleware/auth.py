"""JWT Authentication middleware for Supabase tokens."""

import logging
from typing import Optional

import jwt
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.config import get_settings

logger = logging.getLogger(__name__)


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to extract and verify Supabase JWT tokens.
    
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
            user_id = self._verify_token(token)

        # Attach user_id to request state (may be None if not authenticated)
        request.state.user_id = user_id

        return await call_next(request)

    def _verify_token(self, token: str) -> Optional[str]:
        """Verify JWT token and extract user_id.
        
        Args:
            token: The JWT token string
            
        Returns:
            User ID if token is valid, None otherwise
        """
        settings = get_settings()

        if not settings.supabase_jwt_secret:
            logger.warning("SUPABASE_JWT_SECRET not configured")
            return None

        try:
            # Decode the JWT token
            # Supabase uses HS256 algorithm
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )

            # Extract user_id from 'sub' claim
            user_id = payload.get("sub")
            
            if not user_id:
                logger.warning("Token missing 'sub' claim")
                return None

            return user_id

        except jwt.ExpiredSignatureError:
            logger.debug("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.debug(f"Invalid token: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error verifying token: {e}")
            return None
