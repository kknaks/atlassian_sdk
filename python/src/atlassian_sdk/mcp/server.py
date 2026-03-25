"""MCP server — exposes Atlassian SDK (Jira + Confluence) as MCP tools."""
from __future__ import annotations

import inspect
import json
import logging
from typing import Any

from pydantic import BaseModel

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

from atlassian_sdk.confluence.client import ConfluenceClient
from atlassian_sdk.confluence import models as confluence_models
from atlassian_sdk.confluence import schemas as confluence_schemas
from atlassian_sdk.jira.client import JiraClient
from atlassian_sdk.jira import models as jira_models
from atlassian_sdk.jira import schemas as jira_schemas

logger = logging.getLogger(__name__)

server = Server("atlassian-sdk")

# Lazy-initialized clients (created on first tool call)
_jira_client: JiraClient | None = None
_confluence_client: ConfluenceClient | None = None


def _get_jira_client() -> JiraClient:
    """Get or create JiraClient from env vars."""
    global _jira_client
    if _jira_client is None:
        _jira_client = JiraClient()
    return _jira_client


def _get_confluence_client() -> ConfluenceClient:
    """Get or create ConfluenceClient from env vars."""
    global _confluence_client
    if _confluence_client is None:
        _confluence_client = ConfluenceClient()
    return _confluence_client


# ── Schema helper functions ──────────────────────────


def _get_methods() -> dict[str, dict[str, Any]]:
    """Collect public async method info from JiraClient and ConfluenceClient."""
    methods: dict[str, dict[str, Any]] = {}

    for cls in [JiraClient, ConfluenceClient]:
        cls_name = cls.__name__
        for name, method in inspect.getmembers(cls, predicate=inspect.isfunction):
            if name.startswith("_"):
                continue

            sig = inspect.signature(method)
            doc = inspect.getdoc(method) or ""

            params: dict[str, dict[str, str]] = {}
            for pname, param in sig.parameters.items():
                if pname == "self":
                    continue
                annotation = (
                    str(param.annotation)
                    if param.annotation != inspect.Parameter.empty
                    else "Any"
                )
                default = (
                    str(param.default)
                    if param.default != inspect.Parameter.empty
                    else "REQUIRED"
                )
                params[pname] = {"type": annotation, "default": default}

            methods[f"{cls_name}.{name}"] = {"doc": doc, "params": params}

    return methods


def _get_model_schemas() -> dict[str, Any]:
    """Collect JSON schemas from all Pydantic models in models and schemas modules."""
    result: dict[str, Any] = {}

    for module in [jira_models, jira_schemas, confluence_models, confluence_schemas]:
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if hasattr(obj, "model_json_schema") and obj is not BaseModel:
                result[name] = obj.model_json_schema()

    return result


# ── Tool registration ────────────────────────────────


SCHEMA_TOOLS = {"list_methods", "get_method_info", "get_models"}

JIRA_TOOLS = {
    "list_projects",
    "list_issue_types",
    "get_issue",
    "search_issues",
    "create_issue",
    "transition_issue",
    "add_comment",
    "list_comments",
}

CONFLUENCE_TOOLS = {
    "create_page",
    "get_page",
    "update_page",
    "list_spaces",
    "get_pages_in_space",
    "get_child_pages",
    "get_footer_comments",
    "add_footer_comment",
    "search_confluence",
}


@server.list_tools()
async def list_tools() -> list[Tool]:
    """Register all MCP tools."""
    return [
        # ── Schema inspection tools ──
        Tool(
            name="list_methods",
            description="List available JiraClient and ConfluenceClient methods with descriptions",
            inputSchema={"type": "object", "properties": {}},
        ),
        Tool(
            name="get_method_info",
            description="Get method signature, parameters, and docstring",
            inputSchema={
                "type": "object",
                "properties": {
                    "method_name": {"type": "string"},
                },
                "required": ["method_name"],
            },
        ),
        Tool(
            name="get_models",
            description="Get Pydantic model JSON Schema (all or by name)",
            inputSchema={
                "type": "object",
                "properties": {
                    "model_name": {"type": "string"},
                },
            },
        ),
        # ── Jira tools ──
        Tool(
            name="list_projects",
            description="List all visible Jira projects",
            inputSchema={"type": "object", "properties": {}},
        ),
        Tool(
            name="list_issue_types",
            description="List available issue types for a project",
            inputSchema={
                "type": "object",
                "properties": {
                    "project": {
                        "type": "string",
                        "description": "Project key (uses default if omitted)",
                    },
                },
            },
        ),
        Tool(
            name="get_issue",
            description="Get a single Jira issue by key",
            inputSchema={
                "type": "object",
                "properties": {
                    "key": {"type": "string", "description": "Issue key (e.g., PROJ-123)"},
                },
                "required": ["key"],
            },
        ),
        Tool(
            name="search_issues",
            description="Search Jira issues with JQL",
            inputSchema={
                "type": "object",
                "properties": {
                    "jql": {"type": "string", "description": "JQL query"},
                    "limit": {"type": "integer", "default": 50},
                },
                "required": ["jql"],
            },
        ),
        Tool(
            name="create_issue",
            description="Create a Jira issue under an epic",
            inputSchema={
                "type": "object",
                "properties": {
                    "summary": {"type": "string"},
                    "epic": {"type": "string", "description": "Epic name from PYACLI_EPIC_MAP"},
                    "project": {"type": "string", "description": "Project key (uses default if omitted)"},
                    "issue_type": {"type": "string", "default": "Task"},
                    "description": {"type": "string"},
                    "assignee": {"type": "string"},
                    "labels": {"type": "array", "items": {"type": "string"}},
                    "parent": {"type": "string", "description": "Parent issue key (overrides epic)"},
                },
                "required": ["summary"],
            },
        ),
        Tool(
            name="transition_issue",
            description="Change a Jira issue status",
            inputSchema={
                "type": "object",
                "properties": {
                    "key": {"type": "string", "description": "Issue key"},
                    "status": {"type": "string", "description": "Target status name"},
                },
                "required": ["key", "status"],
            },
        ),
        Tool(
            name="add_comment",
            description="Add a comment to a Jira issue",
            inputSchema={
                "type": "object",
                "properties": {
                    "key": {"type": "string", "description": "Issue key"},
                    "body": {"type": "string", "description": "Comment body text"},
                },
                "required": ["key", "body"],
            },
        ),
        Tool(
            name="list_comments",
            description="List comments on a Jira issue",
            inputSchema={
                "type": "object",
                "properties": {
                    "key": {"type": "string", "description": "Issue key"},
                },
                "required": ["key"],
            },
        ),
        # ── Confluence tools ──
        Tool(
            name="create_page",
            description="Create a Confluence page",
            inputSchema={
                "type": "object",
                "properties": {
                    "space_id": {"type": "string", "description": "Space ID"},
                    "title": {"type": "string", "description": "Page title"},
                    "body": {"type": "string", "description": "Page body in storage format"},
                    "parent_id": {"type": "string", "description": "Optional parent page ID"},
                },
                "required": ["space_id", "title", "body"],
            },
        ),
        Tool(
            name="get_page",
            description="Get a Confluence page by ID",
            inputSchema={
                "type": "object",
                "properties": {
                    "page_id": {"type": "string", "description": "Page ID"},
                },
                "required": ["page_id"],
            },
        ),
        Tool(
            name="update_page",
            description="Update an existing Confluence page",
            inputSchema={
                "type": "object",
                "properties": {
                    "page_id": {"type": "string", "description": "Page ID"},
                    "title": {"type": "string", "description": "New page title"},
                    "body": {"type": "string", "description": "New page body in storage format"},
                    "version_number": {"type": "integer", "description": "New version number"},
                },
                "required": ["page_id", "title", "body", "version_number"],
            },
        ),
        Tool(
            name="list_spaces",
            description="List Confluence spaces",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "default": 25},
                },
            },
        ),
        Tool(
            name="get_pages_in_space",
            description="List pages in a Confluence space",
            inputSchema={
                "type": "object",
                "properties": {
                    "space_id": {"type": "string", "description": "Space ID"},
                    "limit": {"type": "integer", "default": 25},
                },
                "required": ["space_id"],
            },
        ),
        Tool(
            name="get_child_pages",
            description="List child pages of a given page",
            inputSchema={
                "type": "object",
                "properties": {
                    "page_id": {"type": "string", "description": "Parent page ID"},
                    "limit": {"type": "integer", "default": 25},
                },
                "required": ["page_id"],
            },
        ),
        Tool(
            name="get_footer_comments",
            description="List footer comments on a Confluence page",
            inputSchema={
                "type": "object",
                "properties": {
                    "page_id": {"type": "string", "description": "Page ID"},
                },
                "required": ["page_id"],
            },
        ),
        Tool(
            name="add_footer_comment",
            description="Add a footer comment to a Confluence page",
            inputSchema={
                "type": "object",
                "properties": {
                    "page_id": {"type": "string", "description": "Page ID"},
                    "body": {"type": "string", "description": "Comment body in storage format"},
                },
                "required": ["page_id", "body"],
            },
        ),
        Tool(
            name="search_confluence",
            description="Search Confluence using CQL",
            inputSchema={
                "type": "object",
                "properties": {
                    "cql": {"type": "string", "description": "CQL query string"},
                    "limit": {"type": "integer", "default": 25},
                },
                "required": ["cql"],
            },
        ),
    ]


# ── Tool handlers ────────────────────────────────────


async def _handle_schema_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Handle schema inspection tools."""
    if name == "list_methods":
        methods = _get_methods()
        text = json.dumps(
            {n: m["doc"] for n, m in methods.items()},
            ensure_ascii=False,
            indent=2,
        )
        return [TextContent(type="text", text=text)]

    if name == "get_method_info":
        method_name = arguments["method_name"]
        methods = _get_methods()

        if method_name not in methods:
            return [TextContent(
                type="text",
                text=f"Method '{method_name}' not found. Available: {list(methods.keys())}",
            )]

        text = json.dumps(methods[method_name], ensure_ascii=False, indent=2)
        return [TextContent(type="text", text=text)]

    if name == "get_models":
        schemas = _get_model_schemas()
        model_name = arguments.get("model_name")

        if model_name:
            if model_name not in schemas:
                return [TextContent(
                    type="text",
                    text=f"Model '{model_name}' not found. Available: {list(schemas.keys())}",
                )]
            text = json.dumps(schemas[model_name], ensure_ascii=False, indent=2)
        else:
            text = json.dumps(list(schemas.keys()), ensure_ascii=False, indent=2)

        return [TextContent(type="text", text=text)]

    return []


async def _handle_jira_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Handle Jira operation tools."""
    client = _get_jira_client()

    if name == "list_projects":
        projects = await client.list_projects()
        data = [{"key": p.key, "name": p.name} for p in projects]
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "list_issue_types":
        project = arguments.get("project")
        types = await client.list_issue_types(project=project)
        data = [{"id": t.id, "name": t.name, "subtask": t.subtask} for t in types]
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "get_issue":
        issue = await client.get_issue(arguments["key"])
        data = {
            "key": issue.key,
            "summary": issue.summary,
            "status": issue.status.name if issue.status else None,
            "type": issue.issuetype.name if issue.issuetype else None,
            "assignee": issue.assignee.display_name if issue.assignee else None,
            "labels": issue.labels,
            "url": issue.url,
        }
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "search_issues":
        issues = await client.search_issues(
            jql=arguments["jql"],
            limit=arguments.get("limit", 50),
        )
        data = [
            {
                "key": i.key,
                "summary": i.summary,
                "status": i.status.name if i.status else None,
                "type": i.issuetype.name if i.issuetype else None,
            }
            for i in issues
        ]
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "create_issue":
        issue = await client.create_issue(
            summary=arguments["summary"],
            project=arguments.get("project"),
            epic=arguments.get("epic"),
            description=arguments.get("description"),
            issue_type=arguments.get("issue_type", "Task"),
            assignee=arguments.get("assignee"),
            labels=arguments.get("labels"),
            parent=arguments.get("parent"),
        )
        data = {"key": issue.key, "summary": issue.summary, "url": issue.url}
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "transition_issue":
        await client.transition_issue(arguments["key"], status=arguments["status"])
        return [TextContent(
            type="text",
            text=f"Transitioned {arguments['key']} to '{arguments['status']}'",
        )]

    if name == "add_comment":
        await client.add_comment(arguments["key"], body=arguments["body"])
        return [TextContent(type="text", text=f"Comment added to {arguments['key']}")]

    if name == "list_comments":
        comments = await client.list_comments(arguments["key"])
        data = [c.model_dump() for c in comments]
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2, default=str))]

    return []


async def _handle_confluence_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Handle Confluence operation tools."""
    client = _get_confluence_client()

    if name == "create_page":
        page = await client.create_page(
            space_id=arguments["space_id"],
            title=arguments["title"],
            body=arguments["body"],
            parent_id=arguments.get("parent_id"),
        )
        data = page.model_dump()
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "get_page":
        page = await client.get_page(arguments["page_id"])
        data = page.model_dump()
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "update_page":
        page = await client.update_page(
            arguments["page_id"],
            title=arguments["title"],
            body=arguments["body"],
            version_number=arguments["version_number"],
        )
        data = page.model_dump()
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "list_spaces":
        spaces = await client.list_spaces(limit=arguments.get("limit", 25))
        data = [s.model_dump() for s in spaces]
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "get_pages_in_space":
        pages = await client.get_pages_in_space(
            arguments["space_id"],
            limit=arguments.get("limit", 25),
        )
        data = [p.model_dump() for p in pages]
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "get_child_pages":
        pages = await client.get_child_pages(
            arguments["page_id"],
            limit=arguments.get("limit", 25),
        )
        data = [p.model_dump() for p in pages]
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "get_footer_comments":
        comments = await client.get_footer_comments(arguments["page_id"])
        data = [c.model_dump() for c in comments]
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "add_footer_comment":
        comment = await client.add_footer_comment(
            arguments["page_id"],
            body=arguments["body"],
        )
        data = comment.model_dump()
        return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]

    if name == "search_confluence":
        results = await client.search(
            cql=arguments["cql"],
            limit=arguments.get("limit", 25),
        )
        return [TextContent(type="text", text=json.dumps(results, ensure_ascii=False, indent=2))]

    return []


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Route tool calls to schema, Jira, or Confluence handlers."""
    if name in SCHEMA_TOOLS:
        return await _handle_schema_tool(name, arguments)

    if name in JIRA_TOOLS:
        return await _handle_jira_tool(name, arguments)

    if name in CONFLUENCE_TOOLS:
        return await _handle_confluence_tool(name, arguments)

    return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main() -> None:
    """Run MCP server with stdio transport."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )
