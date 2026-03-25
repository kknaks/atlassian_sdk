import { Buffer } from "node:buffer";

import { afterEach, describe, expect, it, vi } from "vitest";

import { buildAuthHeader, buildBaseUrl, loadAuthFromEnv } from "../src/auth.js";
import { AuthError } from "../src/errors.js";

describe("loadAuthFromEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns AuthConfig when all env vars are set", () => {
    vi.stubEnv("ATLASSIAN_SITE", "mysite.atlassian.net");
    vi.stubEnv("ATLASSIAN_EMAIL", "user@example.com");
    vi.stubEnv("ATLASSIAN_API_TOKEN", "secret-token");

    const config = loadAuthFromEnv();
    expect(config.site).toBe("mysite.atlassian.net");
    expect(config.email).toBe("user@example.com");
    expect(config.apiToken).toBe("secret-token");
  });

  it("throws AuthError when ATLASSIAN_SITE is missing", () => {
    vi.stubEnv("ATLASSIAN_SITE", "");
    vi.stubEnv("ATLASSIAN_EMAIL", "user@example.com");
    vi.stubEnv("ATLASSIAN_API_TOKEN", "secret-token");

    expect(() => loadAuthFromEnv()).toThrow(AuthError);
  });

  it("throws AuthError when ATLASSIAN_EMAIL is missing", () => {
    vi.stubEnv("ATLASSIAN_SITE", "mysite.atlassian.net");
    vi.stubEnv("ATLASSIAN_EMAIL", "");
    vi.stubEnv("ATLASSIAN_API_TOKEN", "secret-token");

    expect(() => loadAuthFromEnv()).toThrow(AuthError);
  });

  it("throws AuthError when ATLASSIAN_API_TOKEN is missing", () => {
    vi.stubEnv("ATLASSIAN_SITE", "mysite.atlassian.net");
    vi.stubEnv("ATLASSIAN_EMAIL", "user@example.com");
    vi.stubEnv("ATLASSIAN_API_TOKEN", "");

    expect(() => loadAuthFromEnv()).toThrow(AuthError);
  });

  it("throws AuthError listing all missing variables", () => {
    vi.stubEnv("ATLASSIAN_SITE", "");
    vi.stubEnv("ATLASSIAN_EMAIL", "");
    vi.stubEnv("ATLASSIAN_API_TOKEN", "");

    try {
      loadAuthFromEnv();
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      const msg = (err as AuthError).message;
      expect(msg).toContain("ATLASSIAN_SITE");
      expect(msg).toContain("ATLASSIAN_EMAIL");
      expect(msg).toContain("ATLASSIAN_API_TOKEN");
    }
  });
});

describe("buildAuthHeader", () => {
  it("produces correct Basic auth base64 string", () => {
    const config = {
      site: "mysite.atlassian.net",
      email: "user@example.com",
      apiToken: "my-token",
    };
    const header = buildAuthHeader(config);
    const expected = `Basic ${Buffer.from("user@example.com:my-token").toString("base64")}`;
    expect(header).toBe(expected);
  });
});

describe("buildBaseUrl", () => {
  it("returns https URL for plain site", () => {
    expect(buildBaseUrl("mysite.atlassian.net")).toBe(
      "https://mysite.atlassian.net",
    );
  });

  it("strips trailing slash from site", () => {
    expect(buildBaseUrl("mysite.atlassian.net/")).toBe(
      "https://mysite.atlassian.net",
    );
  });

  it("strips multiple trailing slashes", () => {
    expect(buildBaseUrl("mysite.atlassian.net///")).toBe(
      "https://mysite.atlassian.net",
    );
  });
});
