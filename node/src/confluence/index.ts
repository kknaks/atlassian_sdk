/** Barrel re-exports for the Confluence module. */

export { ConfluenceClient } from "./client.js";

export type {
  ConfluenceSpace,
  ConfluencePageVersion,
  ConfluencePageBody,
  ConfluencePage,
  ConfluenceComment,
  ConfluencePageList,
  ConfluenceSpaceList,
  ConfluenceCommentList,
  ConfluenceSearchResult,
} from "./types.js";

export {
  createPageSchema,
  createPageBody,
  updatePageSchema,
  updatePageBody,
  createCommentSchema,
  createCommentBody,
} from "./schemas.js";

export type {
  CreatePageInput,
  UpdatePageInput,
  CreateCommentInput,
} from "./schemas.js";
