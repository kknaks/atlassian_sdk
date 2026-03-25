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

export interface JiraIssueFields {
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
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: JiraIssueFields;
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

export interface JiraSearchResult {
  issues: JiraIssue[];
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
