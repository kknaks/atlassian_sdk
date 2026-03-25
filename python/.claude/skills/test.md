# /test

Run pytest for the atlassian-sdk-py project.

## Usage
- `/test` — run all tests
- `/test jira` — run only jira tests
- `/test confluence` — run only confluence tests
- `/test mcp` — run only mcp tests
- `/test -k name` — run tests matching name

## Command
```bash
poetry run pytest tests/ -v
```

## Options
- `jira` → `poetry run pytest tests/jira/ -v`
- `confluence` → `poetry run pytest tests/confluence/ -v`
- `mcp` → `poetry run pytest tests/mcp/ -v`
- `-k <pattern>` → `poetry run pytest tests/ -v -k "<pattern>"`
