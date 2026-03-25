# /e2e

Run end-to-end test against real Atlassian (requires .env with API token).

## Command
```bash
poetry run python -c "
import asyncio
from atlassian_sdk import JiraClient

async def main():
    client = JiraClient()
    issue = await client.get_issue('WNVO-110')
    print(f'OK: {issue.key} - {issue.summary}')

asyncio.run(main())
"
```

Verifies the full pipeline: SDK → httpx → REST API → JSON → Pydantic.
