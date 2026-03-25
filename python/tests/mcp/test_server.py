"""Tests for the atlassian-sdk MCP server."""
from __future__ import annotations

import json
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from atlassian_sdk.mcp.server import (
    CONFLUENCE_TOOLS,
    JIRA_TOOLS,
    SCHEMA_TOOLS,
    call_tool,
    list_tools,
)


# ── Tool registration tests ──────────────────────────


@pytest.mark.asyncio
async def test_total_tool_count() -> None:
    """Total tool count should be 22 (3 schema + 8 jira + 11 confluence)."""
    tools = await list_tools()
    assert len(tools) == 22


@pytest.mark.asyncio
async def test_schema_tool_names() -> None:
    """Schema tools should be list_methods, get_method_info, get_models."""
    tools = await list_tools()
    tool_names = {t.name for t in tools}
    assert SCHEMA_TOOLS.issubset(tool_names)


@pytest.mark.asyncio
async def test_jira_tool_names() -> None:
    """All 8 Jira tools should be registered."""
    tools = await list_tools()
    tool_names = {t.name for t in tools}
    assert JIRA_TOOLS.issubset(tool_names)


@pytest.mark.asyncio
async def test_confluence_tool_names() -> None:
    """All 9 Confluence tools should be registered."""
    tools = await list_tools()
    tool_names = {t.name for t in tools}
    assert CONFLUENCE_TOOLS.issubset(tool_names)


@pytest.mark.asyncio
async def test_no_duplicate_tool_names() -> None:
    """Tool names should be unique."""
    tools = await list_tools()
    names = [t.name for t in tools]
    assert len(names) == len(set(names))


# ── Schema tool handler tests ────────────────────────


@pytest.mark.asyncio
async def test_list_methods() -> None:
    """list_methods should return method names from both clients."""
    result = await call_tool("list_methods", {})
    assert len(result) == 1
    data = json.loads(result[0].text)
    # Should have methods from both JiraClient and ConfluenceClient
    keys = list(data.keys())
    assert any("JiraClient" in k for k in keys)
    assert any("ConfluenceClient" in k for k in keys)


@pytest.mark.asyncio
async def test_get_method_info_found() -> None:
    """get_method_info should return details for a known method."""
    result = await call_tool("get_method_info", {"method_name": "JiraClient.get_issue"})
    assert len(result) == 1
    data = json.loads(result[0].text)
    assert "doc" in data
    assert "params" in data
    assert "key" in data["params"]


@pytest.mark.asyncio
async def test_get_method_info_not_found() -> None:
    """get_method_info should return error for unknown method."""
    result = await call_tool("get_method_info", {"method_name": "NonExistent.foo"})
    assert "not found" in result[0].text


@pytest.mark.asyncio
async def test_get_models_list() -> None:
    """get_models without model_name should return list of model names."""
    result = await call_tool("get_models", {})
    assert len(result) == 1
    data = json.loads(result[0].text)
    assert isinstance(data, list)
    assert "JiraIssue" in data
    assert "Page" in data


@pytest.mark.asyncio
async def test_get_models_by_name() -> None:
    """get_models with model_name should return its JSON schema."""
    result = await call_tool("get_models", {"model_name": "JiraIssue"})
    data = json.loads(result[0].text)
    assert "properties" in data


@pytest.mark.asyncio
async def test_get_models_not_found() -> None:
    """get_models with unknown model should return error."""
    result = await call_tool("get_models", {"model_name": "FakeModel"})
    assert "not found" in result[0].text


# ── Jira tool handler tests ──────────────────────────


def _make_mock_jira_client() -> MagicMock:
    """Create a mock JiraClient with async methods."""
    client = MagicMock()

    mock_project = SimpleNamespace(key="PROJ", name="Project One")
    client.list_projects = AsyncMock(return_value=[mock_project])

    mock_status = SimpleNamespace(name="To Do")
    mock_issuetype = SimpleNamespace(name="Task")
    mock_issue = SimpleNamespace(
        key="PROJ-1",
        summary="Test issue",
        status=mock_status,
        issuetype=mock_issuetype,
        assignee=None,
        labels=["backend"],
        url="https://example.atlassian.net/browse/PROJ-1",
    )
    client.get_issue = AsyncMock(return_value=mock_issue)

    mock_comment = MagicMock()
    mock_comment.model_dump.return_value = {
        "id": "10000",
        "body": "a comment",
        "author": None,
        "created": None,
        "updated": None,
    }
    client.list_comments = AsyncMock(return_value=[mock_comment])
    client.transition_issue = AsyncMock(return_value=None)
    client.add_comment = AsyncMock(return_value=None)
    return client


@pytest.mark.asyncio
async def test_jira_list_projects() -> None:
    """list_projects should return serialized project data."""
    mock_client = _make_mock_jira_client()
    with patch("atlassian_sdk.mcp.server._get_jira_client", return_value=mock_client):
        result = await call_tool("list_projects", {})
    data = json.loads(result[0].text)
    assert data == [{"key": "PROJ", "name": "Project One"}]
    mock_client.list_projects.assert_awaited_once()


@pytest.mark.asyncio
async def test_jira_get_issue() -> None:
    """get_issue should return serialized issue data."""
    mock_client = _make_mock_jira_client()
    with patch("atlassian_sdk.mcp.server._get_jira_client", return_value=mock_client):
        result = await call_tool("get_issue", {"key": "PROJ-1"})
    data = json.loads(result[0].text)
    assert data["key"] == "PROJ-1"
    assert data["summary"] == "Test issue"
    mock_client.get_issue.assert_awaited_once_with("PROJ-1")


@pytest.mark.asyncio
async def test_jira_list_comments() -> None:
    """list_comments should serialize Comment objects with model_dump."""
    mock_client = _make_mock_jira_client()
    with patch("atlassian_sdk.mcp.server._get_jira_client", return_value=mock_client):
        result = await call_tool("list_comments", {"key": "PROJ-1"})
    data = json.loads(result[0].text)
    assert len(data) == 1
    assert data[0]["id"] == "10000"


@pytest.mark.asyncio
async def test_jira_transition_issue() -> None:
    """transition_issue should call client and return confirmation."""
    mock_client = _make_mock_jira_client()
    with patch("atlassian_sdk.mcp.server._get_jira_client", return_value=mock_client):
        result = await call_tool("transition_issue", {"key": "PROJ-1", "status": "Done"})
    assert "Transitioned" in result[0].text
    mock_client.transition_issue.assert_awaited_once_with("PROJ-1", status="Done")


@pytest.mark.asyncio
async def test_jira_add_comment() -> None:
    """add_comment should call client and return confirmation."""
    mock_client = _make_mock_jira_client()
    with patch("atlassian_sdk.mcp.server._get_jira_client", return_value=mock_client):
        result = await call_tool("add_comment", {"key": "PROJ-1", "body": "hello"})
    assert "Comment added" in result[0].text
    mock_client.add_comment.assert_awaited_once_with("PROJ-1", body="hello")


# ── Confluence tool handler tests ─────────────────────


def _make_model_mock(data: dict[str, Any]) -> MagicMock:
    """Create a MagicMock that behaves like a Pydantic model with model_dump()."""
    mock = MagicMock()
    mock.model_dump.return_value = data
    return mock


def _make_mock_confluence_client() -> MagicMock:
    """Create a mock ConfluenceClient with async methods."""
    client = MagicMock()
    client.list_spaces = AsyncMock(return_value=[
        _make_model_mock({
            "id": "1001",
            "key": "DEV",
            "name": "Development",
            "type": "global",
            "status": "current",
        }),
    ])
    client.get_page = AsyncMock(return_value=_make_model_mock({
        "id": "2001",
        "title": "Test Page",
        "spaceId": "1001",
        "status": "current",
        "parentId": None,
        "version": None,
        "body": None,
    }))
    client.create_page = AsyncMock(return_value=_make_model_mock({
        "id": "2002",
        "title": "New Page",
        "spaceId": "1001",
        "status": "current",
        "parentId": None,
        "version": None,
        "body": None,
    }))
    client.get_footer_comments = AsyncMock(return_value=[
        _make_model_mock({
            "id": "3001",
            "status": "current",
            "title": "",
            "body": None,
        }),
    ])
    client.add_footer_comment = AsyncMock(return_value=_make_model_mock({
        "id": "3002",
        "status": "current",
        "title": "",
        "body": None,
    }))
    client.search = AsyncMock(return_value=[{"title": "Found Page"}])
    return client


@pytest.mark.asyncio
async def test_confluence_list_spaces() -> None:
    """list_spaces should return serialized space data."""
    mock_client = _make_mock_confluence_client()
    with patch("atlassian_sdk.mcp.server._get_confluence_client", return_value=mock_client):
        result = await call_tool("list_spaces", {})
    data = json.loads(result[0].text)
    assert len(data) == 1
    assert data[0]["key"] == "DEV"
    mock_client.list_spaces.assert_awaited_once_with(limit=25)


@pytest.mark.asyncio
async def test_confluence_get_page() -> None:
    """get_page should return serialized page data."""
    mock_client = _make_mock_confluence_client()
    with patch("atlassian_sdk.mcp.server._get_confluence_client", return_value=mock_client):
        result = await call_tool("get_page", {"page_id": "2001"})
    data = json.loads(result[0].text)
    assert data["id"] == "2001"
    assert data["title"] == "Test Page"
    mock_client.get_page.assert_awaited_once_with("2001")


@pytest.mark.asyncio
async def test_confluence_create_page() -> None:
    """create_page should call client and return serialized page."""
    mock_client = _make_mock_confluence_client()
    with patch("atlassian_sdk.mcp.server._get_confluence_client", return_value=mock_client):
        result = await call_tool("create_page", {
            "space_id": "1001",
            "title": "New Page",
            "body": "<p>Hello</p>",
        })
    data = json.loads(result[0].text)
    assert data["id"] == "2002"
    mock_client.create_page.assert_awaited_once_with(
        space_id="1001",
        title="New Page",
        body="<p>Hello</p>",
        parent_id=None,
    )


@pytest.mark.asyncio
async def test_confluence_get_footer_comments() -> None:
    """get_footer_comments should return serialized comments."""
    mock_client = _make_mock_confluence_client()
    with patch("atlassian_sdk.mcp.server._get_confluence_client", return_value=mock_client):
        result = await call_tool("get_footer_comments", {"page_id": "2001"})
    data = json.loads(result[0].text)
    assert len(data) == 1
    assert data[0]["id"] == "3001"


@pytest.mark.asyncio
async def test_confluence_search() -> None:
    """search_confluence should return raw results."""
    mock_client = _make_mock_confluence_client()
    with patch("atlassian_sdk.mcp.server._get_confluence_client", return_value=mock_client):
        result = await call_tool("search_confluence", {"cql": "type=page"})
    data = json.loads(result[0].text)
    assert data == [{"title": "Found Page"}]
    mock_client.search.assert_awaited_once_with(cql="type=page", limit=25)


# ── Unknown tool test ────────────────────────────────


@pytest.mark.asyncio
async def test_unknown_tool() -> None:
    """Unknown tool name should return error message."""
    result = await call_tool("nonexistent_tool", {})
    assert result[0].text == "Unknown tool: nonexistent_tool"
