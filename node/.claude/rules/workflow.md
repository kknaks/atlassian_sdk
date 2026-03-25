# Workflow Rules

## Implementation order
1. Implement one file
2. Write tests for that file
3. Verify tests pass
4. Move to next file

## Documentation first
- If implementation conflicts with design docs, update docs before writing code
- REST API endpoints must match Atlassian REST API v3 (Jira) / v2 (Confluence) docs

## Code size limits
- Functions: 50 lines max (recommended)
- Files: 300 lines max (recommended)
- No magic numbers — use constants or parameters

## Forbidden
- No `console.log()` — use structured logging or remove
- No hardcoded URLs or file paths
- No CommonJS `require()` — ESM only
