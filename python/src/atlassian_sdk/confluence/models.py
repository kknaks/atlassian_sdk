from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class Space(BaseModel):
    """Confluence space."""

    model_config = ConfigDict(extra="ignore")

    id: str
    key: str
    name: str
    type: str = "global"
    status: str = "current"


class PageVersion(BaseModel):
    """Confluence page version info."""

    model_config = ConfigDict(extra="ignore")

    number: int
    message: str = ""


class PageBody(BaseModel):
    """Confluence page body content."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    storage: dict[str, Any] | None = None
    atlas_doc_format: dict[str, Any] | None = Field(
        default=None, alias="atlas_doc_format"
    )


class Page(BaseModel):
    """Confluence page."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str
    title: str
    space_id: str = Field(alias="spaceId")
    status: str = "current"
    parent_id: str | None = Field(default=None, alias="parentId")
    version: PageVersion | None = None
    body: PageBody | None = None

    @property
    def url(self) -> str:
        """Extract the page URL from _links if available, else return empty string."""
        links = getattr(self, "_links", None)
        if links and isinstance(links, dict):
            base = links.get("base", "")
            web_ui = links.get("webui", "")
            if base and web_ui:
                return f"{base}{web_ui}"
        return ""


class ConfluenceComment(BaseModel):
    """Confluence page comment."""

    model_config = ConfigDict(extra="ignore")

    id: str
    status: str = "current"
    title: str = ""
    body: PageBody | None = None
