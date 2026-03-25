from __future__ import annotations

import pytest
from pydantic import ValidationError as PydanticValidationError

from atlassian_sdk.jira.schemas import (
    CreateIssueRequest,
    SearchIssuesRequest,
    TransitionIssueRequest,
    text_to_adf,
)


class TestTextToAdf:
    def test_wraps_text(self) -> None:
        result = text_to_adf("Hello world")
        assert result["type"] == "doc"
        assert result["version"] == 1
        content = result["content"]
        assert len(content) == 1
        paragraph = content[0]
        assert paragraph["type"] == "paragraph"
        assert paragraph["content"][0]["type"] == "text"
        assert paragraph["content"][0]["text"] == "Hello world"


class TestCreateIssueRequest:
    def test_minimal_body(self) -> None:
        req = CreateIssueRequest(summary="Test issue")
        body = req.to_request_body("PROJ")
        assert body == {
            "fields": {
                "project": {"key": "PROJ"},
                "summary": "Test issue",
                "issuetype": {"name": "Task"},
            }
        }

    def test_full_body(self) -> None:
        req = CreateIssueRequest(
            summary="Bug fix",
            description="Fix the login page",
            issue_type="Bug",
            assignee="user123",
            labels=["urgent", "frontend"],
            parent="PROJ-1",
        )
        body = req.to_request_body("PROJ")
        fields = body["fields"]
        assert fields["project"] == {"key": "PROJ"}
        assert fields["summary"] == "Bug fix"
        assert fields["issuetype"] == {"name": "Bug"}
        assert fields["assignee"] == {"id": "user123"}
        assert fields["labels"] == ["urgent", "frontend"]
        assert fields["parent"] == {"key": "PROJ-1"}

    def test_description_adf_wrapping(self) -> None:
        req = CreateIssueRequest(summary="S", description="My description")
        body = req.to_request_body("P")
        desc = body["fields"]["description"]
        assert desc["type"] == "doc"
        assert desc["content"][0]["content"][0]["text"] == "My description"

    def test_no_description_when_none(self) -> None:
        req = CreateIssueRequest(summary="S")
        body = req.to_request_body("P")
        assert "description" not in body["fields"]

    def test_no_assignee_when_none(self) -> None:
        req = CreateIssueRequest(summary="S")
        body = req.to_request_body("P")
        assert "assignee" not in body["fields"]

    def test_no_labels_when_empty(self) -> None:
        req = CreateIssueRequest(summary="S")
        body = req.to_request_body("P")
        assert "labels" not in body["fields"]

    def test_no_parent_when_none(self) -> None:
        req = CreateIssueRequest(summary="S")
        body = req.to_request_body("P")
        assert "parent" not in body["fields"]

    def test_alias_type(self) -> None:
        """The 'type' alias should work."""
        req = CreateIssueRequest(**{"summary": "S", "type": "Story"})
        assert req.issue_type == "Story"

    def test_extra_forbidden(self) -> None:
        with pytest.raises(PydanticValidationError):
            CreateIssueRequest(summary="S", unknown_field="bad")


class TestSearchIssuesRequest:
    def test_minimal_body(self) -> None:
        req = SearchIssuesRequest(jql="project = PROJ")
        body = req.to_request_body()
        assert body["jql"] == "project = PROJ"
        assert body["maxResults"] == 50
        assert isinstance(body["fields"], list)
        assert "summary" in body["fields"]
        assert "status" in body["fields"]

    def test_with_fields(self) -> None:
        req = SearchIssuesRequest(jql="status = Done", limit=10, fields=["summary", "status"])
        body = req.to_request_body()
        assert body == {"jql": "status = Done", "maxResults": 10, "fields": ["summary", "status"]}

    def test_default_fields_when_none(self) -> None:
        req = SearchIssuesRequest(jql="x")
        body = req.to_request_body()
        assert "fields" in body
        assert len(body["fields"]) > 0

    def test_extra_forbidden(self) -> None:
        with pytest.raises(PydanticValidationError):
            SearchIssuesRequest(jql="x", bad="y")


class TestTransitionIssueRequest:
    def test_body(self) -> None:
        req = TransitionIssueRequest(transition_id="21")
        body = req.to_request_body()
        assert body == {"transition": {"id": "21"}}

    def test_extra_forbidden(self) -> None:
        with pytest.raises(PydanticValidationError):
            TransitionIssueRequest(transition_id="1", extra="bad")
