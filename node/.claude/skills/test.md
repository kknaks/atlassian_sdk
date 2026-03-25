# /test

Run vitest for the atlassian-sdk-js project.

## Usage
- `/test` — run all tests
- `/test jira` — run only jira tests
- `/test confluence` — run only confluence tests
- `/test mcp` — run only mcp tests
- `/test -k name` — run tests matching name

## Command
```bash
npm test
```

## Options
- `jira` → `npx vitest run tests/jira/`
- `confluence` → `npx vitest run tests/confluence/`
- `mcp` → `npx vitest run tests/mcp/`
- `-k <pattern>` → `npx vitest run -t "<pattern>"`
