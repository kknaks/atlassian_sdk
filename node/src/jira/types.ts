/**
 * TypeScript interfaces for Jira REST API v3 responses.
 */

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey?: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
  subtask: boolean;
}

export interface JiraStatusCategory {
  id: number;
  key: string;
  name: string;
  colorName: string;
}

export interface JiraStatus {
  id: string;
  name: string;
  statusCategory?: JiraStatusCategory;
}

export interface JiraPriority {
  id: string;
  name: string;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  active?: boolean;
}

/** Raw API response shape (nested fields). */
export interface RawJiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: unknown;
    status?: JiraStatus;
    issuetype?: JiraIssueType;
    priority?: JiraPriority;
    assignee?: JiraUser | null;
    creator?: JiraUser;
    reporter?: JiraUser;
    project?: { id: string; key: string; name: string };
    labels?: string[];
    created?: string;
    updated?: string;
    parent?: { id: string; key: string; fields?: Record<string, unknown> };
    duedate?: string | null;
    resolution?: Record<string, unknown> | null;
  };
}

/** Flattened issue — fields merged to top level (matches Python SDK). */
export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  summary: string;
  description?: unknown;
  status?: JiraStatus;
  issuetype?: JiraIssueType;
  priority?: JiraPriority;
  assignee?: JiraUser | null;
  creator?: JiraUser;
  reporter?: JiraUser;
  project?: { id: string; key: string; name: string };
  labels: string[];
  created?: string;
  updated?: string;
  parent?: { id: string; key: string };
  duedate?: string | null;
  resolution?: Record<string, unknown> | null;
}

/** Flatten raw API response into SDK-level JiraIssue. */
export function flattenIssue(raw: RawJiraIssue): JiraIssue {
  const { id, key, self: selfUrl, fields } = raw;
  return {
    id,
    key,
    self: selfUrl,
    summary: fields.summary,
    description: fields.description,
    status: fields.status,
    issuetype: fields.issuetype,
    priority: fields.priority,
    assignee: fields.assignee,
    creator: fields.creator,
    reporter: fields.reporter,
    project: fields.project,
    labels: fields.labels ?? [],
    created: fields.created,
    updated: fields.updated,
    parent: fields.parent ? { id: fields.parent.id, key: fields.parent.key } : undefined,
    duedate: fields.duedate,
    resolution: fields.resolution,
  };
}

/** Build Jira web URL from issue self URL and key. */
export function issueUrl(selfUrl: string, key: string): string {
  try {
    const u = new URL(selfUrl);
    return `${u.origin}/browse/${key}`;
  } catch {
    return "";
  }
}

/** Strip unknown fields from a project response. */
export function stripProject(raw: Record<string, unknown>): JiraProject {
  return {
    id: raw.id as string,
    key: raw.key as string,
    name: raw.name as string,
    ...(raw.projectTypeKey != null ? { projectTypeKey: raw.projectTypeKey as string } : {}),
  };
}

/** Strip unknown fields from an issue type response. */
export function stripIssueType(raw: Record<string, unknown>): JiraIssueType {
  return {
    id: raw.id as string,
    name: raw.name as string,
    subtask: raw.subtask as boolean,
  };
}

/** Strip unknown fields from a comment response. */
export function stripComment(raw: Record<string, unknown>): JiraComment {
  return {
    id: raw.id as string,
    body: raw.body,
    ...(raw.author != null ? { author: raw.author as JiraUser } : {}),
    ...(raw.created != null ? { created: raw.created as string } : {}),
    ...(raw.updated != null ? { updated: raw.updated as string } : {}),
  };
}

export interface JiraTransition {
  id: string;
  name: string;
  to?: JiraStatus;
}

export interface JiraComment {
  id: string;
  body: unknown;
  author?: JiraUser;
  created?: string;
  updated?: string;
}

/** Raw search result from API. */
export interface RawJiraSearchResult {
  issues: RawJiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface JiraCommentPage {
  comments: JiraComment[];
  total: number;
  startAt: number;
  maxResults: number;
}
