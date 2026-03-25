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
