/**
 * Atlassian SDK — TypeScript client for Jira and Confluence REST APIs.
 */

// Auth
export { loadAuthFromEnv, buildAuthHeader, buildBaseUrl } from "./auth.js";
export type { AuthConfig } from "./auth.js";

// HTTP
export { HttpClient } from "./http.js";

// Errors
export {
  SdkError,
  ApiError,
  AuthError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  TimeoutError,
  throwFromStatus,
} from "./errors.js";

// Jira
export { JiraClient } from "./jira/index.js";
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
} from "./jira/index.js";
export {
  createIssueSchema,
  createIssueBody,
  searchIssuesSchema,
  searchIssuesBody,
  transitionIssueSchema,
  transitionIssueBody,
  textToAdf,
} from "./jira/index.js";
export type {
  CreateIssueInput,
  SearchIssuesInput,
  TransitionIssueInput,
} from "./jira/index.js";

// Confluence
export { ConfluenceClient } from "./confluence/index.js";
export type {
  ConfluenceSpace,
  ConfluencePage,
  ConfluencePageVersion,
  ConfluencePageBody,
  ConfluenceComment,
  ConfluencePageList,
  ConfluenceSpaceList,
  ConfluenceCommentList,
  ConfluenceSearchResult,
} from "./confluence/index.js";
export {
  createPageSchema,
  createPageBody,
  updatePageSchema,
  updatePageBody,
  createCommentSchema,
  createCommentBody,
} from "./confluence/index.js";
export type {
  CreatePageInput,
  UpdatePageInput,
  CreateCommentInput,
} from "./confluence/index.js";
