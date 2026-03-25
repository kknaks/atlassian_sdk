import { describe, expect, it, vi, beforeEach } from "vitest";

import { HttpClient } from "../../src/http.js";
import { ValidationError } from "../../src/errors.js";
import { JiraClient } from "../../src/jira/client.js";
import type {
  JiraProject,
  JiraIssue,
  JiraSearchResult,
  JiraComment,
  JiraCommentPage,
} from "../../src/jira/types.js";

/** Create a mock HttpClient with stubbed get/post/put methods. */
function createMockHttp(): HttpClient {
  const mock = Object.create(HttpClient.prototype) as HttpClient;
  (mock as unknown as Record<string, unknown>).get = vi.fn();
  (mock as unknown as Record<string, unknown>).post = vi.fn();
  (mock as unknown as Record<string, unknown>).put = vi.fn();
  return mock;
}

function mockGet(http: HttpClient): ReturnType<typeof vi.fn> {
  return http.get as unknown as ReturnType<typeof vi.fn>;
}

function mockPost(http: HttpClient): ReturnType<typeof vi.fn> {
  return http.post as unknown as ReturnType<typeof vi.fn>;
}

describe("JiraClient", () => {
  let http: HttpClient;
  let client: JiraClient;

  beforeEach(() => {
    http = createMockHttp();
    client = new JiraClient(http);
  });

  describe("listProjects", () => {
    it("calls GET /rest/api/3/project and returns projects", async () => {
      const projects: JiraProject[] = [
        { id: "1", key: "TEST", name: "Test" },
      ];
      mockGet(http).mockResolvedValueOnce(projects);

      const result = await client.listProjects();

      expect(mockGet(http)).toHaveBeenCalledWith("/rest/api/3/project");
      expect(result).toEqual(projects);
    });
  });

  describe("listIssueTypes", () => {
    it("calls GET createmeta endpoint and returns issueTypes", async () => {
      const issueTypes = [
        { id: "1", name: "Task", subtask: false },
        { id: "2", name: "Sub-task", subtask: true },
      ];
      mockGet(http).mockResolvedValueOnce({ issueTypes });

      const result = await client.listIssueTypes("TEST");

      expect(mockGet(http)).toHaveBeenCalledWith(
        "/rest/api/3/issue/createmeta/TEST/issuetypes",
      );
      expect(result).toEqual(issueTypes);
    });

    it("falls back to values key", async () => {
      const values = [{ id: "1", name: "Bug", subtask: false }];
      mockGet(http).mockResolvedValueOnce({ values });

      const result = await client.listIssueTypes("PROJ");
      expect(result).toEqual(values);
    });

    it("returns empty array when neither key exists", async () => {
      mockGet(http).mockResolvedValueOnce({});
      const result = await client.listIssueTypes("EMPTY");
      expect(result).toEqual([]);
    });
  });

  describe("createIssue", () => {
    it("POSTs to create issue then GETs the full issue", async () => {
      const createResponse = {
        id: "10001",
        key: "TEST-1",
        self: "https://example.atlassian.net/rest/api/3/issue/10001",
      };
      const fullIssue: JiraIssue = {
        id: "10001",
        key: "TEST-1",
        self: createResponse.self,
        fields: { summary: "New task" },
      };

      mockPost(http).mockResolvedValueOnce(createResponse);
      mockGet(http).mockResolvedValueOnce(fullIssue);

      const result = await client.createIssue({
        projectKey: "TEST",
        summary: "New task",
        description: "Details here",
      });

      expect(mockPost(http)).toHaveBeenCalledWith(
        "/rest/api/3/issue",
        expect.objectContaining({
          fields: expect.objectContaining({
            project: { key: "TEST" },
            summary: "New task",
            issuetype: { name: "Task" },
            description: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Details here" }],
                },
              ],
            },
          }),
        }),
      );
      expect(mockGet(http)).toHaveBeenCalledWith(
        "/rest/api/3/issue/TEST-1",
      );
      expect(result).toEqual(fullIssue);
    });
  });

  describe("getIssue", () => {
    it("calls GET /rest/api/3/issue/{key}", async () => {
      const issue: JiraIssue = {
        id: "10001",
        key: "TEST-1",
        self: "https://example.atlassian.net/rest/api/3/issue/10001",
        fields: { summary: "Some issue" },
      };
      mockGet(http).mockResolvedValueOnce(issue);

      const result = await client.getIssue("TEST-1");

      expect(mockGet(http)).toHaveBeenCalledWith(
        "/rest/api/3/issue/TEST-1",
      );
      expect(result).toEqual(issue);
    });
  });

  describe("searchIssues", () => {
    it("POSTs to /rest/api/3/search/jql", async () => {
      const searchResult: JiraSearchResult = {
        issues: [],
        total: 0,
        startAt: 0,
        maxResults: 50,
      };
      mockPost(http).mockResolvedValueOnce(searchResult);

      const result = await client.searchIssues({
        jql: "project = TEST",
      });

      expect(mockPost(http)).toHaveBeenCalledWith(
        "/rest/api/3/search/jql",
        { jql: "project = TEST", maxResults: 50 },
      );
      expect(result).toEqual(searchResult);
    });
  });

  describe("transitionIssue", () => {
    it("finds transition by name and POSTs", async () => {
      mockGet(http).mockResolvedValueOnce({
        transitions: [
          { id: "21", name: "In Progress" },
          { id: "31", name: "Done" },
        ],
      });
      mockPost(http).mockResolvedValueOnce(undefined);

      await client.transitionIssue("TEST-1", "Done");

      expect(mockGet(http)).toHaveBeenCalledWith(
        "/rest/api/3/issue/TEST-1/transitions",
      );
      expect(mockPost(http)).toHaveBeenCalledWith(
        "/rest/api/3/issue/TEST-1/transitions",
        { transition: { id: "31" } },
      );
    });

    it("matches transition name case-insensitively", async () => {
      mockGet(http).mockResolvedValueOnce({
        transitions: [{ id: "31", name: "Done" }],
      });
      mockPost(http).mockResolvedValueOnce(undefined);

      await client.transitionIssue("TEST-1", "done");

      expect(mockPost(http)).toHaveBeenCalledWith(
        "/rest/api/3/issue/TEST-1/transitions",
        { transition: { id: "31" } },
      );
    });

    it("throws ValidationError when transition not found", async () => {
      mockGet(http).mockResolvedValueOnce({
        transitions: [{ id: "21", name: "In Progress" }],
      });

      await expect(
        client.transitionIssue("TEST-1", "Nonexistent"),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("addComment", () => {
    it("POSTs comment with ADF body", async () => {
      const comment: JiraComment = {
        id: "100",
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Nice work!" }],
            },
          ],
        },
      };
      mockPost(http).mockResolvedValueOnce(comment);

      const result = await client.addComment("TEST-1", "Nice work!");

      expect(mockPost(http)).toHaveBeenCalledWith(
        "/rest/api/3/issue/TEST-1/comment",
        {
          body: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Nice work!" }],
              },
            ],
          },
        },
      );
      expect(result).toEqual(comment);
    });
  });

  describe("listComments", () => {
    it("calls GET /rest/api/3/issue/{key}/comment", async () => {
      const page: JiraCommentPage = {
        comments: [],
        total: 0,
        startAt: 0,
        maxResults: 25,
      };
      mockGet(http).mockResolvedValueOnce(page);

      const result = await client.listComments("TEST-1");

      expect(mockGet(http)).toHaveBeenCalledWith(
        "/rest/api/3/issue/TEST-1/comment",
      );
      expect(result).toEqual(page);
    });
  });
});
