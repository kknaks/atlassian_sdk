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
  JiraIssueFields,
  JiraIssue,
  JiraTransition,
  JiraComment,
  JiraSearchResult,
  JiraCommentPage,
} from "./types.js";

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
