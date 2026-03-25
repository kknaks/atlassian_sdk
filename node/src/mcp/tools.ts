/**
 * MCP tool definitions and handlers for Jira and Confluence.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { JiraClient } from "../jira/index.js";
import type { ConfluenceClient } from "../confluence/index.js";

/** All MCP tool definitions for the Atlassian SDK. */
const TOOL_DEFINITIONS = [
  // Schema inspection tools (3)
  {
    name: "list_methods",
    description: "List all available JiraClient and ConfluenceClient methods with descriptions",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_method_info",
    description: "Get method signature, parameters, and description",
    inputSchema: {
      type: "object" as const,
      properties: {
        method_name: { type: "string", description: "Method name (e.g. listProjects, createPage)" },
      },
      required: ["method_name"],
    },
  },
  {
    name: "get_models",
    description: "Get TypeScript type/schema information (all or by name)",
    inputSchema: {
      type: "object" as const,
      properties: {
        model_name: { type: "string", description: "Type name (e.g. JiraIssue, ConfluencePage)" },
      },
    },
  },

  // Jira tools (8)
  {
    name: "jira_list_projects",
    description: "List all visible Jira projects",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "jira_list_issue_types",
    description: "List issue types for a project",
    inputSchema: {
      type: "object" as const,
      properties: { project: { type: "string" } },
      required: ["project"],
    },
  },
  {
    name: "jira_get_issue",
    description: "Get a Jira issue by key",
    inputSchema: {
      type: "object" as const,
      properties: { key: { type: "string" } },
      required: ["key"],
    },
  },
  {
    name: "jira_search_issues",
    description: "Search Jira issues with JQL",
    inputSchema: {
      type: "object" as const,
      properties: {
        jql: { type: "string" },
        maxResults: { type: "number", default: 50 },
      },
      required: ["jql"],
    },
  },
  {
    name: "jira_create_issue",
    description: "Create a Jira issue",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectKey: { type: "string" },
        summary: { type: "string" },
        issueTypeName: { type: "string", default: "Task" },
        description: { type: "string" },
        assigneeId: { type: "string" },
        labels: { type: "array", items: { type: "string" } },
        parentKey: { type: "string" },
      },
      required: ["projectKey", "summary"],
    },
  },
  {
    name: "jira_transition_issue",
    description: "Change issue status",
    inputSchema: {
      type: "object" as const,
      properties: {
        key: { type: "string" },
        status: { type: "string" },
      },
      required: ["key", "status"],
    },
  },
  {
    name: "jira_add_comment",
    description: "Add comment to issue",
    inputSchema: {
      type: "object" as const,
      properties: {
        key: { type: "string" },
        body: { type: "string" },
      },
      required: ["key", "body"],
    },
  },
  {
    name: "jira_list_comments",
    description: "List comments on issue",
    inputSchema: {
      type: "object" as const,
      properties: { key: { type: "string" } },
      required: ["key"],
    },
  },

  // Confluence tools (9)
  {
    name: "confluence_create_page",
    description: "Create a Confluence page",
    inputSchema: {
      type: "object" as const,
      properties: {
        spaceId: { type: "string" },
        title: { type: "string" },
        body: { type: "string" },
        parentId: { type: "string" },
      },
      required: ["spaceId", "title", "body"],
    },
  },
  {
    name: "confluence_get_page",
    description: "Get a Confluence page by ID",
    inputSchema: {
      type: "object" as const,
      properties: { pageId: { type: "string" } },
      required: ["pageId"],
    },
  },
  {
    name: "confluence_update_page",
    description: "Update a Confluence page",
    inputSchema: {
      type: "object" as const,
      properties: {
        pageId: { type: "string" },
        title: { type: "string" },
        body: { type: "string" },
        versionNumber: { type: "number" },
      },
      required: ["pageId", "title", "body", "versionNumber"],
    },
  },
  {
    name: "confluence_list_spaces",
    description: "List Confluence spaces",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "confluence_list_pages_in_space",
    description: "List pages in a space",
    inputSchema: {
      type: "object" as const,
      properties: { spaceId: { type: "string" } },
      required: ["spaceId"],
    },
  },
  {
    name: "confluence_list_child_pages",
    description: "List child pages",
    inputSchema: {
      type: "object" as const,
      properties: { pageId: { type: "string" } },
      required: ["pageId"],
    },
  },
  {
    name: "confluence_list_footer_comments",
    description: "List footer comments",
    inputSchema: {
      type: "object" as const,
      properties: { pageId: { type: "string" } },
      required: ["pageId"],
    },
  },
  {
    name: "confluence_add_footer_comment",
    description: "Add footer comment",
    inputSchema: {
      type: "object" as const,
      properties: {
        pageId: { type: "string" },
        body: { type: "string" },
      },
      required: ["pageId", "body"],
    },
  },
  {
    name: "confluence_list_inline_comments",
    description: "List inline comments on a Confluence page",
    inputSchema: {
      type: "object" as const,
      properties: { pageId: { type: "string" } },
      required: ["pageId"],
    },
  },
  {
    name: "confluence_add_inline_comment",
    description: "Add an inline comment to a Confluence page",
    inputSchema: {
      type: "object" as const,
      properties: {
        pageId: { type: "string" },
        body: { type: "string" },
      },
      required: ["pageId", "body"],
    },
  },
  {
    name: "confluence_search",
    description: "Search Confluence with CQL",
    inputSchema: {
      type: "object" as const,
      properties: {
        cql: { type: "string" },
        limit: { type: "number", default: 25 },
      },
      required: ["cql"],
    },
  },
] as const;

/** Total number of registered tools. */
export const TOOL_COUNT = TOOL_DEFINITIONS.length;

/** Arguments record type for tool dispatch. */
type ToolArgs = Record<string, unknown>;

/**
 * Dispatch a tool call to the appropriate client method.
 * Exported for testability.
 */
export async function dispatchTool(
  name: string,
  args: ToolArgs,
  jira: JiraClient,
  confluence: ConfluenceClient,
): Promise<unknown> {
  switch (name) {
    // Schema inspection tools
    case "list_methods": {
      const jiraMethods = [
        "listProjects", "listIssueTypes", "createIssue", "getIssue",
        "searchIssues", "transitionIssue", "addComment", "listComments",
      ];
      const confluenceMethods = [
        "createPage", "getPage", "updatePage", "listSpaces",
        "listPagesInSpace", "listChildPages", "listFooterComments",
        "createFooterComment", "listInlineComments", "createInlineComment",
        "searchByCql",
      ];
      return {
        JiraClient: jiraMethods,
        ConfluenceClient: confluenceMethods,
      };
    }

    case "get_method_info": {
      const methodName = args.method_name as string;
      const methodInfo: Record<string, { description: string; params: string[] }> = {
        listProjects: { description: "List all visible Jira projects", params: [] },
        listIssueTypes: { description: "List issue types for a project", params: ["projectKeyOrId"] },
        createIssue: { description: "Create a new issue", params: ["projectKey?", "summary", "issueTypeName?", "description?", "assigneeId?", "labels?", "parentKey?", "epic?"] },
        getIssue: { description: "Get a single issue by key", params: ["issueKey"] },
        searchIssues: { description: "Search issues using JQL", params: ["jql", "maxResults?", "fields?"] },
        transitionIssue: { description: "Transition issue to new status", params: ["issueKey", "statusName"] },
        addComment: { description: "Add a comment to an issue", params: ["issueKey", "body"] },
        listComments: { description: "List comments on an issue", params: ["issueKey"] },
        createPage: { description: "Create a Confluence page", params: ["spaceId", "title", "body", "parentId?", "status?"] },
        getPage: { description: "Get a Confluence page by ID", params: ["pageId"] },
        updatePage: { description: "Update a Confluence page", params: ["pageId", "title", "body", "versionNumber", "status?"] },
        listSpaces: { description: "List Confluence spaces", params: ["limit?"] },
        listPagesInSpace: { description: "List pages in a space", params: ["spaceId", "limit?"] },
        listChildPages: { description: "List child pages", params: ["pageId", "limit?"] },
        listFooterComments: { description: "List footer comments", params: ["pageId"] },
        createFooterComment: { description: "Add footer comment", params: ["pageId", "body"] },
        listInlineComments: { description: "List inline comments", params: ["pageId"] },
        createInlineComment: { description: "Add inline comment", params: ["pageId", "body"] },
        searchByCql: { description: "Search Confluence with CQL", params: ["cql", "limit?"] },
      };
      const info = methodInfo[methodName];
      if (!info) {
        return { error: `Method '${methodName}' not found. Available: ${Object.keys(methodInfo).join(", ")}` };
      }
      return info;
    }

    case "get_models": {
      const modelName = args.model_name as string | undefined;
      const models: Record<string, string[]> = {
        JiraProject: ["id", "key", "name", "projectTypeKey?"],
        JiraIssueType: ["id", "name", "subtask"],
        JiraIssue: ["id", "key", "self", "fields"],
        JiraStatus: ["id", "name", "statusCategory?"],
        JiraUser: ["accountId", "displayName", "active?"],
        JiraComment: ["id", "body", "author?", "created?", "updated?"],
        JiraSearchResult: ["issues", "total", "startAt", "maxResults"],
        ConfluencePage: ["id", "title", "spaceId", "status?", "parentId?", "version?", "body?"],
        ConfluenceSpace: ["id", "key", "name", "type?", "status?"],
        ConfluenceComment: ["id", "status?", "title?", "body?"],
      };
      if (modelName) {
        const m = models[modelName];
        if (!m) return { error: `Model '${modelName}' not found. Available: ${Object.keys(models).join(", ")}` };
        return { [modelName]: m };
      }
      return Object.keys(models);
    }

    // Jira tools
    case "jira_list_projects":
      return jira.listProjects();

    case "jira_list_issue_types":
      return jira.listIssueTypes(args.project as string);

    case "jira_get_issue":
      return jira.getIssue(args.key as string);

    case "jira_search_issues":
      return jira.searchIssues({
        jql: args.jql as string,
        maxResults: (args.maxResults as number | undefined) ?? 50,
      });

    case "jira_create_issue":
      return jira.createIssue({
        projectKey: args.projectKey as string,
        summary: args.summary as string,
        issueTypeName: (args.issueTypeName as string | undefined) ?? "Task",
        description: args.description as string | undefined,
        assigneeId: args.assigneeId as string | undefined,
        labels: args.labels as string[] | undefined,
        parentKey: args.parentKey as string | undefined,
      });

    case "jira_transition_issue":
      await jira.transitionIssue(
        args.key as string,
        args.status as string,
      );
      return { success: true };

    case "jira_add_comment":
      return jira.addComment(
        args.key as string,
        args.body as string,
      );

    case "jira_list_comments":
      return jira.listComments(args.key as string);

    // Confluence tools
    case "confluence_create_page":
      return confluence.createPage({
        spaceId: args.spaceId as string,
        title: args.title as string,
        body: args.body as string,
        parentId: args.parentId as string | undefined,
        status: "current",
      });

    case "confluence_get_page":
      return confluence.getPage(args.pageId as string);

    case "confluence_update_page":
      return confluence.updatePage(args.pageId as string, {
        title: args.title as string,
        body: args.body as string,
        versionNumber: args.versionNumber as number,
        status: "current",
      });

    case "confluence_list_spaces":
      return confluence.listSpaces();

    case "confluence_list_pages_in_space":
      return confluence.listPagesInSpace(args.spaceId as string);

    case "confluence_list_child_pages":
      return confluence.listChildPages(args.pageId as string);

    case "confluence_list_footer_comments":
      return confluence.listFooterComments(args.pageId as string);

    case "confluence_add_footer_comment":
      return confluence.createFooterComment(
        args.pageId as string,
        args.body as string,
      );

    case "confluence_list_inline_comments":
      return confluence.listInlineComments(args.pageId as string);

    case "confluence_add_inline_comment":
      return confluence.createInlineComment(
        args.pageId as string,
        args.body as string,
      );

    case "confluence_search":
      return confluence.searchByCql(
        args.cql as string,
        (args.limit as number | undefined) ?? 25,
      );

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/** Register all Atlassian MCP tools on the given server. */
export function registerTools(
  server: Server,
  jira: JiraClient,
  confluence: ConfluenceClient,
): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...TOOL_DEFINITIONS],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      const result = await dispatchTool(
        name,
        (args ?? {}) as ToolArgs,
        jira,
        confluence,
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  });
}
