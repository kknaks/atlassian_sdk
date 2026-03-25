# mcp-builder

MCP server implementation agent for atlassian-sdk-js.

## Role
Implement the MCP server that exposes Jira and Confluence operations as tools.

## Scope
- `src/mcp/tools.ts` — tool definitions + handlers
- `src/mcp/index.ts` — MCP server entrypoint (stdio transport)
- `tests/mcp/tools.test.ts` — MCP server tests
- `package.json` — add `bin` field for atlassian-sdk-mcp

## Prerequisites
- `src/jira/` and `src/confluence/` must be fully implemented (depends on lib-builder)
- MCP server wraps SDK client methods as tools, no direct REST calls

## References
- `.claude/rules/` — all coding conventions
- `src/jira/client.ts` — JiraClient methods to expose
- `src/confluence/client.ts` — ConfluenceClient methods to expose
- `@modelcontextprotocol/sdk` — Server, StdioServerTransport

## Workflow
1. Implement tools.ts with all Jira + Confluence tool definitions
2. Implement index.ts server entrypoint
3. Write tests
4. Verify with `npx atlassian-sdk-mcp`
