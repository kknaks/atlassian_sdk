# atlassian-sdk-js — 프로젝트 컨텍스트

## 프로젝트 개요
Atlassian REST API를 직접 호출하는 Node.js/TypeScript SDK. fetch로 REST API를 호출하고 JSON 응답을 TypeScript 타입으로 반환한다. React/React Native에서 사용 가능.

## 현재 상태
설계 확정, 구현 시작 단계

## 기술 스택
| 항목 | 결정 |
|------|------|
| 패키지 이름 | `@atlassian-sdk/js` |
| Node.js | 20+ |
| 언어 | TypeScript (strict) |
| 빌드 도구 | tsup (ESM + CJS + dts) |
| 테스트 | vitest |
| HTTP 클라이언트 | fetch (네이티브 — 브라우저/Node/RN 호환) |
| 입력 검증 | Zod |
| 응답 타입 | TypeScript interfaces |
| MCP 서버 | 포함 (stdio) — SDK 메서드를 MCP 도구로 노출 |
| MCP SDK | @modelcontextprotocol/sdk |
| 인증 | 환경변수 (`ATLASSIAN_SITE`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`) → Basic Auth header |

## 패키지 구조
```
src/
├── auth.ts              # BasicAuth (email + token → base64 header)
├── http.ts              # fetch 래퍼
├── errors.ts            # 에러 클래스 계층
├── jira/                # Jira REST API v3
│   ├── client.ts        # JiraClient
│   ├── types.ts         # 응답 인터페이스
│   └── schemas.ts       # Zod 입력 스키마
├── confluence/          # Confluence REST API v2
│   ├── client.ts        # ConfluenceClient
│   ├── types.ts         # 응답 인터페이스
│   └── schemas.ts       # Zod 입력 스키마
└── mcp/                 # MCP 서버
    ├── index.ts         # entrypoint
    └── tools.ts         # 도구 정의
```

## REST API 엔드포인트
- Jira: `https://{ATLASSIAN_SITE}/rest/api/3/`
- Confluence: `https://{ATLASSIAN_SITE}/wiki/api/v2/`

## 환경변수
```
ATLASSIAN_SITE=khu-team-vv9047q8.atlassian.net
ATLASSIAN_EMAIL=dh221009@khu.ac.kr
ATLASSIAN_API_TOKEN=<유저 입력>
```
