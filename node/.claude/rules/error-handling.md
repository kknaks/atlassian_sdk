# Error Handling

## Error class hierarchy
All errors must extend `SdkError`. Never throw raw `Error` directly.

```
SdkError (extends Error)
├── AuthError          # authentication failure (401, missing credentials)
├── NotFoundError      # resource not found (404)
├── ValidationError    # input validation failure (Zod parse error)
├── ApiError           # generic API error (4xx/5xx)
├── RateLimitError     # rate limit exceeded (429)
└── TimeoutError       # request timeout
```

## Retry policy
- Auth expiry (401): retry once after re-authentication
- Rate limit (429): respect Retry-After header
- All other errors: no retry, throw immediately
- Include API response body in error message
