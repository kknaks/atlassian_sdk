# Error Handling

## Exception hierarchy
All exceptions must inherit from `SdkError`. Never raise stdlib exceptions directly.

```
SdkError
├── AuthError          # authentication failure (401, missing credentials)
├── NotFoundError      # resource not found (404)
├── ValidationError    # input validation failure
├── ApiError           # generic API error (4xx/5xx)
├── RateLimitError     # rate limit exceeded (429)
└── TimeoutError       # request timeout
```

## Logging levels
- ERROR: API failure, unrecoverable errors
- WARNING: auth retry, rate limit backoff
- DEBUG: request URL, headers (sans token), response status

## Retry policy
- Auth expiry (401): retry once after re-authentication
- Rate limit (429): respect Retry-After header
- All other errors: no retry, raise immediately
- Include API response body in exception message
