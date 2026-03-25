import { describe, expect, it, vi, beforeEach } from "vitest";

import { HttpClient } from "../../src/http.js";
import { ConfluenceClient } from "../../src/confluence/client.js";
import type {
  ConfluencePage,
  ConfluenceComment,
  ConfluencePageList,
  ConfluenceSpaceList,
  ConfluenceCommentList,
  ConfluenceSearchResult,
} from "../../src/confluence/types.js";

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

function mockPut(http: HttpClient): ReturnType<typeof vi.fn> {
  return http.put as unknown as ReturnType<typeof vi.fn>;
}

describe("ConfluenceClient", () => {
  let http: HttpClient;
  let client: ConfluenceClient;

  beforeEach(() => {
    http = createMockHttp();
    client = new ConfluenceClient(http);
  });

  describe("createPage", () => {
    it("POSTs to /wiki/api/v2/pages with correct body", async () => {
      const page: ConfluencePage = {
        id: "200",
        title: "New Page",
        spaceId: "100",
      };
      mockPost(http).mockResolvedValueOnce(page);

      const result = await client.createPage({
        spaceId: "100",
        title: "New Page",
        body: "<p>Hello</p>",
      });

      expect(mockPost(http)).toHaveBeenCalledWith("/wiki/api/v2/pages", {
        spaceId: "100",
        title: "New Page",
        body: { representation: "storage", value: "<p>Hello</p>" },
        status: "current",
      });
      expect(result).toEqual(page);
    });

    it("includes parentId when provided", async () => {
      const page: ConfluencePage = {
        id: "201",
        title: "Child",
        spaceId: "100",
        parentId: "200",
      };
      mockPost(http).mockResolvedValueOnce(page);

      await client.createPage({
        spaceId: "100",
        title: "Child",
        body: "<p>Sub</p>",
        parentId: "200",
      });

      expect(mockPost(http)).toHaveBeenCalledWith("/wiki/api/v2/pages", {
        spaceId: "100",
        title: "Child",
        body: { representation: "storage", value: "<p>Sub</p>" },
        status: "current",
        parentId: "200",
      });
    });
  });

  describe("getPage", () => {
    it("calls GET /wiki/api/v2/pages/{id} with body-format param", async () => {
      const page: ConfluencePage = {
        id: "200",
        title: "My Page",
        spaceId: "100",
      };
      mockGet(http).mockResolvedValueOnce(page);

      const result = await client.getPage("200");

      expect(mockGet(http)).toHaveBeenCalledWith("/wiki/api/v2/pages/200", {
        "body-format": "storage",
      });
      expect(result).toEqual(page);
    });
  });

  describe("updatePage", () => {
    it("PUTs to /wiki/api/v2/pages/{id} with correct body", async () => {
      const page: ConfluencePage = {
        id: "200",
        title: "Updated",
        spaceId: "100",
      };
      mockPut(http).mockResolvedValueOnce(page);

      const result = await client.updatePage("200", {
        title: "Updated",
        body: "<p>New content</p>",
        versionNumber: 2,
      });

      expect(mockPut(http)).toHaveBeenCalledWith("/wiki/api/v2/pages/200", {
        id: "200",
        title: "Updated",
        body: { representation: "storage", value: "<p>New content</p>" },
        version: { number: 2 },
        status: "current",
      });
      expect(result).toEqual(page);
    });
  });

  describe("listSpaces", () => {
    it("calls GET /wiki/api/v2/spaces and returns unwrapped array", async () => {
      const spaces: ConfluenceSpaceList = {
        results: [{ id: "100", key: "DEV", name: "Dev" }],
      };
      mockGet(http).mockResolvedValueOnce(spaces);

      const result = await client.listSpaces();

      expect(mockGet(http)).toHaveBeenCalledWith("/wiki/api/v2/spaces", {
        limit: "25",
      });
      expect(result).toEqual([{ id: "100", key: "DEV", name: "Dev" }]);
    });

    it("passes custom limit", async () => {
      mockGet(http).mockResolvedValueOnce({ results: [] });

      await client.listSpaces(10);

      expect(mockGet(http)).toHaveBeenCalledWith("/wiki/api/v2/spaces", {
        limit: "10",
      });
    });
  });

  describe("listPagesInSpace", () => {
    it("calls GET /wiki/api/v2/spaces/{id}/pages and returns array", async () => {
      const pages: ConfluencePageList = { results: [] };
      mockGet(http).mockResolvedValueOnce(pages);

      const result = await client.listPagesInSpace("100");

      expect(mockGet(http)).toHaveBeenCalledWith(
        "/wiki/api/v2/spaces/100/pages",
        { limit: "25" },
      );
      expect(result).toEqual([]);
    });
  });

  describe("listChildPages", () => {
    it("calls GET /wiki/api/v2/pages/{id}/children and returns array", async () => {
      const pages: ConfluencePageList = { results: [] };
      mockGet(http).mockResolvedValueOnce(pages);

      const result = await client.listChildPages("200");

      expect(mockGet(http)).toHaveBeenCalledWith(
        "/wiki/api/v2/pages/200/children",
        { limit: "25" },
      );
      expect(result).toEqual([]);
    });
  });

  describe("listFooterComments", () => {
    it("calls GET /wiki/api/v2/pages/{id}/footer-comments and returns array", async () => {
      const comments: ConfluenceCommentList = { results: [] };
      mockGet(http).mockResolvedValueOnce(comments);

      const result = await client.listFooterComments("200");

      expect(mockGet(http)).toHaveBeenCalledWith(
        "/wiki/api/v2/pages/200/footer-comments",
      );
      expect(result).toEqual([]);
    });
  });

  describe("createFooterComment", () => {
    it("POSTs to /wiki/api/v2/pages/{id}/footer-comments", async () => {
      const comment: ConfluenceComment = { id: "300" };
      mockPost(http).mockResolvedValueOnce(comment);

      const result = await client.createFooterComment("200", "Nice page!");

      expect(mockPost(http)).toHaveBeenCalledWith(
        "/wiki/api/v2/pages/200/footer-comments",
        { body: { representation: "storage", value: "Nice page!" } },
      );
      expect(result).toEqual(comment);
    });
  });

  describe("listInlineComments", () => {
    it("calls GET /wiki/api/v2/pages/{id}/inline-comments and returns array", async () => {
      const comments: ConfluenceCommentList = { results: [] };
      mockGet(http).mockResolvedValueOnce(comments);

      const result = await client.listInlineComments("200");

      expect(mockGet(http)).toHaveBeenCalledWith(
        "/wiki/api/v2/pages/200/inline-comments",
      );
      expect(result).toEqual([]);
    });
  });

  describe("createInlineComment", () => {
    it("POSTs to /wiki/api/v2/pages/{id}/inline-comments", async () => {
      const comment: ConfluenceComment = { id: "301" };
      mockPost(http).mockResolvedValueOnce(comment);

      const result = await client.createInlineComment("200", "Fix typo");

      expect(mockPost(http)).toHaveBeenCalledWith(
        "/wiki/api/v2/pages/200/inline-comments",
        { body: { representation: "storage", value: "Fix typo" } },
      );
      expect(result).toEqual(comment);
    });
  });

  describe("searchByCql", () => {
    it("calls GET /wiki/rest/api/search (v1 endpoint) with CQL params", async () => {
      const searchResult: ConfluenceSearchResult = {
        results: [{ title: "Found Page", excerpt: "...match..." }],
      };
      mockGet(http).mockResolvedValueOnce(searchResult);

      const result = await client.searchByCql("type = page AND title ~ 'test'");

      expect(mockGet(http)).toHaveBeenCalledWith("/wiki/rest/api/search", {
        cql: "type = page AND title ~ 'test'",
        limit: "25",
      });
      expect(result).toEqual(searchResult);
    });

    it("passes custom limit", async () => {
      mockGet(http).mockResolvedValueOnce({ results: [] });

      await client.searchByCql("space = DEV", 10);

      expect(mockGet(http)).toHaveBeenCalledWith("/wiki/rest/api/search", {
        cql: "space = DEV",
        limit: "10",
      });
    });
  });
});
