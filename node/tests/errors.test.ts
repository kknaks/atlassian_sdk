import { describe, expect, it } from "vitest";

import {
  ApiError,
  AuthError,
  NotFoundError,
  RateLimitError,
  SdkError,
  throwFromStatus,
  TimeoutError,
  ValidationError,
} from "../src/errors.js";

describe("Error hierarchy", () => {
  it("SdkError is an instance of Error", () => {
    const err = new SdkError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SdkError);
    expect(err.message).toBe("test");
  });

  it("ApiError extends SdkError and stores statusCode and responseBody", () => {
    const body = { detail: "bad request" };
    const err = new ApiError("api fail", 400, body);
    expect(err).toBeInstanceOf(SdkError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(400);
    expect(err.responseBody).toEqual(body);
  });

  it("AuthError extends ApiError with statusCode 401", () => {
    const err = new AuthError("unauthorized");
    expect(err).toBeInstanceOf(SdkError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(AuthError);
    expect(err.statusCode).toBe(401);
  });

  it("NotFoundError extends ApiError with statusCode 404", () => {
    const err = new NotFoundError("not found");
    expect(err).toBeInstanceOf(SdkError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.statusCode).toBe(404);
  });

  it("RateLimitError extends ApiError with statusCode 429 and retryAfter", () => {
    const err = new RateLimitError("rate limited", undefined, 60);
    expect(err).toBeInstanceOf(SdkError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.statusCode).toBe(429);
    expect(err.retryAfter).toBe(60);
  });

  it("RateLimitError retryAfter is undefined when not provided", () => {
    const err = new RateLimitError("rate limited");
    expect(err.retryAfter).toBeUndefined();
  });

  it("ValidationError extends SdkError", () => {
    const err = new ValidationError("invalid input");
    expect(err).toBeInstanceOf(SdkError);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.message).toBe("invalid input");
  });

  it("TimeoutError extends SdkError", () => {
    const err = new TimeoutError("timed out");
    expect(err).toBeInstanceOf(SdkError);
    expect(err).toBeInstanceOf(TimeoutError);
    expect(err.message).toBe("timed out");
  });
});

describe("throwFromStatus", () => {
  it("throws AuthError for 401", () => {
    expect(() => throwFromStatus(401, "unauthorized")).toThrow(AuthError);
  });

  it("throws NotFoundError for 404", () => {
    expect(() => throwFromStatus(404, "not found")).toThrow(NotFoundError);
  });

  it("throws RateLimitError for 429", () => {
    expect(() => throwFromStatus(429, "too many")).toThrow(RateLimitError);
  });

  it("throws ApiError for 500", () => {
    expect(() => throwFromStatus(500, "server error")).toThrow(ApiError);
    try {
      throwFromStatus(500, "server error");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(500);
    }
  });

  it("includes response body in error message for object body", () => {
    const body = { error: "details" };
    try {
      throwFromStatus(400, body);
    } catch (err) {
      expect((err as ApiError).message).toContain('{"error":"details"}');
      expect((err as ApiError).responseBody).toEqual(body);
    }
  });

  it("includes response body in error message for string body", () => {
    try {
      throwFromStatus(403, "forbidden");
    } catch (err) {
      expect((err as ApiError).message).toContain("forbidden");
    }
  });
});
