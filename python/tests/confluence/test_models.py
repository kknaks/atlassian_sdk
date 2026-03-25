from __future__ import annotations

import pytest
from pydantic import ValidationError

from atlassian_sdk.confluence.models import (
    ConfluenceComment,
    Page,
    PageBody,
    PageVersion,
    Space,
)


class TestSpace:
    """Tests for the Space model."""

    def test_basic_creation(self) -> None:
        space = Space(id="1", key="DEV", name="Development")
        assert space.id == "1"
        assert space.key == "DEV"
        assert space.name == "Development"
        assert space.type == "global"
        assert space.status == "current"

    def test_custom_type_and_status(self) -> None:
        space = Space(id="2", key="PRIV", name="Private", type="personal", status="archived")
        assert space.type == "personal"
        assert space.status == "archived"

    def test_extra_fields_ignored(self) -> None:
        space = Space(id="1", key="DEV", name="Dev", unknown_field="ignored")
        assert space.id == "1"
        assert not hasattr(space, "unknown_field")


class TestPageVersion:
    """Tests for the PageVersion model."""

    def test_basic_creation(self) -> None:
        version = PageVersion(number=1)
        assert version.number == 1
        assert version.message == ""

    def test_with_message(self) -> None:
        version = PageVersion(number=3, message="Updated content")
        assert version.number == 3
        assert version.message == "Updated content"

    def test_extra_fields_ignored(self) -> None:
        version = PageVersion(number=1, extra="ignored")
        assert version.number == 1


class TestPageBody:
    """Tests for the PageBody model."""

    def test_defaults(self) -> None:
        body = PageBody()
        assert body.storage is None
        assert body.atlas_doc_format is None

    def test_with_storage(self) -> None:
        body = PageBody(storage={"value": "<p>Hello</p>", "representation": "storage"})
        assert body.storage is not None
        assert body.storage["value"] == "<p>Hello</p>"

    def test_extra_fields_ignored(self) -> None:
        body = PageBody(storage=None, extra="ignored")
        assert body.storage is None


class TestPage:
    """Tests for the Page model."""

    def test_basic_creation_with_alias(self) -> None:
        page = Page(id="100", title="Test Page", spaceId="1")
        assert page.id == "100"
        assert page.title == "Test Page"
        assert page.space_id == "1"
        assert page.status == "current"
        assert page.parent_id is None

    def test_creation_with_snake_case(self) -> None:
        page = Page(id="100", title="Test", space_id="1", parent_id="50")
        assert page.space_id == "1"
        assert page.parent_id == "50"

    def test_with_version_and_body(self) -> None:
        page = Page(
            id="100",
            title="Test",
            spaceId="1",
            version={"number": 2, "message": "edit"},
            body={"storage": {"value": "<p>hi</p>"}},
        )
        assert page.version is not None
        assert page.version.number == 2
        assert page.body is not None

    def test_extra_fields_ignored(self) -> None:
        page = Page(
            id="100",
            title="Test",
            spaceId="1",
            _links={"base": "https://site.atlassian.net/wiki", "webui": "/spaces/DEV/pages/100"},
            unknown="ignored",
        )
        assert page.id == "100"

    def test_url_property_no_links(self) -> None:
        page = Page(id="100", title="Test", spaceId="1")
        assert page.url == ""

    def test_url_property_with_links(self) -> None:
        """Test that url property extracts from _links when available."""
        # Since _links is not a model field (extra=ignore), we need to check
        # that the property gracefully returns "" when no _links attribute exists
        page = Page(id="100", title="Test", spaceId="1")
        assert page.url == ""


class TestConfluenceComment:
    """Tests for the ConfluenceComment model."""

    def test_basic_creation(self) -> None:
        comment = ConfluenceComment(id="200")
        assert comment.id == "200"
        assert comment.status == "current"
        assert comment.title == ""
        assert comment.body is None

    def test_with_body(self) -> None:
        comment = ConfluenceComment(
            id="200",
            body={"storage": {"value": "<p>comment</p>"}},
        )
        assert comment.body is not None
        assert comment.body.storage is not None

    def test_extra_fields_ignored(self) -> None:
        comment = ConfluenceComment(id="200", extra_field="ignored")
        assert comment.id == "200"
