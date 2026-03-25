from __future__ import annotations

import json
import logging
import os
from typing import Any

from atlassian_sdk.exceptions import ValidationError
from atlassian_sdk.http import AsyncHttpClient
from atlassian_sdk.jira.models import (
    Comment,
    IssueType,
    JiraIssue,
    JiraProject,
)
from atlassian_sdk.jira.schemas import (
    CreateIssueRequest,
    SearchIssuesRequest,
    TransitionIssueRequest,
    text_to_adf,
)

logger = logging.getLogger(__name__)


class JiraClient:
    """Async client for the Jira REST API v3."""

    def __init__(
        self,
        http: AsyncHttpClient | None = None,
        project: str | None = None,
        epic_map: dict[str, str] | None = None,
    ) -> None:
        self._http = http or AsyncHttpClient.from_env()
        self.project = project or os.environ.get("PYACLI_DEFAULT_PROJECT", "")
        self._epic_map = epic_map or self._load_epic_map()

    @staticmethod
    def _load_epic_map() -> dict[str, str]:
        """Load epic mapping from the PYACLI_EPIC_MAP environment variable.

        Format: ``name1:KEY-1,name2:KEY-2``
        """
        raw = os.environ.get("PYACLI_EPIC_MAP", "")
        if not raw:
            return {}
        result: dict[str, str] = {}
        for pair in raw.split(","):
            pair = pair.strip()
            if ":" in pair:
                name, key = pair.split(":", 1)
                result[name.strip()] = key.strip()
        return result

    @property
    def epics(self) -> dict[str, str]:
        """Return a copy of the epic mapping."""
        return dict(self._epic_map)

    async def list_projects(self) -> list[JiraProject]:
        """List all visible Jira projects."""
        data = await self._http.get("/rest/api/3/project")
        return [JiraProject(**item) for item in data]

    async def list_issue_types(self, project: str | None = None) -> list[IssueType]:
        """List issue types available for a project.

        Args:
            project: Project key. Falls back to the default project.

        Raises:
            ValidationError: If no project is specified and no default is set.
        """
        target = project or self.project
        if not target:
            raise ValidationError("No project specified and no default project set")
        data = await self._http.get(
            f"/rest/api/3/issue/createmeta/{target}/issuetypes"
        )
        return [
            IssueType(**item)
            for item in data.get("issueTypes", data.get("values", []))
        ]

    async def create_issue(
        self,
        summary: str | None = None,
        *,
        project: str | None = None,
        description: str | None = None,
        issue_type: str = "Task",
        assignee: str | None = None,
        labels: list[str] | None = None,
        parent: str | None = None,
        epic: str | None = None,
        request: CreateIssueRequest | None = None,
    ) -> JiraIssue:
        """Create a new Jira issue.

        Args:
            summary: Issue summary (required if ``request`` is not provided).
            project: Project key. Falls back to the default project.
            description: Issue description as plain text.
            issue_type: Issue type name (default ``Task``).
            assignee: Account ID of the assignee.
            labels: List of labels.
            parent: Parent issue key (for subtasks or child issues).
            epic: Epic name (resolved via epic_map) or epic issue key.
            request: Pre-built ``CreateIssueRequest`` (overrides other params).

        Raises:
            ValidationError: If no project or summary is available.
        """
        target = project or self.project
        if not target:
            raise ValidationError("No project specified and no default project set")

        # Resolve epic to parent key
        resolved_parent = parent
        if epic:
            resolved_parent = self._epic_map.get(epic, epic)

        if request is None:
            if not summary:
                raise ValidationError("summary is required")
            request = CreateIssueRequest(
                summary=summary,
                description=description,
                issue_type=issue_type,
                assignee=assignee,
                labels=labels or [],
                parent=resolved_parent,
            )
        elif resolved_parent and request.parent is None:
            # If epic was resolved but request was provided without parent
            request = request.model_copy(update={"parent": resolved_parent})

        body = request.to_request_body(target)
        data = await self._http.post("/rest/api/3/issue", json=body)
        return await self.get_issue(data["key"])

    async def get_issue(self, key: str) -> JiraIssue:
        """Fetch a single Jira issue by key.

        Args:
            key: The issue key (e.g. ``PROJ-123``).
        """
        data = await self._http.get(f"/rest/api/3/issue/{key}")
        return JiraIssue.from_api(data)

    async def search_issues(
        self,
        jql: str | None = None,
        *,
        limit: int = 50,
        fields: list[str] | None = None,
        request: SearchIssuesRequest | None = None,
    ) -> list[JiraIssue]:
        """Search for issues using JQL.

        Args:
            jql: JQL query string (required if ``request`` is not provided).
            limit: Maximum number of results.
            fields: List of fields to return.
            request: Pre-built ``SearchIssuesRequest`` (overrides other params).

        Raises:
            ValidationError: If no JQL query is provided.
        """
        if request is None:
            if not jql:
                raise ValidationError("jql is required")
            request = SearchIssuesRequest(jql=jql, limit=limit, fields=fields)

        body = request.to_request_body()
        data = await self._http.post("/rest/api/3/search/jql", json=body)
        return [JiraIssue.from_api(item) for item in data.get("issues", [])]

    async def transition_issue(self, key: str, *, status: str) -> None:
        """Transition an issue to a new status.

        Args:
            key: The issue key (e.g. ``PROJ-123``).
            status: Target status name (case-insensitive match).

        Raises:
            ValidationError: If no matching transition is found.
        """
        trans_data = await self._http.get(f"/rest/api/3/issue/{key}/transitions")
        transitions = trans_data.get("transitions", [])

        matched: dict[str, Any] | None = None
        for t in transitions:
            if t.get("name", "").lower() == status.lower():
                matched = t
                break

        if matched is None:
            available = [t.get("name", "") for t in transitions]
            raise ValidationError(
                f"No transition to status '{status}' found. "
                f"Available transitions: {available}"
            )

        request = TransitionIssueRequest(transition_id=matched["id"])
        body = request.to_request_body()
        await self._http.post(f"/rest/api/3/issue/{key}/transitions", json=body)

    async def add_comment(self, key: str, *, body: str) -> None:
        """Add a comment to an issue.

        Args:
            key: The issue key (e.g. ``PROJ-123``).
            body: Comment text (will be wrapped in ADF).
        """
        adf_body = text_to_adf(body)
        await self._http.post(
            f"/rest/api/3/issue/{key}/comment", json={"body": adf_body}
        )

    async def list_comments(self, key: str) -> list[Comment]:
        """List comments on an issue.

        Args:
            key: The issue key (e.g. ``PROJ-123``).
        """
        data = await self._http.get(f"/rest/api/3/issue/{key}/comment")
        return [Comment(**item) for item in data.get("comments", [])]
