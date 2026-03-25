/**
 * Jira module — barrel re-exports.
 */

export { JiraClient } from "./client.js";

export type {
  JiraProject,
  JiraIssueType,
  JiraStatus,
  JiraStatusCategory,
  JiraPriority,
  JiraUser,
  RawJiraIssue,
  JiraIssue,
  JiraTransition,
  JiraComment,
  RawJiraSearchResult,
  JiraCommentPage,
} from "./types.js";

export { flattenIssue, issueUrl } from "./types.js";

export {
  textToAdf,
  createIssueSchema,
  createIssueBody,
  searchIssuesSchema,
  searchIssuesBody,
  transitionIssueSchema,
  transitionIssueBody,
} from "./schemas.js";

export type {
  CreateIssueInput,
  SearchIssuesInput,
  TransitionIssueInput,
} from "./schemas.js";
