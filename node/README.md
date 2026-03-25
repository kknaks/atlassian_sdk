# @atlassian-sdk/js

Atlassian REST API를 직접 호출하는 TypeScript SDK. Jira + Confluence를 하나의 패키지로 지원합니다.

> Node.js / React / React Native / Next.js / Vite 어디서든 사용 가능

## 설치

```bash
npm install @atlassian-sdk/js
```

## 환경변수

프레임워크에 맞게 `.env`에 설정하면 SDK가 자동으로 읽습니다:

| 프레임워크 | 변수명 |
|-----------|--------|
| Node.js / Express | `ATLASSIAN_SITE` |
| Next.js (서버) | `ATLASSIAN_SITE` |
| Next.js (클라이언트) | `NEXT_PUBLIC_ATLASSIAN_SITE` |
| Vite / React | `VITE_ATLASSIAN_SITE` |
| Expo / React Native | `EXPO_PUBLIC_ATLASSIAN_SITE` |

```env
# Node.js / Next.js 서버
ATLASSIAN_SITE=your-site.atlassian.net
ATLASSIAN_EMAIL=user@example.com
ATLASSIAN_API_TOKEN=your-api-token
```

```env
# Vite / React
VITE_ATLASSIAN_SITE=your-site.atlassian.net
VITE_ATLASSIAN_EMAIL=user@example.com
VITE_ATLASSIAN_API_TOKEN=your-api-token
```

## Jira 사용법

```typescript
import { JiraClient } from "@atlassian-sdk/js";

// env에서 자동 로드
const jira = new JiraClient();

// 또는 직접 전달
const jira = new JiraClient({
  site: "your-site.atlassian.net",
  email: "user@example.com",
  apiToken: "your-api-token",
});

// 프로젝트 목록
const projects = await jira.listProjects();

// 이슈 생성
const issue = await jira.createIssue({
  projectKey: "WNVO",
  summary: "로그인 에러 수정",
  issueTypeName: "Task",
  description: "상세 설명",
  labels: ["bug"],
});
console.log(issue.key); // WNVO-111

// 이슈 조회
const detail = await jira.getIssue("WNVO-111");

// JQL 검색
const result = await jira.searchIssues({
  jql: "project = WNVO AND status = 'To Do'",
  maxResults: 20,
});

// 상태 변경
await jira.transitionIssue("WNVO-111", "완료");

// 댓글
await jira.addComment("WNVO-111", "수정 완료");
const comments = await jira.listComments("WNVO-111");
```

## Confluence 사용법

```typescript
import { ConfluenceClient } from "@atlassian-sdk/js";

const confluence = new ConfluenceClient();

// 스페이스 목록
const spaces = await confluence.listSpaces();

// 페이지 생성
const page = await confluence.createPage({
  spaceId: "12345",
  title: "회의록 2024-01-15",
  body: "<h1>회의 내용</h1><p>안건 논의</p>",
});

// 페이지 조회 / 수정
const detail = await confluence.getPage("67890");
const updated = await confluence.updatePage("67890", {
  title: "회의록 (수정)",
  body: "<p>수정된 내용</p>",
  versionNumber: 2,
});

// 하위 페이지 / 댓글
const children = await confluence.listChildPages("67890");
await confluence.createFooterComment("67890", "확인했습니다");

// CQL 검색
const results = await confluence.searchByCql("type=page AND space=DEV");
```

## React 예시

```tsx
import { JiraClient } from "@atlassian-sdk/js";
import { useEffect, useState } from "react";

// env에서 자동 로드 (Vite: VITE_ATLASSIAN_*)
const jira = new JiraClient();

function IssueList() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    jira.searchIssues({ jql: "project = WNVO" })
      .then((result) => setIssues(result.issues));
  }, []);

  return (
    <ul>
      {issues.map((issue) => (
        <li key={issue.key}>
          {issue.key} - {issue.fields.summary}
        </li>
      ))}
    </ul>
  );
}
```

## Next.js API Route 예시

```typescript
// app/api/jira/route.ts
import { JiraClient } from "@atlassian-sdk/js";

const jira = new JiraClient(); // 서버에서 ATLASSIAN_* env 자동 로드

export async function GET() {
  const issues = await jira.searchIssues({
    jql: "project = WNVO AND status = 'To Do'",
  });
  return Response.json(issues);
}
```

## MCP 서버

Claude Desktop/Claude Code에서 Jira + Confluence를 사용할 수 있는 MCP 서버가 포함되어 있습니다.

```json
{
  "mcpServers": {
    "atlassian-sdk": {
      "command": "npx",
      "args": ["-y", "-p", "@atlassian-sdk/js", "atlassian-sdk-mcp", "--", "--env-file", ".env"]
    }
  }
}
```

`--env-file` 옵션으로 환경변수 파일 경로를 지정합니다. `.env`, `.env.local` 등 원하는 파일을 사용할 수 있습니다.

```env
# .env
ATLASSIAN_SITE=your-site.atlassian.net
ATLASSIAN_EMAIL=user@example.com
ATLASSIAN_API_TOKEN=your-api-token
```

> `--env-file`을 생략하면 셸 환경변수 또는 `.mcp.json`의 `env` 필드에서 읽습니다.

제공 도구 (17개):
- **Jira 도구**: `jira_list_projects`, `jira_list_issue_types`, `jira_get_issue`, `jira_search_issues`, `jira_create_issue`, `jira_transition_issue`, `jira_add_comment`, `jira_list_comments`
- **Confluence 도구**: `confluence_create_page`, `confluence_get_page`, `confluence_update_page`, `confluence_list_spaces`, `confluence_list_pages_in_space`, `confluence_list_child_pages`, `confluence_list_footer_comments`, `confluence_add_footer_comment`, `confluence_search`

## 인증

| 환경 | 방식 |
|------|------|
| 로컬 개발 | `.env` 파일에 환경변수 설정 |
| Docker / CI | 환경변수 직접 주입 |
| 직접 전달 | `new JiraClient({ site, email, apiToken })` |

Basic Auth: `email + API token` → `Authorization: Basic base64(email:token)`

## 기술 스택

- TypeScript (strict)
- Native fetch (브라우저/Node/RN 호환)
- Zod (입력 검증)
- MCP SDK (@modelcontextprotocol/sdk)
- tsup (ESM + CJS 빌드)
- vitest (테스트)

## 라이선스

MIT
