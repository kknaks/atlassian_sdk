# Data Layer Separation

## models.py — Response DTOs
- Parses Atlassian REST API JSON responses into Python objects
- Used internally and as return values
- Config: `extra="ignore"` (ignore unknown fields for API version compatibility)
- Field mapping: `Field(alias="camelCase")` for JSON ↔ snake_case

## schemas.py — Input schemas
- Defines what users pass when calling the SDK
- Config: `extra="forbid"` (catch typos immediately)
- Each schema has a `to_request_body()` method returning `dict` for REST API POST/PUT body

## Data flow
```
User code              SDK                    Atlassian REST API
─────────             ──────────             ──────────────────
schemas.py     →    client.py      →    httpx POST/PUT/GET
(input)            to_request_body()    /rest/api/3/...
                   ←  parse JSON   ←    JSON response
                   models.py
                   (output)
```
