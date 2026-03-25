from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class CreatePageRequest(BaseModel):
    """Schema for creating a Confluence page."""

    model_config = ConfigDict(extra="forbid")

    space_id: str
    title: str
    body: str
    parent_id: str | None = None
    status: str = "current"

    def to_request_body(self) -> dict:
        """Build the REST API request body."""
        payload: dict = {
            "spaceId": self.space_id,
            "title": self.title,
            "body": {
                "representation": "storage",
                "value": self.body,
            },
            "status": self.status,
        }
        if self.parent_id is not None:
            payload["parentId"] = self.parent_id
        return payload


class UpdatePageRequest(BaseModel):
    """Schema for updating a Confluence page."""

    model_config = ConfigDict(extra="forbid")

    title: str
    body: str
    version_number: int
    status: str = "current"

    def to_request_body(self, page_id: str) -> dict:
        """Build the REST API request body."""
        return {
            "id": page_id,
            "title": self.title,
            "body": {
                "representation": "storage",
                "value": self.body,
            },
            "version": {
                "number": self.version_number,
            },
            "status": self.status,
        }


class CreateCommentRequest(BaseModel):
    """Schema for creating a Confluence comment."""

    model_config = ConfigDict(extra="forbid")

    body: str

    def to_request_body(self) -> dict:
        """Build the REST API request body."""
        return {
            "body": {
                "representation": "storage",
                "value": self.body,
            },
        }


class SearchConfluenceRequest(BaseModel):
    """Schema for searching Confluence content."""

    model_config = ConfigDict(extra="forbid")

    cql: str
    limit: int = 25

    def to_query_params(self) -> dict[str, str]:
        """Build query parameters for the search endpoint."""
        return {
            "cql": self.cql,
            "limit": str(self.limit),
        }
