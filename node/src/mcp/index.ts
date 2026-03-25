#!/usr/bin/env node
/**
 * MCP server entrypoint — exposes Atlassian SDK tools over stdio transport.
 *
 * Usage: atlassian-sdk-mcp [--env-file <path>]
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { JiraClient } from "../jira/index.js";
import { ConfluenceClient } from "../confluence/index.js";
import { registerTools } from "./tools.js";

// Parse --env-file argument
const envFileIdx = process.argv.indexOf("--env-file");
if (envFileIdx !== -1) {
  const envFilePath = process.argv[envFileIdx + 1];
  if (!envFilePath) {
    console.error("Error: --env-file requires a file path argument.");
    process.exit(1);
  }
  const resolved = resolve(process.cwd(), envFilePath);
  if (!existsSync(resolved)) {
    console.error(`Error: env file not found: ${resolved}`);
    process.exit(1);
  }
  const content = readFileSync(resolved, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const server = new Server(
  { name: "atlassian-sdk", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

// Lazy-initialized clients (created on first tool call, like the Python SDK)
let _jira: JiraClient | null = null;
let _confluence: ConfluenceClient | null = null;

function getJira(): JiraClient {
  if (!_jira) _jira = new JiraClient();
  return _jira;
}

function getConfluence(): ConfluenceClient {
  if (!_confluence) _confluence = new ConfluenceClient();
  return _confluence;
}

registerTools(server, getJira, getConfluence);

const transport = new StdioServerTransport();
await server.connect(transport);
