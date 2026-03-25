import { describe, expect, it } from "vitest";

import {
  createPageSchema,
  createPageBody,
  updatePageSchema,
  updatePageBody,
  createCommentSchema,
  createCommentBody,
} from "../../src/confluence/schemas.js";

describe("createPageSchema", () => {
  it("validates correct input with defaults", () => {
    const parsed = createPageSchema.parse({
      spaceId: "100",
      title: "New Page",
      body: "<p>Hello</p>",
    });
    expect(parsed.spaceId).toBe("100");
    expect(parsed.title).toBe("New Page");
    expect(parsed.body).toBe("<p>Hello</p>");
    expect(parsed.status).toBe("current");
  });

  it("accepts all optional fields", () => {
    const parsed = createPageSchema.parse({
      spaceId: "100",
      title: "Child Page",
      body: "<p>Content</p>",
      parentId: "200",
      status: "draft",
    });
    expect(parsed.parentId).toBe("200");
    expect(parsed.status).toBe("draft");
  });

  it("rejects unknown fields via strict()", () => {
    expect(() =>
      createPageSchema.parse({
        spaceId: "100",
        title: "Page",
        body: "<p>Hi</p>",
        unknownField: "bad",
      }),
    ).toThrow();
  });
});

describe("createPageBody", () => {
  it("builds minimal body", () => {
    const body = createPageBody({
      spaceId: "100",
      title: "Page",
      body: "<p>Hi</p>",
      status: "current",
    });
    expect(body).toEqual({
      spaceId: "100",
      title: "Page",
      body: { representation: "storage", value: "<p>Hi</p>" },
      status: "current",
    });
    expect(body.parentId).toBeUndefined();
  });

  it("includes parentId when provided", () => {
    const body = createPageBody({
      spaceId: "100",
      title: "Child",
      body: "<p>Content</p>",
      parentId: "200",
      status: "current",
    });
    expect(body.parentId).toBe("200");
  });
});

describe("updatePageSchema", () => {
  it("validates correct input with defaults", () => {
    const parsed = updatePageSchema.parse({
      title: "Updated",
      body: "<p>New</p>",
      versionNumber: 2,
    });
    expect(parsed.title).toBe("Updated");
    expect(parsed.versionNumber).toBe(2);
    expect(parsed.status).toBe("current");
  });

  it("accepts draft status", () => {
    const parsed = updatePageSchema.parse({
      title: "Draft",
      body: "<p>WIP</p>",
      versionNumber: 1,
      status: "draft",
    });
    expect(parsed.status).toBe("draft");
  });

  it("rejects non-positive version number", () => {
    expect(() =>
      updatePageSchema.parse({
        title: "Bad",
        body: "<p>X</p>",
        versionNumber: 0,
      }),
    ).toThrow();
  });

  it("rejects unknown fields via strict()", () => {
    expect(() =>
      updatePageSchema.parse({
        title: "Page",
        body: "<p>Hi</p>",
        versionNumber: 1,
        extra: true,
      }),
    ).toThrow();
  });
});

describe("updatePageBody", () => {
  it("builds correct body with page ID", () => {
    const body = updatePageBody("500", {
      title: "Updated Title",
      body: "<p>Updated</p>",
      versionNumber: 3,
      status: "current",
    });
    expect(body).toEqual({
      id: "500",
      title: "Updated Title",
      body: { representation: "storage", value: "<p>Updated</p>" },
      version: { number: 3 },
      status: "current",
    });
  });
});

describe("createCommentSchema", () => {
  it("validates correct input", () => {
    const parsed = createCommentSchema.parse({ body: "Nice!" });
    expect(parsed.body).toBe("Nice!");
  });

  it("rejects unknown fields via strict()", () => {
    expect(() =>
      createCommentSchema.parse({ body: "Hi", extra: true }),
    ).toThrow();
  });
});

describe("createCommentBody", () => {
  it("builds correct body", () => {
    const body = createCommentBody({ body: "Great work" });
    expect(body).toEqual({
      body: { representation: "storage", value: "Great work" },
    });
  });
});
