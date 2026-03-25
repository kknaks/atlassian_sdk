from __future__ import annotations

import pytest
from pydantic import ValidationError as PydanticValidationError

from atlassian_sdk.jira.models import (
    Comment,
    IssueType,
    JiraIssue,
    JiraProject,
    ParentRef,
    Priority,
    Project,
    Status,
    StatusCategory,
    Transition,
    User,
)


class TestStatusCategory:
    def test_parse(self) -> None:
        data = {"id": 2, "key": "new", "name": "To Do", "colorName": "blue-gray", "extra": "ignored"}
        sc = StatusCategory(**data)
        assert sc.id == 2
        assert sc.key == "new"
        assert sc.name == "To Do"
        assert sc.color_name == "blue-gray"


class TestStatus:
    def test_parse(self) -> None:
        data = {
            "id": "10001",
            "name": "In Progress",
            "statusCategory": {"id": 4, "key": "indeterminate", "name": "In Progress", "colorName": "yellow"},
        }
        s = Status(**data)
        assert s.id == "10001"
        assert s.name == "In Progress"
        assert s.status_category.color_name == "yellow"


class TestIssueType:
    def test_parse(self) -> None:
        data = {"id": "10002", "name": "Bug", "subtask": True, "unknown": "field"}
        it = IssueType(**data)
        assert it.id == "10002"
        assert it.name == "Bug"
        assert it.subtask is True

    def test_default_subtask(self) -> None:
        it = IssueType(id="1", name="Task")
        assert it.subtask is False


class TestPriority:
    def test_parse(self) -> None:
        p = Priority(**{"id": "3", "name": "Medium", "iconUrl": "http://example.com"})
        assert p.id == "3"
        assert p.name == "Medium"


class TestUser:
    def test_parse(self) -> None:
        data = {"accountId": "abc123", "displayName": "Alice", "active": False, "emailAddress": "a@b.com"}
        u = User(**data)
        assert u.account_id == "abc123"
        assert u.display_name == "Alice"
        assert u.active is False

    def test_default_active(self) -> None:
        u = User(accountId="x", displayName="X")
        assert u.active is True


class TestProject:
    def test_parse(self) -> None:
        p = Project(**{"id": "10000", "key": "PROJ", "name": "My Project"})
        assert p.key == "PROJ"


class TestJiraProject:
    def test_parse(self) -> None:
        data = {"id": "10000", "key": "PROJ", "name": "My Project", "projectTypeKey": "software", "style": "next-gen", "extra": True}
        jp = JiraProject(**data)
        assert jp.project_type_key == "software"
        assert jp.style == "next-gen"

    def test_defaults(self) -> None:
        jp = JiraProject(id="1", key="K", name="N")
        assert jp.project_type_key == ""
        assert jp.style == ""


class TestParentRef:
    def test_parse(self) -> None:
        pr = ParentRef(**{"id": "100", "key": "PROJ-1", "fields": {"summary": "Epic"}})
        assert pr.key == "PROJ-1"
        assert pr.fields == {"summary": "Epic"}


class TestTransition:
    def test_parse_with_to(self) -> None:
        data = {
            "id": "21",
            "name": "Done",
            "to": {
                "id": "10002",
                "name": "Done",
                "statusCategory": {"id": 3, "key": "done", "name": "Done", "colorName": "green"},
            },
        }
        t = Transition(**data)
        assert t.id == "21"
        assert t.name == "Done"
        assert t.to is not None
        assert t.to.name == "Done"

    def test_parse_without_to(self) -> None:
        t = Transition(**{"id": "1", "name": "Start"})
        assert t.to is None


class TestComment:
    def test_parse(self) -> None:
        data = {
            "id": "10100",
            "body": "Hello world",
            "author": {"accountId": "u1", "displayName": "Bob"},
            "created": "2024-01-15T10:30:00.000+0000",
            "updated": "2024-01-15T10:30:00.000+0000",
            "extra_field": "ignored",
        }
        c = Comment(**data)
        assert c.id == "10100"
        assert c.body == "Hello world"
        assert c.author is not None
        assert c.author.display_name == "Bob"
        assert c.created is not None

    def test_adf_body(self) -> None:
        """Comment body can also be a dict (ADF format)."""
        adf = {"type": "doc", "version": 1, "content": []}
        c = Comment(id="1", body=adf)
        assert isinstance(c.body, dict)

    def test_minimal(self) -> None:
        c = Comment(id="1")
        assert c.body is None
        assert c.author is None


class TestJiraIssue:
    SAMPLE_API_RESPONSE: dict = {
        "id": "10001",
        "key": "PROJ-42",
        "self": "https://site.atlassian.net/rest/api/3/issue/10001",
        "fields": {
            "summary": "Fix the bug",
            "description": None,
            "status": {
                "id": "1",
                "name": "To Do",
                "statusCategory": {"id": 2, "key": "new", "name": "To Do", "colorName": "blue-gray"},
            },
            "issuetype": {"id": "10001", "name": "Task"},
            "priority": {"id": "3", "name": "Medium"},
            "assignee": {"accountId": "user1", "displayName": "Alice"},
            "creator": {"accountId": "user2", "displayName": "Bob"},
            "reporter": {"accountId": "user2", "displayName": "Bob"},
            "project": {"id": "10000", "key": "PROJ", "name": "My Project"},
            "labels": ["backend", "urgent"],
            "created": "2024-01-01T00:00:00.000+0000",
            "updated": "2024-01-02T00:00:00.000+0000",
            "parent": {"id": "10000", "key": "PROJ-1"},
            "duedate": "2024-02-01",
            "resolution": None,
        },
    }

    def test_from_api(self) -> None:
        issue = JiraIssue.from_api(self.SAMPLE_API_RESPONSE)
        assert issue.id == "10001"
        assert issue.key == "PROJ-42"
        assert issue.self_url == "https://site.atlassian.net/rest/api/3/issue/10001"
        assert issue.summary == "Fix the bug"
        assert issue.status is not None
        assert issue.status.name == "To Do"
        assert issue.issuetype is not None
        assert issue.issuetype.name == "Task"
        assert issue.assignee is not None
        assert issue.assignee.display_name == "Alice"
        assert issue.project is not None
        assert issue.project.key == "PROJ"
        assert issue.labels == ["backend", "urgent"]
        assert issue.parent is not None
        assert issue.parent.key == "PROJ-1"
        assert issue.duedate == "2024-02-01"

    def test_url_property(self) -> None:
        issue = JiraIssue.from_api(self.SAMPLE_API_RESPONSE)
        assert issue.url == "https://site.atlassian.net/browse/PROJ-42"

    def test_url_empty_when_no_self(self) -> None:
        issue = JiraIssue(id="1", key="X-1")
        assert issue.url == ""

    def test_extra_fields_ignored(self) -> None:
        data = {
            "id": "1",
            "key": "X-1",
            "fields": {
                "summary": "test",
                "customfield_10001": "should be ignored",
            },
        }
        issue = JiraIssue.from_api(data)
        assert issue.summary == "test"

    def test_minimal_from_api(self) -> None:
        data = {"id": "1", "key": "X-1", "fields": {}}
        issue = JiraIssue.from_api(data)
        assert issue.key == "X-1"
        assert issue.summary == ""
        assert issue.status is None
