/** Confluence REST API v2 client. */

import { HttpClient } from "../http.js";
import type { AuthConfig } from "../auth.js";
import type {
  ConfluencePage,
  ConfluenceSpace,
  ConfluenceComment,
  ConfluenceSpaceList,
  ConfluenceCommentList,
  ConfluenceSearchResult,
} from "./types.js";
import { stripSpace, stripPage, stripComment } from "./types.js";
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
    const raw = await this.#http.post<Record<string, unknown>>(
      "/wiki/api/v2/pages",
      createPageBody(parsed),
    );
    return stripPage(raw);
  }

  /** Get a single page by ID with storage body format. */
  async getPage(pageId: string): Promise<ConfluencePage> {
    const raw = await this.#http.get<Record<string, unknown>>(`/wiki/api/v2/pages/${pageId}`, {
      "body-format": "storage",
    });
    return stripPage(raw);
  }

  /** Update an existing page. */
  async updatePage(
    pageId: string,
    input: UpdatePageInput,
  ): Promise<ConfluencePage> {
    const parsed = updatePageSchema.parse(input);
    const raw = await this.#http.put<Record<string, unknown>>(
      `/wiki/api/v2/pages/${pageId}`,
      updatePageBody(pageId, parsed),
    );
    return stripPage(raw);
  }

  /** List all spaces (returns stripped array). */
  async listSpaces(limit = 25): Promise<ConfluenceSpace[]> {
    const result = await this.#http.get<ConfluenceSpaceList>("/wiki/api/v2/spaces", {
      limit: String(limit),
    });
    return result.results.map((s) => stripSpace(s as unknown as Record<string, unknown>));
  }

  /** List pages in a space (returns stripped array). */
  async listPagesInSpace(
    spaceId: string,
    limit = 25,
  ): Promise<ConfluencePage[]> {
    const result = await this.#http.get<{ results: Record<string, unknown>[] }>(
      `/wiki/api/v2/spaces/${spaceId}/pages`,
      { limit: String(limit) },
    );
    return result.results.map(stripPage);
  }

  /** List child pages of a page (returns stripped array). */
  async listChildPages(
    pageId: string,
    limit = 25,
  ): Promise<ConfluencePage[]> {
    const result = await this.#http.get<{ results: Record<string, unknown>[] }>(
      `/wiki/api/v2/pages/${pageId}/children`,
      { limit: String(limit) },
    );
    return result.results.map(stripPage);
  }

  /** List footer comments on a page (returns stripped array). */
  async listFooterComments(
    pageId: string,
  ): Promise<ConfluenceComment[]> {
    const result = await this.#http.get<ConfluenceCommentList>(
      `/wiki/api/v2/pages/${pageId}/footer-comments`,
    );
    return result.results.map((c) => stripComment(c as unknown as Record<string, unknown>));
  }

  /** Create a footer comment on a page. */
  async createFooterComment(
    pageId: string,
    body: string,
  ): Promise<ConfluenceComment> {
    const parsed = createCommentSchema.parse({ body });
    const raw = await this.#http.post<Record<string, unknown>>(
      `/wiki/api/v2/pages/${pageId}/footer-comments`,
      createCommentBody(parsed),
    );
    return stripComment(raw);
  }

  /** List inline comments on a page (returns stripped array). */
  async listInlineComments(
    pageId: string,
  ): Promise<ConfluenceComment[]> {
    const result = await this.#http.get<ConfluenceCommentList>(
      `/wiki/api/v2/pages/${pageId}/inline-comments`,
    );
    return result.results.map((c) => stripComment(c as unknown as Record<string, unknown>));
  }

  /** Create an inline comment on a page. */
  async createInlineComment(
    pageId: string,
    body: string,
  ): Promise<ConfluenceComment> {
    const parsed = createCommentSchema.parse({ body });
    const raw = await this.#http.post<Record<string, unknown>>(
      `/wiki/api/v2/pages/${pageId}/inline-comments`,
      createCommentBody(parsed),
    );
    return stripComment(raw);
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
