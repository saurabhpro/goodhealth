"""JWT Authentication middleware for Supabase tokens."""

import logging

import httpx
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.config import get_settings

logger = logging.getLogger(__name__)


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """Extract and verify Supabase JWT tokens via auth.getUser().

    Attaches user_id to request.state when the token is valid.
    Routes enforce authentication via the get_current_user_id dependency.
    """

    PUBLIC_PATHS = {"/", "/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        user_id = None

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
            user_id = await self._verify_token_with_supabase(request, token)

        request.state.user_id = user_id

        return await call_next(request)

    async def _verify_token_with_supabase(
        self, request: Request, token: str
    ) -> str | None:
        settings = get_settings()

        if not settings.supabase_url or not settings.supabase_service_key:
            logger.error("Supabase auth is not fully configured")
            return None

        client: httpx.AsyncClient = request.app.state.http_client

        try:
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_service_key,
                },
            )
        except httpx.TimeoutException:
            logger.error("Supabase auth request timed out")
            return None
        except httpx.HTTPError as exc:
            logger.error("Supabase auth request failed: %s", exc)
            return None

        if response.status_code == 200:
            user_data = response.json()
            user_id = user_data.get("id")
            return user_id if user_id else None
        if response.status_code != 401:
            logger.warning("Supabase auth error: %s", response.status_code)
        return None
