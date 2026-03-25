/**
 * JiraClient — high-level wrapper around Jira REST API v3.
 */

import { HttpClient } from "../http.js";
import type { AuthConfig } from "../auth.js";
import { ValidationError } from "../errors.js";
import type {
  JiraProject,
  JiraIssueType,
  JiraIssue,
  JiraTransition,
  JiraComment,
  JiraSearchResult,
  JiraCommentPage,
} from "./types.js";
import {
  createIssueSchema,
  createIssueBody,
  searchIssuesSchema,
  searchIssuesBody,
  transitionIssueBody,
  textToAdf,
} from "./schemas.js";
import type { CreateIssueInput, SearchIssuesInput } from "./schemas.js";

export class JiraClient {
  readonly #http: HttpClient;

  constructor(httpOrAuth?: HttpClient | AuthConfig) {
    if (httpOrAuth instanceof HttpClient) {
      this.#http = httpOrAuth;
    } else {
      this.#http = new HttpClient(httpOrAuth);
    }
  }

  /** List all visible projects. */
  async listProjects(): Promise<JiraProject[]> {
    return this.#http.get<JiraProject[]>("/rest/api/3/project");
  }

  /** List issue types for a project. */
  async listIssueTypes(projectKeyOrId: string): Promise<JiraIssueType[]> {
    const data = await this.#http.get<{
      issueTypes?: JiraIssueType[];
      values?: JiraIssueType[];
    }>(`/rest/api/3/issue/createmeta/${projectKeyOrId}/issuetypes`);
    return data.issueTypes ?? data.values ?? [];
  }

  /** Create a new issue and return the full issue object. */
  async createIssue(input: CreateIssueInput): Promise<JiraIssue> {
    const parsed = createIssueSchema.parse(input);
    const body = createIssueBody(parsed);
    const result = await this.#http.post<{
      id: string;
      key: string;
      self: string;
    }>("/rest/api/3/issue", body);
    return this.getIssue(result.key);
  }

  /** Get a single issue by key. */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    return this.#http.get<JiraIssue>(`/rest/api/3/issue/${issueKey}`);
  }

  /** Search issues using JQL. */
  async searchIssues(input: SearchIssuesInput): Promise<JiraSearchResult> {
    const parsed = searchIssuesSchema.parse(input);
    const body = searchIssuesBody(parsed);
    return this.#http.post<JiraSearchResult>("/rest/api/3/search/jql", body);
  }

  /** Transition an issue to a new status by name. */
  async transitionIssue(
    issueKey: string,
    statusName: string,
  ): Promise<void> {
    const data = await this.#http.get<{ transitions: JiraTransition[] }>(
      `/rest/api/3/issue/${issueKey}/transitions`,
    );
    const match = data.transitions.find(
      (t) => t.name.toLowerCase() === statusName.toLowerCase(),
    );
    if (!match) {
      const available = data.transitions.map((t) => t.name);
      throw new ValidationError(
        `Transition "${statusName}" not found. Available: ${available.join(", ")}`,
      );
    }
    const body = transitionIssueBody({ transitionId: match.id });
    await this.#http.post(
      `/rest/api/3/issue/${issueKey}/transitions`,
      body,
    );
  }

  /** Add a comment to an issue. */
  async addComment(issueKey: string, body: string): Promise<JiraComment> {
    return this.#http.post<JiraComment>(
      `/rest/api/3/issue/${issueKey}/comment`,
      { body: textToAdf(body) },
    );
  }

  /** List comments on an issue. */
  async listComments(issueKey: string): Promise<JiraCommentPage> {
    return this.#http.get<JiraCommentPage>(
      `/rest/api/3/issue/${issueKey}/comment`,
    );
  }
}
