/** Confluence REST API v2 client. */

import { HttpClient } from "../http.js";
import type { AuthConfig } from "../auth.js";
import type {
  ConfluencePage,
  ConfluenceComment,
  ConfluencePageList,
  ConfluenceSpaceList,
  ConfluenceCommentList,
  ConfluenceSearchResult,
} from "./types.js";
import {
  createPageSchema,
  createPageBody,
  updatePageSchema,
  updatePageBody,
  createCommentSchema,
  createCommentBody,
} from "./schemas.js";
import type { CreatePageInput, UpdatePageInput } from "./schemas.js";

export class ConfluenceClient {
  readonly #http: HttpClient;

  constructor(httpOrAuth?: HttpClient | AuthConfig) {
    if (httpOrAuth instanceof HttpClient) {
      this.#http = httpOrAuth;
    } else {
      this.#http = new HttpClient(httpOrAuth);
    }
  }

  /** Create a new Confluence page. */
  async createPage(input: CreatePageInput): Promise<ConfluencePage> {
    const parsed = createPageSchema.parse(input);
    return this.#http.post<ConfluencePage>(
      "/wiki/api/v2/pages",
      createPageBody(parsed),
    );
  }

  /** Get a single page by ID with storage body format. */
  async getPage(pageId: string): Promise<ConfluencePage> {
    return this.#http.get<ConfluencePage>(`/wiki/api/v2/pages/${pageId}`, {
      "body-format": "storage",
    });
  }

  /** Update an existing page. */
  async updatePage(
    pageId: string,
    input: UpdatePageInput,
  ): Promise<ConfluencePage> {
    const parsed = updatePageSchema.parse(input);
    return this.#http.put<ConfluencePage>(
      `/wiki/api/v2/pages/${pageId}`,
      updatePageBody(pageId, parsed),
    );
  }

  /** List all spaces. */
  async listSpaces(limit = 25): Promise<ConfluenceSpaceList> {
    return this.#http.get<ConfluenceSpaceList>("/wiki/api/v2/spaces", {
      limit: String(limit),
    });
  }

  /** List pages in a space. */
  async listPagesInSpace(
    spaceId: string,
    limit = 25,
  ): Promise<ConfluencePageList> {
    return this.#http.get<ConfluencePageList>(
      `/wiki/api/v2/spaces/${spaceId}/pages`,
      { limit: String(limit) },
    );
  }

  /** List child pages of a page. */
  async listChildPages(
    pageId: string,
    limit = 25,
  ): Promise<ConfluencePageList> {
    return this.#http.get<ConfluencePageList>(
      `/wiki/api/v2/pages/${pageId}/children`,
      { limit: String(limit) },
    );
  }

  /** List footer comments on a page. */
  async listFooterComments(
    pageId: string,
  ): Promise<ConfluenceCommentList> {
    return this.#http.get<ConfluenceCommentList>(
      `/wiki/api/v2/pages/${pageId}/footer-comments`,
    );
  }

  /** Create a footer comment on a page. */
  async createFooterComment(
    pageId: string,
    body: string,
  ): Promise<ConfluenceComment> {
    const parsed = createCommentSchema.parse({ body });
    return this.#http.post<ConfluenceComment>(
      `/wiki/api/v2/pages/${pageId}/footer-comments`,
      createCommentBody(parsed),
    );
  }

  /** List inline comments on a page. */
  async listInlineComments(
    pageId: string,
  ): Promise<ConfluenceCommentList> {
    return this.#http.get<ConfluenceCommentList>(
      `/wiki/api/v2/pages/${pageId}/inline-comments`,
    );
  }

  /** Create an inline comment on a page. */
  async createInlineComment(
    pageId: string,
    body: string,
  ): Promise<ConfluenceComment> {
    const parsed = createCommentSchema.parse({ body });
    return this.#http.post<ConfluenceComment>(
      `/wiki/api/v2/pages/${pageId}/inline-comments`,
      createCommentBody(parsed),
    );
  }

  /** Search Confluence content using CQL (v1 REST API). */
  async searchByCql(
    cql: string,
    limit = 25,
  ): Promise<ConfluenceSearchResult> {
    return this.#http.get<ConfluenceSearchResult>("/wiki/rest/api/search", {
      cql,
      limit: String(limit),
    });
  }
}
