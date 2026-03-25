# atlassian-sdk-py — 프로젝트 컨텍스트

## 프로젝트 개요
Atlassian REST API를 직접 호출하는 Python async SDK. httpx로 REST API를 호출하고 JSON 응답을 Pydantic 모델로 반환한다. 레거시 CLI 래퍼(`pyacli`)의 RESTful 전환 버전.

## 현재 상태
설계 확정, 구현 시작 단계

## 기술 스택
| 항목 | 결정 |
|------|------|
| 패키지 이름 | `atlassian-sdk-py` |
| Python | 3.11+ |
| 빌드 도구 | Poetry |
| HTTP 클라이언트 | httpx (async) |
| 반환/입력 타입 | Pydantic v2 모델 |
| API 설계 | 클래스 기반 (JiraClient, ConfluenceClient) + Pydantic 입력 모델 |
| MCP 서버 | 포함 (stdio) — SDK 메서드를 MCP 도구로 노출 |
| 인증 | 환경변수 (`ATLASSIAN_SITE`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`) → Basic Auth header |

## 패키지 구조
```
src/atlassian_sdk/
├── auth.py              # BasicAuth (email + token → header)
├── http.py              # httpx.AsyncClient 래퍼
├── exceptions.py        # 예외 계층
├── jira/                # Jira REST API v3
│   ├── client.py        # JiraClient
│   ├── models.py        # 응답 DTO
│   └── schemas.py       # 입력 스키마
├── confluence/          # Confluence REST API v2
│   ├── client.py        # ConfluenceClient
│   ├── models.py        # 응답 DTO
│   └── schemas.py       # 입력 스키마
└── mcp/                 # MCP 서버
    ├── __init__.py      # entrypoint
    └── server.py        # 도구 등록
```

## REST API 엔드포인트
- Jira: `https://{ATLASSIAN_SITE}/rest/api/3/`
- Confluence: `https://{ATLASSIAN_SITE}/wiki/api/v2/`

## 환경변수
```
ATLASSIAN_SITE=khu-team-vv9047q8.atlassian.net
ATLASSIAN_EMAIL=dh221009@khu.ac.kr
ATLASSIAN_API_TOKEN=<유저 입력>
PYACLI_DEFAULT_PROJECT=WNVO
PYACLI_EPIC_MAP=frontend:WNVO-9,backend:WNVO-23,ai:WNVO-24
```
