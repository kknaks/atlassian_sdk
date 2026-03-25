from __future__ import annotations

import os
from unittest.mock import AsyncMock, patch

import pytest

from atlassian_sdk.exceptions import ValidationError
from atlassian_sdk.jira.client import JiraClient
from atlassian_sdk.jira.models import Comment, IssueType, JiraIssue, JiraProject
from atlassian_sdk.jira.schemas import text_to_adf


def _make_mock_http() -> AsyncMock:
    """Create a mock AsyncHttpClient."""
    mock = AsyncMock()
    mock.get = AsyncMock()
    mock.post = AsyncMock()
    mock.put = AsyncMock()
    return mock


SAMPLE_ISSUE_API = {
    "id": "10001",
    "key": "PROJ-42",
    "self": "https://site.atlassian.net/rest/api/3/issue/10001",
    "fields": {
        "summary": "Test issue",
        "status": {
            "id": "1",
            "name": "To Do",
            "statusCategory": {"id": 2, "key": "new", "name": "To Do", "colorName": "blue-gray"},
        },
        "issuetype": {"id": "10001", "name": "Task"},
        "project": {"id": "10000", "key": "PROJ", "name": "Project"},
        "labels": [],
    },
}


class TestListProjects:
    async def test_returns_projects(self) -> None:
        mock_http = _make_mock_http()
        mock_http.get.return_value = [
            {"id": "1", "key": "PROJ", "name": "Project", "projectTypeKey": "software"},
            {"id": "2", "key": "OPS", "name": "Operations"},
        ]
        client = JiraClient(http=mock_http, project="PROJ")
        result = await client.list_projects()

        assert len(result) == 2
        assert isinstance(result[0], JiraProject)
        assert result[0].key == "PROJ"
        assert result[0].project_type_key == "software"
        mock_http.get.assert_called_once_with("/rest/api/3/project")


class TestListIssueTypes:
    async def test_returns_issue_types(self) -> None:
        mock_http = _make_mock_http()
        mock_http.get.return_value = {
            "issueTypes": [
                {"id": "1", "name": "Task"},
                {"id": "2", "name": "Bug", "subtask": False},
            ]
        }
        client = JiraClient(http=mock_http, project="PROJ")
        result = await client.list_issue_types()

        assert len(result) == 2
        assert isinstance(result[0], IssueType)
        assert result[0].name == "Task"
        mock_http.get.assert_called_once_with("/rest/api/3/issue/createmeta/PROJ/issuetypes")

    async def test_values_key_fallback(self) -> None:
        mock_http = _make_mock_http()
        mock_http.get.return_value = {"values": [{"id": "1", "name": "Story"}]}
        client = JiraClient(http=mock_http, project="PROJ")
        result = await client.list_issue_types()
        assert len(result) == 1
        assert result[0].name == "Story"

    async def test_no_project_raises(self) -> None:
        mock_http = _make_mock_http()
        client = JiraClient(http=mock_http, project="")
        with pytest.raises(ValidationError, match="No project"):
            await client.list_issue_types()


class TestCreateIssue:
    async def test_creates_and_fetches(self) -> None:
        mock_http = _make_mock_http()
        mock_http.post.return_value = {"id": "10001", "key": "PROJ-42", "self": "https://site.atlassian.net/rest/api/3/issue/10001"}
        mock_http.get.return_value = SAMPLE_ISSUE_API

        client = JiraClient(http=mock_http, project="PROJ")
        result = await client.create_issue("Test issue")

        assert isinstance(result, JiraIssue)
        assert result.key == "PROJ-42"
        # Verify POST was called with correct body
        call_args = mock_http.post.call_args
        assert call_args[0][0] == "/rest/api/3/issue"
        body = call_args[1]["json"]
        assert body["fields"]["summary"] == "Test issue"
        assert body["fields"]["project"] == {"key": "PROJ"}
        assert body["fields"]["issuetype"] == {"name": "Task"}

    async def test_epic_resolution(self) -> None:
        mock_http = _make_mock_http()
        mock_http.post.return_value = {"id": "1", "key": "PROJ-1", "self": "url"}
        mock_http.get.return_value = SAMPLE_ISSUE_API

        client = JiraClient(http=mock_http, project="PROJ", epic_map={"frontend": "PROJ-9"})
        await client.create_issue("Task", epic="frontend")

        body = mock_http.post.call_args[1]["json"]
        assert body["fields"]["parent"] == {"key": "PROJ-9"}

    async def test_epic_passthrough(self) -> None:
        """When epic is not in the map, use it as-is."""
        mock_http = _make_mock_http()
        mock_http.post.return_value = {"id": "1", "key": "PROJ-1", "self": "url"}
        mock_http.get.return_value = SAMPLE_ISSUE_API

        client = JiraClient(http=mock_http, project="PROJ", epic_map={})
        await client.create_issue("Task", epic="PROJ-99")

        body = mock_http.post.call_args[1]["json"]
        assert body["fields"]["parent"] == {"key": "PROJ-99"}

    async def test_no_project_raises(self) -> None:
        mock_http = _make_mock_http()
        client = JiraClient(http=mock_http, project="")
        with pytest.raises(ValidationError, match="No project"):
            await client.create_issue("Test")

    async def test_no_summary_raises(self) -> None:
        mock_http = _make_mock_http()
        client = JiraClient(http=mock_http, project="PROJ")
        with pytest.raises(ValidationError, match="summary"):
            await client.create_issue(None)


class TestGetIssue:
    async def test_returns_issue(self) -> None:
        mock_http = _make_mock_http()
        mock_http.get.return_value = SAMPLE_ISSUE_API

        client = JiraClient(http=mock_http, project="PROJ")
        result = await client.get_issue("PROJ-42")

        assert isinstance(result, JiraIssue)
        assert result.key == "PROJ-42"
        assert result.summary == "Test issue"
        mock_http.get.assert_called_once_with("/rest/api/3/issue/PROJ-42")


class TestSearchIssues:
    async def test_returns_issues(self) -> None:
        mock_http = _make_mock_http()
        mock_http.post.return_value = {
            "issues": [SAMPLE_ISSUE_API],
            "total": 1,
        }
        client = JiraClient(http=mock_http, project="PROJ")
        result = await client.search_issues("project = PROJ")

        assert len(result) == 1
        assert isinstance(result[0], JiraIssue)
        assert result[0].key == "PROJ-42"

        call_args = mock_http.post.call_args
        assert call_args[0][0] == "/rest/api/3/search/jql"
        body = call_args[1]["json"]
        assert body["jql"] == "project = PROJ"
        assert body["maxResults"] == 50

    async def test_empty_results(self) -> None:
        mock_http = _make_mock_http()
        mock_http.post.return_value = {"issues": [], "total": 0}
        client = JiraClient(http=mock_http, project="PROJ")
        result = await client.search_issues("project = NONE")
        assert result == []

    async def test_no_jql_raises(self) -> None:
        mock_http = _make_mock_http()
        client = JiraClient(http=mock_http, project="PROJ")
        with pytest.raises(ValidationError, match="jql"):
            await client.search_issues(None)


class TestTransitionIssue:
    async def test_transitions_by_name(self) -> None:
        mock_http = _make_mock_http()
        mock_http.get.return_value = {
            "transitions": [
                {"id": "11", "name": "To Do"},
                {"id": "21", "name": "In Progress"},
                {"id": "31", "name": "Done"},
            ]
        }
        mock_http.post.return_value = {}

        client = JiraClient(http=mock_http, project="PROJ")
        await client.transition_issue("PROJ-42", status="Done")

        mock_http.get.assert_called_once_with("/rest/api/3/issue/PROJ-42/transitions")
        call_args = mock_http.post.call_args
        assert call_args[0][0] == "/rest/api/3/issue/PROJ-42/transitions"
        assert call_args[1]["json"] == {"transition": {"id": "31"}}

    async def test_case_insensitive(self) -> None:
        mock_http = _make_mock_http()
        mock_http.get.return_value = {
            "transitions": [{"id": "21", "name": "In Progress"}]
        }
        mock_http.post.return_value = {}

        client = JiraClient(http=mock_http, project="PROJ")
        await client.transition_issue("PROJ-1", status="in progress")

        body = mock_http.post.call_args[1]["json"]
        assert body == {"transition": {"id": "21"}}

    async def test_not_found_raises(self) -> None:
        mock_http = _make_mock_http()
        mock_http.get.return_value = {
            "transitions": [{"id": "11", "name": "To Do"}]
        }
        client = JiraClient(http=mock_http, project="PROJ")
        with pytest.raises(ValidationError, match="No transition"):
            await client.transition_issue("PROJ-1", status="Nonexistent")


class TestAddComment:
    async def test_posts_adf_body(self) -> None:
        mock_http = _make_mock_http()
        mock_http.post.return_value = {"id": "100"}

        client = JiraClient(http=mock_http, project="PROJ")
        await client.add_comment("PROJ-42", body="Hello world")

        call_args = mock_http.post.call_args
        assert call_args[0][0] == "/rest/api/3/issue/PROJ-42/comment"
        payload = call_args[1]["json"]
        assert payload["body"]["type"] == "doc"
        assert payload["body"]["content"][0]["content"][0]["text"] == "Hello world"


class TestListComments:
    async def test_returns_comments(self) -> None:
        mock_http = _make_mock_http()
        mock_http.get.return_value = {
            "comments": [
                {"id": "100", "body": "First comment", "author": {"accountId": "u1", "displayName": "Alice"}},
                {"id": "101", "body": "Second comment"},
            ]
        }
        client = JiraClient(http=mock_http, project="PROJ")
        result = await client.list_comments("PROJ-42")

        assert len(result) == 2
        assert isinstance(result[0], Comment)
        assert result[0].id == "100"
        assert result[0].author is not None
        assert result[0].author.display_name == "Alice"
        mock_http.get.assert_called_once_with("/rest/api/3/issue/PROJ-42/comment")


class TestEpicMapLoading:
    def test_from_env_var(self) -> None:
        with patch.dict(os.environ, {"PYACLI_EPIC_MAP": "frontend:PROJ-9,backend:PROJ-23"}):
            mock_http = _make_mock_http()
            client = JiraClient(http=mock_http, project="PROJ", epic_map=None)
            # Force reload since we passed None
            client._epic_map = JiraClient._load_epic_map()
            assert client.epics == {"frontend": "PROJ-9", "backend": "PROJ-23"}

    def test_empty_env_var(self) -> None:
        with patch.dict(os.environ, {"PYACLI_EPIC_MAP": ""}, clear=False):
            result = JiraClient._load_epic_map()
            assert result == {}

    def test_missing_env_var(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            result = JiraClient._load_epic_map()
            assert result == {}


class TestMissingProject:
    async def test_create_issue_no_project(self) -> None:
        mock_http = _make_mock_http()
        client = JiraClient(http=mock_http, project="")
        with pytest.raises(ValidationError, match="No project"):
            await client.create_issue("test")

    async def test_list_issue_types_no_project(self) -> None:
        mock_http = _make_mock_http()
        client = JiraClient(http=mock_http, project="")
        with pytest.raises(ValidationError, match="No project"):
            await client.list_issue_types()
