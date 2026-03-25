# Allowed Tools

## CLI
- `poetry *` — install, build, run, add, remove
- `python *` — run scripts, py_compile, module execution
- `pytest *` — test execution
- `git *` — all git operations (push requires confirmation)

## MCP
- `mcp__atlassian__*` — all Atlassian MCP tools (reference for API behavior)

## Restrictions (always require user confirmation)
- `poetry publish` — PyPI release
- `git push --force` — force push
