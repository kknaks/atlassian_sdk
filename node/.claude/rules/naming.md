# Naming Conventions

- Classes: `PascalCase` (JiraClient, HttpClient)
- Functions/methods: `camelCase` (createIssue, toRequestBody)
- Constants: `UPPER_SNAKE_CASE` (DEFAULT_TIMEOUT)
- Private members: `_prefix` or `#prefix` (_request, #httpClient)
- File names: `kebab-case` or `camelCase` (client.ts, types.ts)
- Interfaces: `PascalCase`, no `I` prefix (JiraIssue, not IJiraIssue)
- Type aliases: `PascalCase` (CreateIssueInput)
- Zod schemas: `camelCase` + `Schema` suffix (createIssueSchema)
