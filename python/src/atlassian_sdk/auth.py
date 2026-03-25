from __future__ import annotations

import base64
import os
from dataclasses import dataclass

from atlassian_sdk.exceptions import AuthError


@dataclass(frozen=True)
class BasicAuth:
    """Immutable container for Atlassian basic-auth credentials."""

    email: str
    api_token: str

    @property
    def header_value(self) -> str:
        """Return the ``Authorization`` header value (``Basic <b64>``)."""
        raw = f"{self.email}:{self.api_token}".encode()
        encoded = base64.b64encode(raw).decode()
        return f"Basic {encoded}"

    @classmethod
    def from_env(cls) -> BasicAuth:
        """Create a :class:`BasicAuth` from environment variables.

        Reads ``ATLASSIAN_EMAIL`` and ``ATLASSIAN_API_TOKEN``.

        Raises:
            AuthError: If either variable is missing.
        """
        email = os.environ.get("ATLASSIAN_EMAIL")
        api_token = os.environ.get("ATLASSIAN_API_TOKEN")

        missing: list[str] = []
        if not email:
            missing.append("ATLASSIAN_EMAIL")
        if not api_token:
            missing.append("ATLASSIAN_API_TOKEN")

        if missing:
            raise AuthError(
                f"Missing environment variable(s): {', '.join(missing)}\n\n"
                "To fix this, either:\n"
                "  1. Create a .env file with the variables and use --env-file .env\n"
                "  2. Set them in your shell: export ATLASSIAN_EMAIL=you@example.com\n"
                "  3. Add env field in .mcp.json: \"env\": { \"ATLASSIAN_EMAIL\": \"...\" }\n\n"
                "Required variables:\n"
                "  ATLASSIAN_EMAIL     — Account email address\n"
                "  ATLASSIAN_API_TOKEN — API token (https://id.atlassian.com/manage-profile/security/api-tokens)",
                status_code=401,
                response_body="",
            )

        return cls(email=email, api_token=api_token)
