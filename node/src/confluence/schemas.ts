/** Zod input schemas and body builders for Confluence REST API v2. */

import { z } from "zod";

export const createPageSchema = z
  .object({
    spaceId: z.string(),
    title: z.string(),
    body: z.string(),
    parentId: z.string().optional(),
    status: z.enum(["current", "draft"]).default("current"),
  })
  .strict();

export type CreatePageInput = z.infer<typeof createPageSchema>;

/** Builds the request body for POST /wiki/api/v2/pages. */
export function createPageBody(input: CreatePageInput): Record<string, unknown> {
  const result: Record<string, unknown> = {
    spaceId: input.spaceId,
    title: input.title,
    body: { representation: "storage", value: input.body },
    status: input.status,
  };
  if (input.parentId) result.parentId = input.parentId;
  return result;
}

export const updatePageSchema = z
  .object({
    title: z.string(),
    body: z.string(),
    versionNumber: z.number().int().positive(),
    status: z.enum(["current", "draft"]).default("current"),
  })
  .strict();

export type UpdatePageInput = z.infer<typeof updatePageSchema>;

/** Builds the request body for PUT /wiki/api/v2/pages/{pageId}. */
export function updatePageBody(
  pageId: string,
  input: UpdatePageInput,
): Record<string, unknown> {
  return {
    id: pageId,
    title: input.title,
    body: { representation: "storage", value: input.body },
    version: { number: input.versionNumber },
    status: input.status,
  };
}

export const createCommentSchema = z
  .object({
    body: z.string(),
  })
  .strict();

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/** Builds the request body for POST comment endpoints. */
export function createCommentBody(
  input: CreateCommentInput,
): Record<string, unknown> {
  return { body: { representation: "storage", value: input.body } };
}
