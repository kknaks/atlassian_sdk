from __future__ import annotations

import logging
import os

import httpx

from atlassian_sdk.auth import BasicAuth
from atlassian_sdk.exceptions import (
    ApiError,
    AuthError,
    NotFoundError,
    RateLimitError,
    TimeoutError,
)

logger = logging.getLogger(__name__)


class AsyncHttpClient:
    """Async HTTP client for Atlassian REST APIs."""

    def __init__(
        self,
        base_url: str,
        auth: BasicAuth,
        *,
        timeout: float = 30.0,
    ) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": auth.header_value},
            timeout=timeout,
        )

    async def request(
        self,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ) -> dict | list:
        """Send an HTTP request and return the parsed JSON response.

        Args:
            method: HTTP method (GET, POST, PUT, etc.).
            path: URL path relative to the base URL.
            json: Optional JSON body.
            params: Optional query parameters.

        Returns:
            Parsed JSON response as a dict or list.

        Raises:
            AuthError: On 401 responses.
            NotFoundError: On 404 responses.
            RateLimitError: On 429 responses.
            ApiError: On other 4xx/5xx responses.
            TimeoutError: When the request times out.
        """
        logger.debug("Request: %s %s", method, path)

        try:
            response = await self._client.request(
                method,
                path,
                json=json,
                params=params,
            )
        except httpx.TimeoutException as exc:
            raise TimeoutError(f"Request timed out: {method} {path}") from exc

        logger.debug("Response: %s %s -> %d", method, path, response.status_code)

        if response.status_code >= 400:
            body = response.text
            msg = f"{method} {path} returned {response.status_code}"

            if response.status_code == 401:
                raise AuthError(msg, status_code=401, response_body=body)

            if response.status_code == 404:
                raise NotFoundError(msg, status_code=404, response_body=body)

            if response.status_code == 429:
                retry_after: float | None = None
                raw = response.headers.get("Retry-After")
                if raw is not None:
                    try:
                        retry_after = float(raw)
                    except ValueError:
                        retry_after = None
                raise RateLimitError(
                    msg,
                    status_code=429,
                    response_body=body,
                    retry_after=retry_after,
                )

            raise ApiError(msg, status_code=response.status_code, response_body=body)

        return response.json()

    async def get(
        self,
        path: str,
        *,
        params: dict | None = None,
    ) -> dict | list:
        """Send a GET request."""
        return await self.request("GET", path, params=params)

    async def post(
        self,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ) -> dict | list:
        """Send a POST request."""
        return await self.request("POST", path, json=json, params=params)

    async def put(
        self,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ) -> dict | list:
        """Send a PUT request."""
        return await self.request("PUT", path, json=json, params=params)

    async def aclose(self) -> None:
        """Close the underlying HTTP client."""
        await self._client.aclose()

    @classmethod
    def from_env(cls) -> AsyncHttpClient:
        """Create a client from environment variables.

        Reads ``ATLASSIAN_SITE`` (e.g. ``mysite.atlassian.net``),
        ``ATLASSIAN_EMAIL``, and ``ATLASSIAN_API_TOKEN``.

        Raises:
            AuthError: If required environment variables are missing.
        """
        site = os.environ.get("ATLASSIAN_SITE")
        if not site:
            raise AuthError(
                "Missing environment variable(s): ATLASSIAN_SITE\n\n"
                "To fix this, either:\n"
                "  1. Create a .env file with the variables and use --env-file .env\n"
                "  2. Set it in your shell: export ATLASSIAN_SITE=mysite.atlassian.net\n"
                "  3. Add env field in .mcp.json: \"env\": { \"ATLASSIAN_SITE\": \"...\" }\n\n"
                "Required: ATLASSIAN_SITE — Your Atlassian site (e.g. mysite.atlassian.net)",
                status_code=401,
                response_body="",
            )

        base_url = f"https://{site}"
        auth = BasicAuth.from_env()
        return cls(base_url=base_url, auth=auth)
