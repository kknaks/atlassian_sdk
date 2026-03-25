from __future__ import annotations

from atlassian_sdk.exceptions import (
    ApiError,
    AuthError,
    NotFoundError,
    RateLimitError,
    SdkError,
    TimeoutError,
    ValidationError,
)


class TestInheritanceChain:
    """Verify the exception hierarchy is wired correctly."""

    def test_sdk_error_is_base(self) -> None:
        assert issubclass(SdkError, Exception)

    def test_api_error_inherits_sdk_error(self) -> None:
        assert issubclass(ApiError, SdkError)

    def test_auth_error_inherits_api_error(self) -> None:
        assert issubclass(AuthError, ApiError)

    def test_not_found_error_inherits_api_error(self) -> None:
        assert issubclass(NotFoundError, ApiError)

    def test_rate_limit_error_inherits_api_error(self) -> None:
        assert issubclass(RateLimitError, ApiError)

    def test_validation_error_inherits_sdk_error(self) -> None:
        assert issubclass(ValidationError, SdkError)
        assert not issubclass(ValidationError, ApiError)

    def test_timeout_error_inherits_sdk_error(self) -> None:
        assert issubclass(TimeoutError, SdkError)
        assert not issubclass(TimeoutError, ApiError)


class TestApiErrorAttributes:
    """Verify ApiError stores status_code and response_body."""

    def test_stores_status_code_and_body(self) -> None:
        err = ApiError("boom", status_code=500, response_body='{"error": "oops"}')
        assert err.status_code == 500
        assert err.response_body == '{"error": "oops"}'
        assert str(err) == "boom"


class TestRateLimitErrorAttributes:
    """Verify RateLimitError stores retry_after."""

    def test_stores_retry_after(self) -> None:
        err = RateLimitError(
            "slow down",
            status_code=429,
            response_body="",
            retry_after=30.0,
        )
        assert err.status_code == 429
        assert err.retry_after == 30.0

    def test_retry_after_defaults_to_none(self) -> None:
        err = RateLimitError("slow down", status_code=429, response_body="")
        assert err.retry_after is None
