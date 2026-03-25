import { describe, expect, it } from "vitest";

import {
  textToAdf,
  createIssueSchema,
  createIssueBody,
  searchIssuesSchema,
  searchIssuesBody,
  transitionIssueSchema,
  transitionIssueBody,
} from "../../src/jira/schemas.js";

describe("textToAdf", () => {
  it("wraps plain text in ADF format", () => {
    const adf = textToAdf("Hello world");
    expect(adf).toEqual({
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    });
  });
});

describe("createIssueSchema", () => {
  it("validates correct input", () => {
    const input = { projectKey: "TEST", summary: "A task" };
    const parsed = createIssueSchema.parse(input);
    expect(parsed.projectKey).toBe("TEST");
    expect(parsed.summary).toBe("A task");
    expect(parsed.issueTypeName).toBe("Task");
  });

  it("applies default issueTypeName", () => {
    const parsed = createIssueSchema.parse({
      projectKey: "P",
      summary: "S",
    });
    expect(parsed.issueTypeName).toBe("Task");
  });

  it("accepts all optional fields", () => {
    const parsed = createIssueSchema.parse({
      projectKey: "TEST",
      summary: "Full",
      issueTypeName: "Bug",
      description: "Some description",
      assigneeId: "abc123",
      labels: ["urgent"],
      parentKey: "TEST-1",
    });
    expect(parsed.description).toBe("Some description");
    expect(parsed.assigneeId).toBe("abc123");
    expect(parsed.labels).toEqual(["urgent"]);
    expect(parsed.parentKey).toBe("TEST-1");
  });

  it("rejects unknown fields via strict()", () => {
    expect(() =>
      createIssueSchema.parse({
        projectKey: "TEST",
        summary: "A task",
        unknownField: "bad",
      }),
    ).toThrow();
  });
});

describe("createIssueBody", () => {
  it("builds minimal body", () => {
    const body = createIssueBody({
      summary: "Task",
      issueTypeName: "Task",
      resolvedProjectKey: "TEST",
    });
    expect(body).toEqual({
      fields: {
        project: { key: "TEST" },
        summary: "Task",
        issuetype: { name: "Task" },
      },
    });
  });

  it("includes ADF description when provided", () => {
    const body = createIssueBody({
      summary: "Task",
      issueTypeName: "Task",
      description: "My desc",
      resolvedProjectKey: "TEST",
    });
    const fields = body.fields as Record<string, unknown>;
    expect(fields.description).toEqual(textToAdf("My desc"));
  });

  it("includes assignee, labels, and parent when provided", () => {
    const body = createIssueBody({
      summary: "Sub",
      issueTypeName: "Sub-task",
      assigneeId: "user1",
      labels: ["a", "b"],
      resolvedProjectKey: "TEST",
      resolvedParentKey: "TEST-1",
    });
    const fields = body.fields as Record<string, unknown>;
    expect(fields.assignee).toEqual({ id: "user1" });
    expect(fields.labels).toEqual(["a", "b"]);
    expect(fields.parent).toEqual({ key: "TEST-1" });
  });
});

describe("searchIssuesSchema", () => {
  it("validates correct input with defaults", () => {
    const parsed = searchIssuesSchema.parse({ jql: "project = TEST" });
    expect(parsed.jql).toBe("project = TEST");
    expect(parsed.maxResults).toBe(50);
  });

  it("accepts optional fields", () => {
    const parsed = searchIssuesSchema.parse({
      jql: "assignee = me",
      maxResults: 10,
      fields: ["summary", "status"],
    });
    expect(parsed.maxResults).toBe(10);
    expect(parsed.fields).toEqual(["summary", "status"]);
  });

  it("rejects unknown fields via strict()", () => {
    expect(() =>
      searchIssuesSchema.parse({ jql: "test", extra: true }),
    ).toThrow();
  });
});

describe("searchIssuesBody", () => {
  it("builds body with default fields when none provided", () => {
    const body = searchIssuesBody({ jql: "project = X", maxResults: 50 });
    expect(body.jql).toBe("project = X");
    expect(body.maxResults).toBe(50);
    expect(body.fields).toBeInstanceOf(Array);
    expect((body.fields as string[]).length).toBeGreaterThan(0);
    expect(body.fields).toContain("summary");
    expect(body.fields).toContain("status");
  });

  it("includes fields when provided", () => {
    const body = searchIssuesBody({
      jql: "project = X",
      maxResults: 10,
      fields: ["summary"],
    });
    expect(body).toEqual({
      jql: "project = X",
      maxResults: 10,
      fields: ["summary"],
    });
  });
});

describe("transitionIssueSchema", () => {
  it("validates correct input", () => {
    const parsed = transitionIssueSchema.parse({ transitionId: "31" });
    expect(parsed.transitionId).toBe("31");
  });

  it("rejects unknown fields via strict()", () => {
    expect(() =>
      transitionIssueSchema.parse({ transitionId: "31", extra: true }),
    ).toThrow();
  });
});

describe("transitionIssueBody", () => {
  it("builds correct body", () => {
    const body = transitionIssueBody({ transitionId: "31" });
    expect(body).toEqual({ transition: { id: "31" } });
  });
});
