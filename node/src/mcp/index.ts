#!/usr/bin/env node
/**
 * MCP server entrypoint — exposes Atlassian SDK tools over stdio transport.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { JiraClient } from "../jira/index.js";
import { ConfluenceClient } from "../confluence/index.js";
import { registerTools } from "./tools.js";

const server = new Server(
  { name: "atlassian-sdk", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

const jira = new JiraClient();
const confluence = new ConfluenceClient();
registerTools(server, jira, confluence);

const transport = new StdioServerTransport();
await server.connect(transport);
