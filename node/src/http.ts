import type { AuthConfig } from "./auth.js";
import { buildAuthHeader, buildBaseUrl, loadAuthFromEnv } from "./auth.js";
import { throwFromStatus, TimeoutError } from "./errors.js";

/** Default request timeout in milliseconds. */
const DEFAULT_TIMEOUT = 30_000;

/**
 * HTTP client for Atlassian REST API requests.
 * Uses native fetch with Basic Auth and JSON serialization.
 */
export class HttpClient {
  private readonly _baseUrl: string;
  private readonly _authHeader: string;

  constructor(config?: AuthConfig) {
    const resolvedConfig = config ?? loadAuthFromEnv();
    this._baseUrl = buildBaseUrl(resolvedConfig.site);
    this._authHeader = buildAuthHeader(resolvedConfig);
  }

  /** Sends a GET request and returns parsed JSON. */
  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this._request<T>("GET", path, undefined, params);
  }

  /** Sends a POST request and returns parsed JSON. */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this._request<T>("POST", path, body);
  }

  /** Sends a PUT request and returns parsed JSON. */
  async put<T>(path: string, body?: unknown): Promise<T> {
    return this._request<T>("PUT", path, body);
  }

  /**
   * Internal method that executes the HTTP request.
   * Handles URL construction, timeout via AbortController,
   * JSON serialization, and error mapping.
   */
  private async _request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(path, this._baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          Authorization: this._authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        let responseBody: unknown;
        try {
          responseBody = await response.json();
        } catch {
          responseBody = await response.text().catch(() => "unknown");
        }
        throwFromStatus(response.status, responseBody);
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new TimeoutError(
          `Request timed out after ${DEFAULT_TIMEOUT}ms: ${method} ${url.toString()}`,
        );
      }
      // Also handle the Node.js AbortError which may not be DOMException
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new TimeoutError(
          `Request timed out after ${DEFAULT_TIMEOUT}ms: ${method} ${url.toString()}`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
