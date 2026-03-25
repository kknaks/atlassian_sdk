from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


def text_to_adf(text: str) -> dict:
    """Wrap plain text in Atlassian Document Format."""
    return {
        "type": "doc",
        "version": 1,
        "content": [{"type": "paragraph", "content": [{"type": "text", "text": text}]}],
    }


class CreateIssueRequest(BaseModel):
    """Input schema for creating a Jira issue."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    summary: str
    description: str | None = None
    issue_type: str = Field(default="Task", alias="type")
    assignee: str | None = None
    labels: list[str] = Field(default_factory=list)
    parent: str | None = None

    def to_request_body(self, project: str) -> dict:
        """Build the REST API v3 request body.

        Args:
            project: The Jira project key.

        Returns:
            A dict suitable for ``POST /rest/api/3/issue``.
        """
        fields: dict = {
            "project": {"key": project},
            "summary": self.summary,
            "issuetype": {"name": self.issue_type},
        }
        if self.description is not None:
            fields["description"] = text_to_adf(self.description)
        if self.assignee is not None:
            fields["assignee"] = {"id": self.assignee}
        if self.labels:
            fields["labels"] = self.labels
        if self.parent is not None:
            fields["parent"] = {"key": self.parent}
        return {"fields": fields}


_DEFAULT_SEARCH_FIELDS = [
    "summary", "status", "issuetype", "priority",
    "assignee", "creator", "reporter", "project",
    "labels", "created", "updated", "parent",
    "duedate", "resolution", "description",
]


class SearchIssuesRequest(BaseModel):
    """Input schema for searching Jira issues via JQL."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    jql: str
    limit: int = 50
    fields: list[str] | None = None

    def to_request_body(self) -> dict:
        """Build the REST API request body.

        Returns:
            A dict suitable for ``POST /rest/api/3/search/jql``.
        """
        return {
            "jql": self.jql,
            "maxResults": self.limit,
            "fields": self.fields if self.fields is not None else _DEFAULT_SEARCH_FIELDS,
        }


class TransitionIssueRequest(BaseModel):
    """Input schema for transitioning a Jira issue."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    transition_id: str

    def to_request_body(self) -> dict:
        """Build the REST API request body.

        Returns:
            A dict suitable for ``POST /rest/api/3/issue/{key}/transitions``.
        """
        return {"transition": {"id": self.transition_id}}
