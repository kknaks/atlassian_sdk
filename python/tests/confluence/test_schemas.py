from __future__ import annotations

import pytest
from pydantic import ValidationError

from atlassian_sdk.confluence.schemas import (
    CreateCommentRequest,
    CreatePageRequest,
    SearchConfluenceRequest,
    UpdatePageRequest,
)


class TestCreatePageRequest:
    """Tests for the CreatePageRequest schema."""

    def test_to_request_body(self) -> None:
        req = CreatePageRequest(
            space_id="1", title="My Page", body="<p>Hello</p>"
        )
        result = req.to_request_body()
        assert result["spaceId"] == "1"
        assert result["title"] == "My Page"
        assert result["body"]["representation"] == "storage"
        assert result["body"]["value"] == "<p>Hello</p>"
        assert result["status"] == "current"
        assert "parentId" not in result

    def test_to_request_body_with_parent(self) -> None:
        req = CreatePageRequest(
            space_id="1", title="Child", body="<p>x</p>", parent_id="50"
        )
        result = req.to_request_body()
        assert result["parentId"] == "50"

    def test_extra_fields_forbidden(self) -> None:
        with pytest.raises(ValidationError):
            CreatePageRequest(
                space_id="1", title="T", body="B", unknown="bad"
            )

    def test_optional_parent_id(self) -> None:
        req = CreatePageRequest(space_id="1", title="T", body="B")
        assert req.parent_id is None


class TestUpdatePageRequest:
    """Tests for the UpdatePageRequest schema."""

    def test_to_request_body(self) -> None:
        req = UpdatePageRequest(
            title="Updated", body="<p>new</p>", version_number=2
        )
        result = req.to_request_body("100")
        assert result["id"] == "100"
        assert result["title"] == "Updated"
        assert result["body"]["representation"] == "storage"
        assert result["body"]["value"] == "<p>new</p>"
        assert result["version"]["number"] == 2
        assert result["status"] == "current"

    def test_extra_fields_forbidden(self) -> None:
        with pytest.raises(ValidationError):
            UpdatePageRequest(
                title="T", body="B", version_number=1, extra="bad"
            )


class TestCreateCommentRequest:
    """Tests for the CreateCommentRequest schema."""

    def test_to_request_body(self) -> None:
        req = CreateCommentRequest(body="<p>comment</p>")
        result = req.to_request_body()
        assert result["body"]["representation"] == "storage"
        assert result["body"]["value"] == "<p>comment</p>"

    def test_extra_fields_forbidden(self) -> None:
        with pytest.raises(ValidationError):
            CreateCommentRequest(body="x", extra="bad")


class TestSearchConfluenceRequest:
    """Tests for the SearchConfluenceRequest schema."""

    def test_to_query_params(self) -> None:
        req = SearchConfluenceRequest(cql="type=page")
        params = req.to_query_params()
        assert params["cql"] == "type=page"
        assert params["limit"] == "25"

    def test_custom_limit(self) -> None:
        req = SearchConfluenceRequest(cql="space=DEV", limit=10)
        params = req.to_query_params()
        assert params["limit"] == "10"

    def test_extra_fields_forbidden(self) -> None:
        with pytest.raises(ValidationError):
            SearchConfluenceRequest(cql="x", extra="bad")
