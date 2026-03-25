# /lint

Check code style and type hints.

## Command
```bash
poetry run python -m py_compile src/atlassian_sdk/exceptions.py
poetry run python -m py_compile src/atlassian_sdk/auth.py
poetry run python -m py_compile src/atlassian_sdk/http.py
poetry run python -m py_compile src/atlassian_sdk/jira/client.py
poetry run python -m py_compile src/atlassian_sdk/jira/models.py
poetry run python -m py_compile src/atlassian_sdk/jira/schemas.py
poetry run python -m py_compile src/atlassian_sdk/confluence/client.py
poetry run python -m py_compile src/atlassian_sdk/confluence/models.py
poetry run python -m py_compile src/atlassian_sdk/confluence/schemas.py
poetry run python -m py_compile src/atlassian_sdk/mcp/server.py
```

Verifies all source files compile without syntax errors.
