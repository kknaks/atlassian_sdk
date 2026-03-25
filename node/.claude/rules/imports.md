# Import Order

Always follow this order, separated by blank lines:

```typescript
// 1. Node.js built-ins (if needed)
import { Buffer } from "node:buffer";

// 2. Third-party
import { z } from "zod";

// 3. Local — absolute paths from src root
import { SdkError } from "../errors.js";
import type { JiraIssue } from "./types.js";
```

- Use `type` imports for type-only imports
- Use `.js` extension in relative imports (ESM)
- No wildcard imports (`import * as`)
- No default exports — use named exports only
