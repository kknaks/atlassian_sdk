# atlassian-sdk-py

Atlassian REST API를 직접 호출하는 Python async SDK. Jira + Confluence를 하나의 패키지로 지원합니다.

> acli 바이너리 불필요 — httpx로 REST API 직접 호출

## 설치

```bash
pip install atlassian-sdk-py
```

## 환경변수

```env
ATLASSIAN_SITE=your-site.atlassian.net
ATLASSIAN_EMAIL=user@example.com
ATLASSIAN_API_TOKEN=your-api-token
PYACLI_DEFAULT_PROJECT=WNVO
PYACLI_EPIC_MAP=frontend:WNVO-9,backend:WNVO-23,ai:WNVO-24
```

## Jira 사용법

```python
import asyncio
from atlassian_sdk import JiraClient

async def main():
    client = JiraClient()

    # 프로젝트 목록 조회
    projects = await client.list_projects()

    # 에픽 이름으로 이슈 생성 (epic map 사용)
    issue = await client.create_issue(
        summary="로그인 에러 수정",
        epic="frontend",            # → WNVO-9 밑에 생성
        labels=["bug", "backend"],
    )
    print(issue.key)  # WNVO-111
    print(issue.url)  # https://site.atlassian.net/browse/WNVO-111

    # 이슈 조회
    issue = await client.get_issue("WNVO-111")

    # JQL 검색
    issues = await client.search_issues(
        jql="project = WNVO AND status = 'To Do'",
    )

    # 상태 변경
    await client.transition_issue("WNVO-111", status="완료")

    # 댓글
    await client.add_comment("WNVO-111", body="수정 완료")
    comments = await client.list_comments("WNVO-111")

asyncio.run(main())
```

## Confluence 사용법

```python
from atlassian_sdk import ConfluenceClient

async def main():
    client = ConfluenceClient()

    # 스페이스 목록
    spaces = await client.list_spaces()

    # 페이지 생성
    page = await client.create_page(
        space_id="12345",
        title="회의록 2024-01-15",
        body="<h1>회의 내용</h1><p>안건 논의</p>",
    )

    # 페이지 조회 / 수정
    page = await client.get_page("67890")
    updated = await client.update_page(
        "67890",
        title="회의록 (수정)",
        body="<p>수정된 내용</p>",
        version_number=2,
    )

    # 하위 페이지 / 댓글
    children = await client.get_child_pages("67890")
    await client.add_footer_comment("67890", body="확인했습니다")

    # CQL 검색
    results = await client.search(cql="type=page AND space=DEV")
```

## Jira 계층 구조

```
Project (WNVO)
├── [에픽] 기능구현-프론트 1차          ← parent 없이 생성
│   ├── [작업] 로그인 에러 수정         ← parent = 에픽 키
│   │   ├── [하위작업] UI 구현         ← parent = 작업 키
│   │   └── [하위작업] API 연동
│   └── [작업] 회원가입 구현
└── [에픽] 기능구현-백엔드 1차
```

## Pydantic 입력 모델

파라미터가 많을 때 Request 모델을 사용할 수 있습니다:

```python
from atlassian_sdk import JiraClient, CreateIssueRequest

client = JiraClient(project="WNVO")

req = CreateIssueRequest(
    summary="복잡한 이슈",
    description="상세 설명",
    type="Bug",
    assignee="user-account-id",
    labels=["bug", "urgent"],
    parent="WNVO-9",
)
issue = await client.create_issue(request=req)
```

## FastAPI 에러 자동 보고

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from atlassian_sdk import JiraClient
import traceback

app = FastAPI()
client = JiraClient()

@app.middleware("http")
async def error_reporting(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
        issue = await client.create_issue(
            summary=f"[AUTO-BUG] {type(exc).__name__}: {exc}",
            description=f"Endpoint: {request.method} {request.url.path}",
            issue_type="버그",
            epic="backend",
        )
        await client.add_comment(issue.key, body=tb)
        return JSONResponse(status_code=500, content={"jira": issue.key})
```

## MCP 서버

Claude Desktop/Claude Code에서 Jira + Confluence를 사용할 수 있는 MCP 서버가 포함되어 있습니다.

```json
{
  "mcpServers": {
    "atlassian-sdk": {
      "command": "python",
      "args": ["-m", "atlassian_sdk.mcp"]
    }
  }
}
```

제공 도구 (20개):
- **Schema 도구**: `list_methods`, `get_method_info`, `get_models`
- **Jira 도구**: `list_projects`, `list_issue_types`, `get_issue`, `search_issues`, `create_issue`, `transition_issue`, `add_comment`, `list_comments`
- **Confluence 도구**: `create_page`, `get_page`, `update_page`, `list_spaces`, `get_pages_in_space`, `get_child_pages`, `get_footer_comments`, `add_footer_comment`, `search_confluence`

## 인증

| 환경 | 방식 |
|------|------|
| 로컬 개발 | `.env` 파일에 환경변수 설정 |
| Docker / CI | 환경변수 직접 주입 |

Basic Auth: `email + API token` → `Authorization: Basic base64(email:token)`

## 기술 스택

- Python 3.11+
- httpx (async HTTP)
- Pydantic v2
- MCP SDK
- Poetry

## 라이선스

MIT
