/** Response type interfaces for Confluence REST API v2. */

export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
  type?: string;
  status?: string;
}

export interface ConfluencePageVersion {
  number: number;
  message?: string;
}

export interface ConfluencePageBody {
  storage?: { value: string; representation: string };
  atlas_doc_format?: Record<string, unknown>;
}

export interface ConfluencePage {
  id: string;
  title: string;
  spaceId: string;
  status?: string;
  parentId?: string;
  version?: ConfluencePageVersion;
  body?: ConfluencePageBody;
  _links?: { webui?: string; base?: string };
}

export interface ConfluenceComment {
  id: string;
  status?: string;
  title?: string;
  body?: ConfluencePageBody;
}

/** Strip unknown fields from a space response. */
export function stripSpace(raw: Record<string, unknown>): ConfluenceSpace {
  return {
    id: raw.id as string,
    key: raw.key as string,
    name: raw.name as string,
    ...(raw.type != null ? { type: raw.type as string } : {}),
    ...(raw.status != null ? { status: raw.status as string } : {}),
  };
}

/** Strip unknown fields from a page response. */
export function stripPage(raw: Record<string, unknown>): ConfluencePage {
  return {
    id: raw.id as string,
    title: raw.title as string,
    spaceId: raw.spaceId as string,
    ...(raw.status != null ? { status: raw.status as string } : {}),
    ...(raw.parentId != null ? { parentId: raw.parentId as string } : {}),
    ...(raw.version != null ? { version: raw.version as ConfluencePageVersion } : {}),
    ...(raw.body != null ? { body: raw.body as ConfluencePageBody } : {}),
    ...(raw._links != null ? { _links: raw._links as { webui?: string; base?: string } } : {}),
  };
}

/** Strip unknown fields from a comment response. */
export function stripComment(raw: Record<string, unknown>): ConfluenceComment {
  return {
    id: raw.id as string,
    ...(raw.status != null ? { status: raw.status as string } : {}),
    ...(raw.title != null ? { title: raw.title as string } : {}),
    ...(raw.body != null ? { body: raw.body as ConfluencePageBody } : {}),
  };
}

export interface ConfluencePageList {
  results: ConfluencePage[];
  _links?: { next?: string };
}

export interface ConfluenceSpaceList {
  results: ConfluenceSpace[];
  _links?: { next?: string };
}

export interface ConfluenceCommentList {
  results: ConfluenceComment[];
  _links?: { next?: string };
}

export interface ConfluenceSearchResult {
  results: Array<{
    content?: ConfluencePage;
    title: string;
    excerpt?: string;
    url?: string;
  }>;
  _links?: { next?: string };
}
