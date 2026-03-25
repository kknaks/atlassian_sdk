/**
 * Zod schemas for Jira input validation with toRequestBody() helpers.
 */

import { z } from "zod";

/** Wrap plain text in Atlassian Document Format (ADF). */
export function textToAdf(text: string): Record<string, unknown> {
  return {
    type: "doc",
    version: 1,
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

export const createIssueSchema = z
  .object({
    projectKey: z.string().optional(),
    summary: z.string(),
    issueTypeName: z.string().default("Task"),
    description: z.string().optional(),
    assigneeId: z.string().optional(),
    labels: z.array(z.string()).optional(),
    parentKey: z.string().optional(),
    epic: z.string().optional(),
  })
  .strict();

export type CreateIssueInput = z.infer<typeof createIssueSchema>;

/** Build the REST API request body for creating an issue. */
export function createIssueBody(
  input: CreateIssueInput & { resolvedProjectKey: string; resolvedParentKey?: string },
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    project: { key: input.resolvedProjectKey },
    summary: input.summary,
    issuetype: { name: input.issueTypeName },
  };
  if (input.description) fields.description = textToAdf(input.description);
  if (input.assigneeId) fields.assignee = { id: input.assigneeId };
  if (input.labels?.length) fields.labels = input.labels;
  if (input.resolvedParentKey) fields.parent = { key: input.resolvedParentKey };
  return { fields };
}

export const searchIssuesSchema = z
  .object({
    jql: z.string(),
    maxResults: z.number().int().positive().default(50),
    fields: z.array(z.string()).optional(),
  })
  .strict();

export type SearchIssuesInput = z.infer<typeof searchIssuesSchema>;

/** Build the REST API request body for searching issues. */
export function searchIssuesBody(
  input: SearchIssuesInput,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    jql: input.jql,
    maxResults: input.maxResults,
  };
  if (input.fields?.length) body.fields = input.fields;
  return body;
}

export const transitionIssueSchema = z
  .object({
    transitionId: z.string(),
  })
  .strict();

export type TransitionIssueInput = z.infer<typeof transitionIssueSchema>;

/** Build the REST API request body for transitioning an issue. */
export function transitionIssueBody(
  input: TransitionIssueInput,
): Record<string, unknown> {
  return { transition: { id: input.transitionId } };
}
