import { describe, expect, it } from "vitest";

import type {
  JiraProject,
  JiraIssue,
  JiraSearchResult,
  JiraComment,
  JiraCommentPage,
  JiraTransition,
} from "../../src/jira/types.js";

describe("Jira type interfaces", () => {
  it("JiraProject fixture satisfies the interface", () => {
    const project: JiraProject = {
      id: "10001",
      key: "TEST",
      name: "Test Project",
      projectTypeKey: "software",
    };
    expect(project.id).toBe("10001");
    expect(project.key).toBe("TEST");
    expect(project.name).toBe("Test Project");
    expect(project.projectTypeKey).toBe("software");
  });

  it("JiraProject works without optional fields", () => {
    const project: JiraProject = { id: "10002", key: "MIN", name: "Minimal" };
    expect(project.projectTypeKey).toBeUndefined();
  });

  it("JiraIssue fixture satisfies the interface", () => {
    const issue: JiraIssue = {
      id: "10001",
      key: "TEST-1",
      self: "https://example.atlassian.net/rest/api/3/issue/10001",
      fields: {
        summary: "Test issue",
        status: { id: "1", name: "To Do" },
        issuetype: { id: "10001", name: "Task", subtask: false },
        priority: { id: "3", name: "Medium" },
        assignee: { accountId: "abc123", displayName: "Alice" },
        labels: ["bug", "urgent"],
        created: "2025-01-01T00:00:00.000+0000",
        updated: "2025-01-02T00:00:00.000+0000",
      },
    };
    expect(issue.key).toBe("TEST-1");
    expect(issue.fields.summary).toBe("Test issue");
    expect(issue.fields.assignee?.displayName).toBe("Alice");
    expect(issue.fields.labels).toEqual(["bug", "urgent"]);
  });

  it("JiraIssue works with null assignee", () => {
    const issue: JiraIssue = {
      id: "10002",
      key: "TEST-2",
      self: "https://example.atlassian.net/rest/api/3/issue/10002",
      fields: { summary: "Unassigned", assignee: null },
    };
    expect(issue.fields.assignee).toBeNull();
  });

  it("JiraSearchResult fixture satisfies the interface", () => {
    const result: JiraSearchResult = {
      issues: [],
      total: 0,
      startAt: 0,
      maxResults: 50,
    };
    expect(result.total).toBe(0);
    expect(result.issues).toEqual([]);
  });

  it("JiraComment fixture satisfies the interface", () => {
    const comment: JiraComment = {
      id: "100",
      body: { type: "doc", version: 1, content: [] },
      author: { accountId: "abc", displayName: "Bob" },
      created: "2025-01-01T00:00:00.000+0000",
    };
    expect(comment.id).toBe("100");
    expect(comment.author?.displayName).toBe("Bob");
  });

  it("JiraCommentPage fixture satisfies the interface", () => {
    const page: JiraCommentPage = {
      comments: [],
      total: 0,
      startAt: 0,
      maxResults: 25,
    };
    expect(page.comments).toEqual([]);
  });

  it("JiraTransition fixture satisfies the interface", () => {
    const transition: JiraTransition = {
      id: "31",
      name: "Done",
      to: { id: "10003", name: "Done" },
    };
    expect(transition.name).toBe("Done");
    expect(transition.to?.name).toBe("Done");
  });
});
