import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthConfig } from "../src/auth.js";
import {
  ApiError,
  AuthError,
  NotFoundError,
  RateLimitError,
} from "../src/errors.js";
import { HttpClient } from "../src/http.js";

const TEST_CONFIG: AuthConfig = {
  site: "test.atlassian.net",
  email: "user@example.com",
  apiToken: "test-token",
};

/** Helper to create a mock Response. */
function mockResponse(
  body: unknown,
  status: number = 200,
  ok: boolean = status >= 200 && status < 300,
): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    headers: new Headers(),
  } as unknown as Response;
}

describe("HttpClient", () => {
  let client: HttpClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    client = new HttpClient(TEST_CONFIG);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET", () => {
    it("returns parsed JSON on success", async () => {
      const data = { id: 1, name: "Test" };
      fetchMock.mockResolvedValue(mockResponse(data));

      const result = await client.get<{ id: number; name: string }>(
        "/rest/api/3/issue/TEST-1",
      );

      expect(result).toEqual(data);
      expect(fetchMock).toHaveBeenCalledOnce();

      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("https://test.atlassian.net/rest/api/3/issue/TEST-1");
      expect(options.method).toBe("GET");
      expect((options.headers as Record<string, string>)["Authorization"]).toMatch(
        /^Basic /,
      );
    });

    it("appends query params to the URL", async () => {
      fetchMock.mockResolvedValue(mockResponse({ results: [] }));

      await client.get("/rest/api/3/search", { jql: "project=TEST", maxResults: "10" });

      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("jql=project%3DTEST");
      expect(url).toContain("maxResults=10");
    });
  });

  describe("POST", () => {
    it("returns parsed JSON on success", async () => {
      const responseData = { id: "10001", key: "TEST-2" };
      fetchMock.mockResolvedValue(mockResponse(responseData, 201));

      const result = await client.post<{ id: string; key: string }>(
        "/rest/api/3/issue",
        { fields: { summary: "New issue" } },
      );

      expect(result).toEqual(responseData);

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("POST");
      expect(options.body).toBe(JSON.stringify({ fields: { summary: "New issue" } }));
    });
  });

  describe("Error handling", () => {
    it("throws AuthError on 401", async () => {
      fetchMock.mockResolvedValue(mockResponse({ message: "Unauthorized" }, 401, false));

      await expect(
        client.get("/rest/api/3/myself"),
      ).rejects.toThrow(AuthError);
    });

    it("throws NotFoundError on 404", async () => {
      fetchMock.mockResolvedValue(
        mockResponse({ errorMessages: ["Issue not found"] }, 404, false),
      );

      await expect(
        client.get("/rest/api/3/issue/NOPE-1"),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws RateLimitError on 429", async () => {
      fetchMock.mockResolvedValue(
        mockResponse({ message: "Rate limit exceeded" }, 429, false),
      );

      await expect(
        client.get("/rest/api/3/search"),
      ).rejects.toThrow(RateLimitError);
    });

    it("throws ApiError on 500", async () => {
      fetchMock.mockResolvedValue(
        mockResponse({ message: "Internal Server Error" }, 500, false),
      );

      await expect(
        client.get("/rest/api/3/issue/TEST-1"),
      ).rejects.toThrow(ApiError);
    });
  });
});
