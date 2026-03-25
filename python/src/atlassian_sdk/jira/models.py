from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class StatusCategory(BaseModel):
    """Jira status category."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: int
    key: str
    name: str
    color_name: str = Field(alias="colorName")


class Status(BaseModel):
    """Jira issue status."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str
    name: str
    status_category: StatusCategory = Field(alias="statusCategory")


class IssueType(BaseModel):
    """Jira issue type."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str
    name: str
    subtask: bool = False


class Priority(BaseModel):
    """Jira issue priority."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str
    name: str


class User(BaseModel):
    """Jira user."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    account_id: str = Field(alias="accountId")
    display_name: str = Field(alias="displayName")
    active: bool = True


class Project(BaseModel):
    """Minimal project reference."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str
    key: str
    name: str


class JiraProject(BaseModel):
    """Full Jira project."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str
    key: str
    name: str
    project_type_key: str = Field(default="", alias="projectTypeKey")
    style: str = ""


class ParentRef(BaseModel):
    """Reference to a parent issue."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str
    key: str
    fields: dict[str, Any] | None = None


class Transition(BaseModel):
    """Jira workflow transition."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str
    name: str
    to: Status | None = None


class Comment(BaseModel):
    """Jira issue comment."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str
    body: str | dict[str, Any] | None = None
    author: User | None = None
    created: datetime | None = None
    updated: datetime | None = None


class JiraIssue(BaseModel):
    """Jira issue parsed from REST API response."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str
    key: str
    self_url: str = Field(default="", alias="self")
    summary: str = ""
    description: str | dict[str, Any] | None = None
    status: Status | None = None
    issuetype: IssueType | None = None
    priority: Priority | None = None
    assignee: User | None = None
    creator: User | None = None
    reporter: User | None = None
    project: Project | None = None
    labels: list[str] = Field(default_factory=list)
    created: datetime | None = None
    updated: datetime | None = None
    parent: ParentRef | None = None
    duedate: str | None = None
    resolution: str | dict[str, Any] | None = None

    @classmethod
    def from_api(cls, data: dict[str, Any]) -> JiraIssue:
        """Parse a Jira issue from the REST API response.

        Extracts fields from the nested ``fields`` dict and merges them
        with top-level ``id``, ``key``, and ``self``.
        """
        fields = data.get("fields", {})
        flat: dict[str, Any] = {
            "id": data.get("id", ""),
            "key": data.get("key", ""),
            "self": data.get("self", ""),
        }
        flat.update(fields)
        return cls(**flat)

    @property
    def url(self) -> str:
        """Construct the browser URL from self_url.

        Converts ``https://site.atlassian.net/rest/api/3/issue/12345``
        to ``https://site.atlassian.net/browse/KEY``.
        """
        if not self.self_url:
            return ""
        base = self.self_url.split("/rest/")[0]
        return f"{base}/browse/{self.key}"
