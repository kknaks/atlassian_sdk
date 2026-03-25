# Data Layer Separation

## types.ts — Response DTOs
- TypeScript interfaces for Atlassian REST API JSON responses
- Unknown fields are ignored via destructuring (no runtime validation on responses)
- Field names match API camelCase directly

## schemas.ts — Input schemas
- Zod schemas for runtime input validation (equivalent to Pydantic `extra="forbid"`)
- Each schema has a `toRequestBody()` function returning object for REST API POST/PUT body
- Rejects unknown fields at runtime

## Data flow
```
User code              SDK                    Atlassian REST API
─────────             ──────────             ──────────────────
schemas.ts     →    client.ts      →    fetch POST/PUT/GET
(input)            toRequestBody()      /rest/api/3/...
                   ←  parse JSON   ←    JSON response
                   types.ts
                   (output)
```
