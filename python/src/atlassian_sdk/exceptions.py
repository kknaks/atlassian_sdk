from __future__ import annotations


class SdkError(Exception):
    """Base exception for the Atlassian SDK."""


class ValidationError(SdkError):
    """Raised when input validation fails."""


class TimeoutError(SdkError):
    """Raised when a request times out."""


class ApiError(SdkError):
    """Raised on generic 4xx/5xx HTTP responses.

    Attributes:
        status_code: The HTTP status code.
        response_body: The raw response body as a string.
    """

    def __init__(
        self,
        message: str,
        *,
        status_code: int,
        response_body: str,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


class AuthError(ApiError):
    """Raised on 401 responses or missing credentials."""


class NotFoundError(ApiError):
    """Raised on 404 responses."""


class RateLimitError(ApiError):
    """Raised on 429 responses.

    Attributes:
        retry_after: Seconds to wait before retrying, or ``None`` if the
            server did not provide a ``Retry-After`` header.
    """

    def __init__(
        self,
        message: str,
        *,
        status_code: int,
        response_body: str,
        retry_after: float | None = None,
    ) -> None:
        super().__init__(
            message,
            status_code=status_code,
            response_body=response_body,
        )
        self.retry_after = retry_after
