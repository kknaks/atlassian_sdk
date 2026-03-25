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

/** Options for JiraClient constructor. */
export interface JiraClientOptions {
  /** HttpClient or AuthConfig for authentication. */
  auth?: HttpClient | AuthConfig;
  /** Default project key. Falls back to PYACLI_DEFAULT_PROJECT env var. */
  project?: string;
  /** Epic name → issue key mapping. Falls back to PYACLI_EPIC_MAP env var. */
  epicMap?: Record<string, string>;
}

/**
 * Load epic mapping from PYACLI_EPIC_MAP environment variable.
 * Format: "frontend:WNVO-9,backend:WNVO-23,ai:WNVO-24"
 */
function loadEpicMap(): Record<string, string> {
  let raw = "";
  try {
    raw = process.env["PYACLI_EPIC_MAP"] ?? "";
  } catch {
    return {};
  }
  if (!raw) return {};
  const result: Record<string, string> = {};
  for (const pair of raw.split(",")) {
    const trimmed = pair.trim();
    const idx = trimmed.indexOf(":");
    if (idx > 0) {
      result[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
  return result;
}

function resolveDefaultProject(): string {
  try {
    return process.env["PYACLI_DEFAULT_PROJECT"] ?? "";
  } catch {
    return "";
  }
}

export class JiraClient {
  readonly #http: HttpClient;
  readonly #project: string;
  readonly #epicMap: Record<string, string>;

  constructor(optsOrAuth?: JiraClientOptions | HttpClient | AuthConfig) {
    if (optsOrAuth instanceof HttpClient) {
      this.#http = optsOrAuth;
      this.#project = resolveDefaultProject();
      this.#epicMap = loadEpicMap();
    } else if (optsOrAuth && "auth" in optsOrAuth) {
      const opts = optsOrAuth as JiraClientOptions;
      if (opts.auth instanceof HttpClient) {
        this.#http = opts.auth;
      } else {
        this.#http = new HttpClient(opts.auth);
      }
      this.#project = opts.project ?? resolveDefaultProject();
      this.#epicMap = opts.epicMap ?? loadEpicMap();
    } else {
      this.#http = new HttpClient(optsOrAuth as AuthConfig | undefined);
      this.#project = resolveDefaultProject();
      this.#epicMap = loadEpicMap();
    }
  }

  /** Current default project key. */
  get project(): string {
    return this.#project;
  }

  /** Current epic name → issue key mapping. */
  get epics(): Record<string, string> {
    return { ...this.#epicMap };
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

  /**
   * Create a new issue and return the full issue object.
   *
   * - If `projectKey` is omitted, falls back to the default project.
   * - If `epic` is provided, resolves it to a parent key via epicMap.
   * - `parentKey` takes precedence over `epic`.
   */
  async createIssue(input: CreateIssueInput): Promise<JiraIssue> {
    const parsed = createIssueSchema.parse(input);

    // Resolve project
    const resolvedProjectKey = parsed.projectKey || this.#project;
    if (!resolvedProjectKey) {
      throw new ValidationError(
        "No project specified and no default project set",
      );
    }

    // Resolve epic → parentKey
    let resolvedParentKey = parsed.parentKey;
    if (!resolvedParentKey && parsed.epic) {
      resolvedParentKey = this.#epicMap[parsed.epic];
      if (!resolvedParentKey) {
        const available = Object.keys(this.#epicMap);
        throw new ValidationError(
          `Epic "${parsed.epic}" not found. Available: ${available.join(", ")}`,
        );
      }
    }

    const body = createIssueBody({
      ...parsed,
      resolvedProjectKey,
      resolvedParentKey,
    });
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
