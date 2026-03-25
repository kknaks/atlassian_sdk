from __future__ import annotations

import httpx
import pytest
import respx

from atlassian_sdk.auth import BasicAuth
from atlassian_sdk.exceptions import (
    ApiError,
    AuthError,
    NotFoundError,
    RateLimitError,
    TimeoutError,
)
from atlassian_sdk.http import AsyncHttpClient

BASE_URL = "https://test.atlassian.net"


@pytest.fixture()
def auth() -> BasicAuth:
    return BasicAuth(email="user@example.com", api_token="tok")


@pytest.fixture()
async def client(auth: BasicAuth) -> AsyncHttpClient:
    c = AsyncHttpClient(BASE_URL, auth)
    yield c  # type: ignore[misc]
    await c.aclose()


class TestGet:
    async def test_successful_get(self, client: AsyncHttpClient) -> None:
        with respx.mock(base_url=BASE_URL) as router:
            router.get("/rest/api/resource").mock(
                return_value=httpx.Response(200, json={"key": "value"})
            )
            result = await client.get("/rest/api/resource")
        assert result == {"key": "value"}


class TestPost:
    async def test_successful_post(self, client: AsyncHttpClient) -> None:
        with respx.mock(base_url=BASE_URL) as router:
            router.post("/rest/api/resource").mock(
                return_value=httpx.Response(201, json={"id": 1})
            )
            result = await client.post("/rest/api/resource", json={"name": "test"})
        assert result == {"id": 1}


class TestErrorMapping:
    async def test_401_raises_auth_error(self, client: AsyncHttpClient) -> None:
        with respx.mock(base_url=BASE_URL) as router:
            router.get("/x").mock(
                return_value=httpx.Response(401, text="Unauthorized")
            )
            with pytest.raises(AuthError) as exc_info:
                await client.get("/x")
            assert exc_info.value.status_code == 401

    async def test_404_raises_not_found_error(self, client: AsyncHttpClient) -> None:
        with respx.mock(base_url=BASE_URL) as router:
            router.get("/x").mock(
                return_value=httpx.Response(404, text="Not Found")
            )
            with pytest.raises(NotFoundError) as exc_info:
                await client.get("/x")
            assert exc_info.value.status_code == 404

    async def test_429_raises_rate_limit_error(self, client: AsyncHttpClient) -> None:
        with respx.mock(base_url=BASE_URL) as router:
            router.get("/x").mock(
                return_value=httpx.Response(
                    429,
                    text="Too Many Requests",
                    headers={"Retry-After": "60"},
                )
            )
            with pytest.raises(RateLimitError) as exc_info:
                await client.get("/x")
            assert exc_info.value.status_code == 429
            assert exc_info.value.retry_after == 60.0

    async def test_500_raises_api_error(self, client: AsyncHttpClient) -> None:
        with respx.mock(base_url=BASE_URL) as router:
            router.get("/x").mock(
                return_value=httpx.Response(500, text="Internal Server Error")
            )
            with pytest.raises(ApiError) as exc_info:
                await client.get("/x")
            assert exc_info.value.status_code == 500


class TestTimeout:
    async def test_timeout_raises_timeout_error(self, client: AsyncHttpClient) -> None:
        with respx.mock(base_url=BASE_URL) as router:
            router.get("/x").mock(side_effect=httpx.ReadTimeout("timed out"))
            with pytest.raises(TimeoutError):
                await client.get("/x")


class TestFromEnv:
    def test_from_env_valid(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("ATLASSIAN_SITE", "mysite.atlassian.net")
        monkeypatch.setenv("ATLASSIAN_EMAIL", "a@b.com")
        monkeypatch.setenv("ATLASSIAN_API_TOKEN", "tok")
        c = AsyncHttpClient.from_env()
        assert str(c._client.base_url) == "https://mysite.atlassian.net"

    def test_from_env_missing_site(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("ATLASSIAN_SITE", raising=False)
        monkeypatch.setenv("ATLASSIAN_EMAIL", "a@b.com")
        monkeypatch.setenv("ATLASSIAN_API_TOKEN", "tok")
        with pytest.raises(AuthError, match="ATLASSIAN_SITE"):
            AsyncHttpClient.from_env()
