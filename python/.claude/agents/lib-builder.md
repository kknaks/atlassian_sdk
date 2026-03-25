# lib-builder

Library implementation agent for atlassian-sdk-py core.

## Role
Implement and test the SDK library code under `src/atlassian_sdk/`.

## Scope
- `src/atlassian_sdk/exceptions.py` — exception hierarchy
- `src/atlassian_sdk/auth.py` — BasicAuth credential holder
- `src/atlassian_sdk/http.py` — httpx.AsyncClient wrapper
- `src/atlassian_sdk/jira/models.py` — Jira response DTOs
- `src/atlassian_sdk/jira/schemas.py` — Jira input request models
- `src/atlassian_sdk/jira/client.py` — JiraClient class
- `src/atlassian_sdk/confluence/models.py` — Confluence response DTOs
- `src/atlassian_sdk/confluence/schemas.py` — Confluence input request models
- `src/atlassian_sdk/confluence/client.py` — ConfluenceClient class
- `src/atlassian_sdk/__init__.py` — public API exports
- `tests/` — all lib tests
- `tests/conftest.py` — shared fixtures (respx mock)

## References
- `.claude/rules/` — all coding conventions
- Atlassian REST API v3 (Jira), v2 (Confluence)

## Workflow
1. Follow implementation order: exceptions → auth → http → jira/(models→schemas→client) → confluence/(models→schemas→client) → __init__
2. For each file: implement → write tests → verify tests pass → next
3. Use `poetry run pytest tests/ -v` to verify
