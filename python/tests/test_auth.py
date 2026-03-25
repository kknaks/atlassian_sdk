from __future__ import annotations

import base64

import pytest

from atlassian_sdk.auth import BasicAuth
from atlassian_sdk.exceptions import AuthError


class TestHeaderValue:
    """Verify header_value produces correct base64."""

    def test_header_value(self) -> None:
        auth = BasicAuth(email="user@example.com", api_token="secret")
        expected_b64 = base64.b64encode(b"user@example.com:secret").decode()
        assert auth.header_value == f"Basic {expected_b64}"

    def test_header_value_encoding(self) -> None:
        auth = BasicAuth(email="a@b.com", api_token="tok")
        # Manually verify the base64
        assert auth.header_value == "Basic " + base64.b64encode(b"a@b.com:tok").decode()


class TestFromEnv:
    """Verify from_env reads env vars and raises on missing ones."""

    def test_from_env_valid(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("ATLASSIAN_EMAIL", "me@co.com")
        monkeypatch.setenv("ATLASSIAN_API_TOKEN", "mytoken")
        auth = BasicAuth.from_env()
        assert auth.email == "me@co.com"
        assert auth.api_token == "mytoken"

    def test_from_env_missing_email(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("ATLASSIAN_EMAIL", raising=False)
        monkeypatch.setenv("ATLASSIAN_API_TOKEN", "mytoken")
        with pytest.raises(AuthError, match="ATLASSIAN_EMAIL"):
            BasicAuth.from_env()

    def test_from_env_missing_token(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("ATLASSIAN_EMAIL", "me@co.com")
        monkeypatch.delenv("ATLASSIAN_API_TOKEN", raising=False)
        with pytest.raises(AuthError, match="ATLASSIAN_API_TOKEN"):
            BasicAuth.from_env()

    def test_from_env_missing_both(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("ATLASSIAN_EMAIL", raising=False)
        monkeypatch.delenv("ATLASSIAN_API_TOKEN", raising=False)
        with pytest.raises(AuthError):
            BasicAuth.from_env()
