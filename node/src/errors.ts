/**
 * Error class hierarchy for the Atlassian SDK.
 */

/** Base error for all SDK errors. */
export class SdkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SdkError";
  }
}

/** Generic API error for 4xx/5xx responses. */
export class ApiError extends SdkError {
  readonly statusCode: number;
  readonly responseBody: unknown;

  constructor(message: string, statusCode: number, responseBody: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/** Authentication error (HTTP 401). */
export class AuthError extends ApiError {
  constructor(message: string, responseBody: unknown = undefined) {
    super(message, 401, responseBody);
    this.name = "AuthError";
  }
}

/** Resource not found error (HTTP 404). */
export class NotFoundError extends ApiError {
  constructor(message: string, responseBody: unknown = undefined) {
    super(message, 404, responseBody);
    this.name = "NotFoundError";
  }
}

/** Rate limit exceeded error (HTTP 429). */
export class RateLimitError extends ApiError {
  readonly retryAfter: number | undefined;

  constructor(
    message: string,
    responseBody: unknown = undefined,
    retryAfter?: number,
  ) {
    super(message, 429, responseBody);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/** Input validation error. */
export class ValidationError extends SdkError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Request timeout error. */
export class TimeoutError extends SdkError {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Maps an HTTP status code to the appropriate error and throws it.
 * Always throws — return type is `never`.
 */
export function throwFromStatus(status: number, body: unknown): never {
  const bodyStr =
    typeof body === "string" ? body : JSON.stringify(body) ?? "unknown";
  const message = `HTTP ${status}: ${bodyStr}`;

  switch (status) {
    case 401:
      throw new AuthError(message, body);
    case 404:
      throw new NotFoundError(message, body);
    case 429:
      throw new RateLimitError(message, body);
    default:
      throw new ApiError(message, status, body);
  }
}
