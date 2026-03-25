"""Atlassian SDK — Python async client for Jira and Confluence REST APIs."""
from __future__ import annotations

__version__ = "0.0.0"

from atlassian_sdk.auth import BasicAuth
from atlassian_sdk.exceptions import (
    ApiError,
    AuthError,
    NotFoundError,
    RateLimitError,
    SdkError,
    TimeoutError,
    ValidationError,
)
from atlassian_sdk.http import AsyncHttpClient
from atlassian_sdk.jira.client import JiraClient
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
from atlassian_sdk.jira.schemas import (
    CreateIssueRequest,
    SearchIssuesRequest,
    TransitionIssueRequest,
)
from atlassian_sdk.confluence.client import ConfluenceClient
from atlassian_sdk.confluence.models import (
    ConfluenceComment,
    Page,
    PageBody,
    PageVersion,
    Space,
)
from atlassian_sdk.confluence.schemas import (
    CreateCommentRequest,
    CreatePageRequest,
    SearchConfluenceRequest,
    UpdatePageRequest,
)

__all__ = [
    # Version
    "__version__",
    # Auth
    "BasicAuth",
    # HTTP
    "AsyncHttpClient",
    # Exceptions
    "SdkError",
    "ApiError",
    "AuthError",
    "NotFoundError",
    "RateLimitError",
    "TimeoutError",
    "ValidationError",
    # Jira
    "JiraClient",
    "JiraIssue",
    "JiraProject",
    "IssueType",
    "Status",
    "StatusCategory",
    "Priority",
    "User",
    "Project",
    "ParentRef",
    "Transition",
    "Comment",
    "CreateIssueRequest",
    "SearchIssuesRequest",
    "TransitionIssueRequest",
    # Confluence
    "ConfluenceClient",
    "Space",
    "PageVersion",
    "PageBody",
    "Page",
    "ConfluenceComment",
    "CreatePageRequest",
    "UpdatePageRequest",
    "CreateCommentRequest",
    "SearchConfluenceRequest",
]
