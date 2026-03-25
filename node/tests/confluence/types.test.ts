import { describe, expect, it } from "vitest";

import type {
  ConfluenceSpace,
  ConfluencePage,
  ConfluenceComment,
  ConfluencePageList,
  ConfluenceSpaceList,
  ConfluenceCommentList,
  ConfluenceSearchResult,
} from "../../src/confluence/types.js";

describe("Confluence type interfaces", () => {
  it("ConfluenceSpace fixture satisfies the interface", () => {
    const space: ConfluenceSpace = {
      id: "100",
      key: "DEV",
      name: "Development",
      type: "global",
      status: "current",
    };
    expect(space.id).toBe("100");
    expect(space.key).toBe("DEV");
    expect(space.name).toBe("Development");
    expect(space.type).toBe("global");
    expect(space.status).toBe("current");
  });

  it("ConfluenceSpace works without optional fields", () => {
    const space: ConfluenceSpace = { id: "101", key: "MIN", name: "Minimal" };
    expect(space.type).toBeUndefined();
    expect(space.status).toBeUndefined();
  });

  it("ConfluencePage fixture satisfies the interface", () => {
    const page: ConfluencePage = {
      id: "200",
      title: "Getting Started",
      spaceId: "100",
      status: "current",
      parentId: "199",
      version: { number: 3, message: "Updated intro" },
      body: { storage: { value: "<p>Hello</p>", representation: "storage" } },
      _links: { webui: "/wiki/spaces/DEV/pages/200", base: "https://example.atlassian.net" },
    };
    expect(page.id).toBe("200");
    expect(page.title).toBe("Getting Started");
    expect(page.spaceId).toBe("100");
    expect(page.version?.number).toBe(3);
    expect(page.body?.storage?.value).toBe("<p>Hello</p>");
    expect(page._links?.webui).toBe("/wiki/spaces/DEV/pages/200");
  });

  it("ConfluencePage works without optional fields", () => {
    const page: ConfluencePage = { id: "201", title: "Bare", spaceId: "100" };
    expect(page.status).toBeUndefined();
    expect(page.parentId).toBeUndefined();
    expect(page.version).toBeUndefined();
    expect(page.body).toBeUndefined();
  });

  it("ConfluenceComment fixture satisfies the interface", () => {
    const comment: ConfluenceComment = {
      id: "300",
      status: "current",
      title: "Re: Page",
      body: { storage: { value: "<p>Looks good</p>", representation: "storage" } },
    };
    expect(comment.id).toBe("300");
    expect(comment.status).toBe("current");
    expect(comment.body?.storage?.value).toBe("<p>Looks good</p>");
  });

  it("ConfluenceComment works without optional fields", () => {
    const comment: ConfluenceComment = { id: "301" };
    expect(comment.status).toBeUndefined();
    expect(comment.title).toBeUndefined();
    expect(comment.body).toBeUndefined();
  });

  it("ConfluencePageList fixture satisfies the interface", () => {
    const list: ConfluencePageList = {
      results: [{ id: "200", title: "Page", spaceId: "100" }],
      _links: { next: "/wiki/api/v2/spaces/100/pages?cursor=abc" },
    };
    expect(list.results).toHaveLength(1);
    expect(list._links?.next).toContain("cursor");
  });

  it("ConfluenceSpaceList fixture satisfies the interface", () => {
    const list: ConfluenceSpaceList = {
      results: [{ id: "100", key: "DEV", name: "Dev" }],
    };
    expect(list.results).toHaveLength(1);
    expect(list._links).toBeUndefined();
  });

  it("ConfluenceCommentList fixture satisfies the interface", () => {
    const list: ConfluenceCommentList = { results: [] };
    expect(list.results).toEqual([]);
  });

  it("ConfluenceSearchResult fixture satisfies the interface", () => {
    const result: ConfluenceSearchResult = {
      results: [
        {
          content: { id: "200", title: "Found", spaceId: "100" },
          title: "Found",
          excerpt: "...match...",
          url: "/wiki/spaces/DEV/pages/200",
        },
      ],
      _links: { next: "/wiki/rest/api/search?cursor=xyz" },
    };
    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe("Found");
    expect(result.results[0].excerpt).toBe("...match...");
  });
});
