from __future__ import annotations

import logging

from atlassian_sdk.http import AsyncHttpClient

from atlassian_sdk.confluence.models import ConfluenceComment, Page, Space
from atlassian_sdk.confluence.schemas import (
    CreateCommentRequest,
    CreatePageRequest,
    UpdatePageRequest,
)

logger = logging.getLogger(__name__)


class ConfluenceClient:
    """Async client for the Confluence REST API v2."""

    def __init__(self, http: AsyncHttpClient | None = None) -> None:
        self._http = http or AsyncHttpClient.from_env()

    async def create_page(
        self,
        *,
        space_id: str,
        title: str,
        body: str,
        parent_id: str | None = None,
        status: str = "current",
        request: CreatePageRequest | None = None,
    ) -> Page:
        """Create a new Confluence page.

        Args:
            space_id: The space ID to create the page in.
            title: Page title.
            body: Page body in storage format.
            parent_id: Optional parent page ID.
            status: Page status (default "current").
            request: Pre-built CreatePageRequest (overrides other params).
        """
        if request is None:
            request = CreatePageRequest(
                space_id=space_id,
                title=title,
                body=body,
                parent_id=parent_id,
                status=status,
            )
        payload = request.to_request_body()
        data = await self._http.post("/wiki/api/v2/pages", json=payload)
        return Page(**data)

    async def get_page(self, page_id: str) -> Page:
        """Fetch a single Confluence page by ID.

        Args:
            page_id: The page ID.
        """
        data = await self._http.get(
            f"/wiki/api/v2/pages/{page_id}",
            params={"body-format": "storage"},
        )
        return Page(**data)

    async def update_page(
        self,
        page_id: str,
        *,
        title: str,
        body: str,
        version_number: int,
        status: str = "current",
        request: UpdatePageRequest | None = None,
    ) -> Page:
        """Update an existing Confluence page.

        Args:
            page_id: The page ID.
            title: New page title.
            body: New page body in storage format.
            version_number: The new version number.
            status: Page status (default "current").
            request: Pre-built UpdatePageRequest (overrides other params).
        """
        if request is None:
            request = UpdatePageRequest(
                title=title,
                body=body,
                version_number=version_number,
                status=status,
            )
        payload = request.to_request_body(page_id)
        data = await self._http.put(f"/wiki/api/v2/pages/{page_id}", json=payload)
        return Page(**data)

    async def list_spaces(self, *, limit: int = 25) -> list[Space]:
        """List Confluence spaces.

        Args:
            limit: Maximum number of spaces to return.
        """
        data = await self._http.get(
            "/wiki/api/v2/spaces", params={"limit": str(limit)}
        )
        return [Space(**s) for s in data.get("results", [])]

    async def get_pages_in_space(
        self, space_id: str, *, limit: int = 25
    ) -> list[Page]:
        """List pages in a Confluence space.

        Args:
            space_id: The space ID.
            limit: Maximum number of pages to return.
        """
        data = await self._http.get(
            f"/wiki/api/v2/spaces/{space_id}/pages",
            params={"limit": str(limit)},
        )
        return [Page(**p) for p in data.get("results", [])]

    async def get_child_pages(
        self, page_id: str, *, limit: int = 25
    ) -> list[Page]:
        """List child pages of a given page.

        Args:
            page_id: The parent page ID.
            limit: Maximum number of child pages to return.
        """
        data = await self._http.get(
            f"/wiki/api/v2/pages/{page_id}/children",
            params={"limit": str(limit)},
        )
        return [Page(**p) for p in data.get("results", [])]

    async def get_footer_comments(
        self, page_id: str
    ) -> list[ConfluenceComment]:
        """List footer comments on a page.

        Args:
            page_id: The page ID.
        """
        data = await self._http.get(
            f"/wiki/api/v2/pages/{page_id}/footer-comments"
        )
        return [ConfluenceComment(**c) for c in data.get("results", [])]

    async def add_footer_comment(
        self, page_id: str, *, body: str
    ) -> ConfluenceComment:
        """Add a footer comment to a page.

        Args:
            page_id: The page ID.
            body: Comment body in storage format.
        """
        request = CreateCommentRequest(body=body)
        payload = request.to_request_body()
        data = await self._http.post(
            f"/wiki/api/v2/pages/{page_id}/footer-comments", json=payload
        )
        return ConfluenceComment(**data)

    async def get_inline_comments(
        self, page_id: str
    ) -> list[ConfluenceComment]:
        """List inline comments on a page.

        Args:
            page_id: The page ID.
        """
        data = await self._http.get(
            f"/wiki/api/v2/pages/{page_id}/inline-comments"
        )
        return [ConfluenceComment(**c) for c in data.get("results", [])]

    async def add_inline_comment(
        self, page_id: str, *, body: str
    ) -> ConfluenceComment:
        """Add an inline comment to a page.

        Args:
            page_id: The page ID.
            body: Comment body in storage format.
        """
        request = CreateCommentRequest(body=body)
        payload = request.to_request_body()
        data = await self._http.post(
            f"/wiki/api/v2/pages/{page_id}/inline-comments", json=payload
        )
        return ConfluenceComment(**data)

    async def search(self, cql: str, *, limit: int = 25) -> list[dict]:
        """Search Confluence using CQL.

        Uses the v1 search endpoint.

        Args:
            cql: CQL query string.
            limit: Maximum number of results.
        """
        data = await self._http.get(
            "/wiki/rest/api/search",
            params={"cql": cql, "limit": str(limit)},
        )
        return data.get("results", [])
