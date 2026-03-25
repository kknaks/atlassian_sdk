# /e2e

Run end-to-end test against real Atlassian (requires .env with API token).

## Command
```bash
npx tsx -e "
import { JiraClient } from './src/index.js';

const client = new JiraClient();
const issue = await client.getIssue('WNVO-110');
console.log('OK:', issue.key, '-', issue.summary);
"
```

Verifies the full pipeline: SDK → fetch → REST API → JSON → TypeScript.
