# Naming Conventions

- Classes: `PascalCase` (JiraClient, CreateIssueRequest)
- Functions/methods: `snake_case` (create_issue, to_request_body)
- Constants: `UPPER_SNAKE_CASE` (DEFAULT_TIMEOUT)
- Private members: `_prefix` (_request, _build_url)
- File names: `snake_case` (models.py, schemas.py)
- DTO fields: Python `snake_case` + Pydantic `Field(alias="camelCase")` for JSON mapping
