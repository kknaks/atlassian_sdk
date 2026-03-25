/**
 * Tests for MCP tool registration and dispatch.
 */

import { describe, expect, it, vi } from "vitest";

import { dispatchTool, TOOL_COUNT } from "../../src/mcp/tools.js";
import type { JiraClient } from "../../src/jira/index.js";
import type { ConfluenceClient } from "../../src/confluence/index.js";

/** Create a mock JiraClient with all methods stubbed. */
function mockJira(): JiraClient {
  return {
    listProjects: vi.fn().mockResolvedValue([{ key: "PROJ" }]),
    listIssueTypes: vi.fn().mockResolvedValue([{ name: "Task" }]),
    getIssue: vi.fn().mockResolvedValue({ key: "PROJ-1" }),
    searchIssues: vi.fn().mockResolvedValue({ issues: [] }),
    createIssue: vi.fn().mockResolvedValue({ key: "PROJ-2" }),
    transitionIssue: vi.fn().mockResolvedValue(undefined),
    addComment: vi.fn().mockResolvedValue({ id: "100" }),
    listComments: vi.fn().mockResolvedValue({ comments: [] }),
  } as unknown as JiraClient;
}

/** Create a mock ConfluenceClient with all methods stubbed. */
function mockConfluence(): ConfluenceClient {
  return {
    createPage: vi.fn().mockResolvedValue({ id: "1" }),
    getPage: vi.fn().mockResolvedValue({ id: "1", title: "Test" }),
    updatePage: vi.fn().mockResolvedValue({ id: "1" }),
    listSpaces: vi.fn().mockResolvedValue({ results: [] }),
    listPagesInSpace: vi.fn().mockResolvedValue({ results: [] }),
    listChildPages: vi.fn().mockResolvedValue({ results: [] }),
    listFooterComments: vi.fn().mockResolvedValue({ results: [] }),
    createFooterComment: vi.fn().mockResolvedValue({ id: "200" }),
    searchByCql: vi.fn().mockResolvedValue({ results: [] }),
  } as unknown as ConfluenceClient;
}

describe("TOOL_COUNT", () => {
  it("registers exactly 17 tools", () => {
    expect(TOOL_COUNT).toBe(22);
  });
});

describe("dispatchTool — Jira tools", () => {
  it("jira_list_projects calls listProjects", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    const result = await dispatchTool("jira_list_projects", {}, jira, confluence);
    expect(jira.listProjects).toHaveBeenCalledOnce();
    expect(result).toEqual([{ key: "PROJ" }]);
  });

  it("jira_list_issue_types calls listIssueTypes with project", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool("jira_list_issue_types", { project: "PROJ" }, jira, confluence);
    expect(jira.listIssueTypes).toHaveBeenCalledWith("PROJ");
  });

  it("jira_get_issue calls getIssue with key", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool("jira_get_issue", { key: "PROJ-1" }, jira, confluence);
    expect(jira.getIssue).toHaveBeenCalledWith("PROJ-1");
  });

  it("jira_search_issues calls searchIssues with jql and maxResults", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool("jira_search_issues", { jql: "project=PROJ", maxResults: 10 }, jira, confluence);
    expect(jira.searchIssues).toHaveBeenCalledWith({ jql: "project=PROJ", maxResults: 10 });
  });

  it("jira_search_issues defaults maxResults to 50", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool("jira_search_issues", { jql: "project=PROJ" }, jira, confluence);
    expect(jira.searchIssues).toHaveBeenCalledWith({ jql: "project=PROJ", maxResults: 50 });
  });

  it("jira_create_issue calls createIssue with full input", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool(
      "jira_create_issue",
      { projectKey: "PROJ", summary: "Do something", issueTypeName: "Bug", description: "Details" },
      jira,
      confluence,
    );
    expect(jira.createIssue).toHaveBeenCalledWith({
      projectKey: "PROJ",
      summary: "Do something",
      issueTypeName: "Bug",
      description: "Details",
      assigneeId: undefined,
      labels: undefined,
      parentKey: undefined,
    });
  });

  it("jira_transition_issue calls transitionIssue and returns success", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    const result = await dispatchTool(
      "jira_transition_issue",
      { key: "PROJ-1", status: "Done" },
      jira,
      confluence,
    );
    expect(jira.transitionIssue).toHaveBeenCalledWith("PROJ-1", "Done");
    expect(result).toEqual({ success: true });
  });

  it("jira_add_comment calls addComment", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool("jira_add_comment", { key: "PROJ-1", body: "Hello" }, jira, confluence);
    expect(jira.addComment).toHaveBeenCalledWith("PROJ-1", "Hello");
  });

  it("jira_list_comments calls listComments", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool("jira_list_comments", { key: "PROJ-1" }, jira, confluence);
    expect(jira.listComments).toHaveBeenCalledWith("PROJ-1");
  });
});

describe("dispatchTool — Confluence tools", () => {
  it("confluence_list_spaces calls listSpaces", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    const result = await dispatchTool("confluence_list_spaces", {}, jira, confluence);
    expect(confluence.listSpaces).toHaveBeenCalledOnce();
    expect(result).toEqual({ results: [] });
  });

  it("confluence_create_page calls createPage", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool(
      "confluence_create_page",
      { spaceId: "SP1", title: "My Page", body: "<p>Hi</p>", parentId: "100" },
      jira,
      confluence,
    );
    expect(confluence.createPage).toHaveBeenCalledWith({
      spaceId: "SP1",
      title: "My Page",
      body: "<p>Hi</p>",
      parentId: "100",
      status: "current",
    });
  });

  it("confluence_get_page calls getPage", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool("confluence_get_page", { pageId: "42" }, jira, confluence);
    expect(confluence.getPage).toHaveBeenCalledWith("42");
  });

  it("confluence_update_page calls updatePage", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool(
      "confluence_update_page",
      { pageId: "42", title: "Updated", body: "<p>New</p>", versionNumber: 2 },
      jira,
      confluence,
    );
    expect(confluence.updatePage).toHaveBeenCalledWith("42", {
      title: "Updated",
      body: "<p>New</p>",
      versionNumber: 2,
      status: "current",
    });
  });

  it("confluence_list_pages_in_space calls listPagesInSpace", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool("confluence_list_pages_in_space", { spaceId: "SP1" }, jira, confluence);
    expect(confluence.listPagesInSpace).toHaveBeenCalledWith("SP1");
  });

  it("confluence_list_child_pages calls listChildPages", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool("confluence_list_child_pages", { pageId: "42" }, jira, confluence);
    expect(confluence.listChildPages).toHaveBeenCalledWith("42");
  });

  it("confluence_list_footer_comments calls listFooterComments", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool("confluence_list_footer_comments", { pageId: "42" }, jira, confluence);
    expect(confluence.listFooterComments).toHaveBeenCalledWith("42");
  });

  it("confluence_add_footer_comment calls createFooterComment", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool(
      "confluence_add_footer_comment",
      { pageId: "42", body: "Nice!" },
      jira,
      confluence,
    );
    expect(confluence.createFooterComment).toHaveBeenCalledWith("42", "Nice!");
  });

  it("confluence_search calls searchByCql with defaults", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool("confluence_search", { cql: "type=page" }, jira, confluence);
    expect(confluence.searchByCql).toHaveBeenCalledWith("type=page", 25);
  });

  it("confluence_search passes custom limit", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await dispatchTool("confluence_search", { cql: "type=page", limit: 10 }, jira, confluence);
    expect(confluence.searchByCql).toHaveBeenCalledWith("type=page", 10);
  });
});

describe("dispatchTool — error handling", () => {
  it("throws for unknown tool name", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    await expect(
      dispatchTool("nonexistent_tool", {}, jira, confluence),
    ).rejects.toThrow("Unknown tool: nonexistent_tool");
  });

  it("propagates client errors", async () => {
    const jira = mockJira();
    const confluence = mockConfluence();
    vi.mocked(jira.listProjects).mockRejectedValue(new Error("Network failure"));
    await expect(
      dispatchTool("jira_list_projects", {}, jira, confluence),
    ).rejects.toThrow("Network failure");
  });
});
