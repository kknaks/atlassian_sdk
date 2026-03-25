# mcp-builder

MCP server implementation agent for atlassian-sdk-py.

## Role
Implement the MCP server that exposes Jira and Confluence operations as tools.

## Scope
- `src/atlassian_sdk/mcp/server.py` — MCP server with Jira + Confluence tools
- `src/atlassian_sdk/mcp/__init__.py` — `python -m atlassian_sdk.mcp` entrypoint
- `tests/mcp/test_server.py` — MCP server tests
- `pyproject.toml` — add `[project.scripts]` for atlassian-sdk-mcp

## Prerequisites
- `src/atlassian_sdk/jira/` and `src/atlassian_sdk/confluence/` must be fully implemented (depends on lib-builder)
- MCP server wraps SDK client methods as tools, no direct REST calls

## References
- `.claude/rules/` — all coding conventions
- `src/atlassian_sdk/jira/client.py` — JiraClient methods to expose
- `src/atlassian_sdk/confluence/client.py` — ConfluenceClient methods to expose
- MCP SDK (`mcp` package) — Server, stdio_server, Tool, TextContent

## Workflow
1. Implement server.py with all Jira + Confluence tools
2. Implement __init__.py entrypoint
3. Write tests
4. Verify with `poetry run python -m atlassian_sdk.mcp`
