from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from atlassian_sdk.confluence.client import ConfluenceClient
from atlassian_sdk.confluence.models import ConfluenceComment, Page, Space


def _make_page_data(
    page_id: str = "100",
    title: str = "Test Page",
    space_id: str = "1",
    status: str = "current",
) -> dict:
    """Build a minimal page response dict."""
    return {
        "id": page_id,
        "title": title,
        "spaceId": space_id,
        "status": status,
        "parentId": None,
        "version": {"number": 1, "message": ""},
        "body": {"storage": {"value": "<p>Hello</p>", "representation": "storage"}},
    }


def _make_space_data(
    space_id: str = "1", key: str = "DEV", name: str = "Development"
) -> dict:
    """Build a minimal space response dict."""
    return {"id": space_id, "key": key, "name": name, "type": "global", "status": "current"}


def _make_comment_data(comment_id: str = "200") -> dict:
    """Build a minimal comment response dict."""
    return {
        "id": comment_id,
        "status": "current",
        "title": "",
        "body": {"storage": {"value": "<p>comment</p>", "representation": "storage"}},
    }


@pytest.fixture
def mock_http() -> AsyncMock:
    """Create a mock AsyncHttpClient."""
    return AsyncMock()


@pytest.fixture
def client(mock_http: AsyncMock) -> ConfluenceClient:
    """Create a ConfluenceClient with a mocked HTTP client."""
    return ConfluenceClient(http=mock_http)


class TestCreatePage:
    """Tests for ConfluenceClient.create_page."""

    async def test_create_page(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.post.return_value = _make_page_data()
        page = await client.create_page(space_id="1", title="Test Page", body="<p>Hello</p>")

        assert isinstance(page, Page)
        assert page.id == "100"
        assert page.title == "Test Page"
        mock_http.post.assert_called_once()
        call_args = mock_http.post.call_args
        assert call_args[0][0] == "/wiki/api/v2/pages"

    async def test_create_page_with_parent(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.post.return_value = _make_page_data()
        await client.create_page(space_id="1", title="Child", body="<p>x</p>", parent_id="50")

        payload = mock_http.post.call_args[1]["json"]
        assert payload["parentId"] == "50"


class TestGetPage:
    """Tests for ConfluenceClient.get_page."""

    async def test_get_page(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.get.return_value = _make_page_data()
        page = await client.get_page("100")

        assert isinstance(page, Page)
        assert page.id == "100"
        mock_http.get.assert_called_once_with(
            "/wiki/api/v2/pages/100",
            params={"body-format": "storage"},
        )


class TestUpdatePage:
    """Tests for ConfluenceClient.update_page."""

    async def test_update_page(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.put.return_value = _make_page_data(title="Updated")
        page = await client.update_page(
            "100", title="Updated", body="<p>new</p>", version_number=2
        )

        assert isinstance(page, Page)
        mock_http.put.assert_called_once()
        call_args = mock_http.put.call_args
        assert call_args[0][0] == "/wiki/api/v2/pages/100"
        payload = call_args[1]["json"]
        assert payload["id"] == "100"
        assert payload["version"]["number"] == 2


class TestListSpaces:
    """Tests for ConfluenceClient.list_spaces."""

    async def test_list_spaces(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.get.return_value = {"results": [_make_space_data(), _make_space_data("2", "TEAM", "Team")]}
        spaces = await client.list_spaces()

        assert len(spaces) == 2
        assert all(isinstance(s, Space) for s in spaces)
        mock_http.get.assert_called_once_with(
            "/wiki/api/v2/spaces", params={"limit": "25"}
        )

    async def test_list_spaces_custom_limit(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.get.return_value = {"results": []}
        await client.list_spaces(limit=10)

        mock_http.get.assert_called_once_with(
            "/wiki/api/v2/spaces", params={"limit": "10"}
        )


class TestGetPagesInSpace:
    """Tests for ConfluenceClient.get_pages_in_space."""

    async def test_get_pages_in_space(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.get.return_value = {"results": [_make_page_data()]}
        pages = await client.get_pages_in_space("1")

        assert len(pages) == 1
        assert isinstance(pages[0], Page)
        mock_http.get.assert_called_once_with(
            "/wiki/api/v2/spaces/1/pages",
            params={"limit": "25"},
        )


class TestGetChildPages:
    """Tests for ConfluenceClient.get_child_pages."""

    async def test_get_child_pages(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.get.return_value = {"results": [_make_page_data("101")]}
        pages = await client.get_child_pages("100")

        assert len(pages) == 1
        mock_http.get.assert_called_once_with(
            "/wiki/api/v2/pages/100/children",
            params={"limit": "25"},
        )


class TestGetFooterComments:
    """Tests for ConfluenceClient.get_footer_comments."""

    async def test_get_footer_comments(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.get.return_value = {"results": [_make_comment_data()]}
        comments = await client.get_footer_comments("100")

        assert len(comments) == 1
        assert isinstance(comments[0], ConfluenceComment)
        mock_http.get.assert_called_once_with(
            "/wiki/api/v2/pages/100/footer-comments"
        )


class TestAddFooterComment:
    """Tests for ConfluenceClient.add_footer_comment."""

    async def test_add_footer_comment(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.post.return_value = _make_comment_data()
        comment = await client.add_footer_comment("100", body="<p>comment</p>")

        assert isinstance(comment, ConfluenceComment)
        mock_http.post.assert_called_once()
        call_args = mock_http.post.call_args
        assert call_args[0][0] == "/wiki/api/v2/pages/100/footer-comments"
        payload = call_args[1]["json"]
        assert payload["body"]["value"] == "<p>comment</p>"


class TestGetInlineComments:
    """Tests for ConfluenceClient.get_inline_comments."""

    async def test_get_inline_comments(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.get.return_value = {"results": [_make_comment_data()]}
        comments = await client.get_inline_comments("100")

        assert len(comments) == 1
        assert isinstance(comments[0], ConfluenceComment)
        mock_http.get.assert_called_once_with(
            "/wiki/api/v2/pages/100/inline-comments"
        )


class TestAddInlineComment:
    """Tests for ConfluenceClient.add_inline_comment."""

    async def test_add_inline_comment(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.post.return_value = _make_comment_data()
        comment = await client.add_inline_comment("100", body="<p>inline</p>")

        assert isinstance(comment, ConfluenceComment)
        call_args = mock_http.post.call_args
        assert call_args[0][0] == "/wiki/api/v2/pages/100/inline-comments"


class TestSearch:
    """Tests for ConfluenceClient.search."""

    async def test_search(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        mock_http.get.return_value = {"results": [{"title": "Result 1"}]}
        results = await client.search("type=page")

        assert len(results) == 1
        assert results[0]["title"] == "Result 1"
        mock_http.get.assert_called_once_with(
            "/wiki/rest/api/search",
            params={"cql": "type=page", "limit": "25"},
        )

    async def test_search_uses_v1_endpoint(self, client: ConfluenceClient, mock_http: AsyncMock) -> None:
        """Verify search uses /wiki/rest/api/ (v1), not /wiki/api/v2/."""
        mock_http.get.return_value = {"results": []}
        await client.search("space=DEV", limit=10)

        call_args = mock_http.get.call_args
        assert call_args[0][0] == "/wiki/rest/api/search"
        assert call_args[1]["params"]["limit"] == "10"
