import { AuthError } from "./errors.js";

/** Configuration for Atlassian Basic Auth. */
export interface AuthConfig {
  readonly site: string;
  readonly email: string;
  readonly apiToken: string;
}

/**
 * Resolves an environment variable across all JS runtimes.
 * Checks: process.env (Node/Next), import.meta.env (Vite/RN), globalThis.__ENV (fallback).
 */
function resolveEnv(key: string): string | undefined {
  // Node.js / Next.js / Express
  if (typeof process !== "undefined" && process.env) {
    const val = process.env[key];
    if (val) return val;
  }

  // Vite / React Native (import.meta.env is statically replaced at build time,
  // but we can access it via globalThis for dynamic lookup)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (globalThis as any).__VITE_ENV__ ?? (import.meta as any)?.env;
    if (meta) {
      // Vite uses VITE_ prefix
      const val = meta[`VITE_${key}`] ?? meta[key];
      if (val) return val;
    }
  } catch {
    // import.meta may not be available in all environments
  }

  // Next.js public env (NEXT_PUBLIC_ prefix)
  if (typeof process !== "undefined" && process.env) {
    const val = process.env[`NEXT_PUBLIC_${key}`];
    if (val) return val;
  }

  // Expo / React Native (EXPO_PUBLIC_ prefix)
  if (typeof process !== "undefined" && process.env) {
    const val = process.env[`EXPO_PUBLIC_${key}`];
    if (val) return val;
  }

  return undefined;
}

/**
 * Loads authentication configuration from environment variables.
 * Supports all JS runtimes: Node.js, Next.js, Vite, React Native, Expo.
 *
 * Env var lookup order per key (e.g., ATLASSIAN_SITE):
 *   1. process.env.ATLASSIAN_SITE (Node/Next server)
 *   2. import.meta.env.VITE_ATLASSIAN_SITE (Vite)
 *   3. process.env.NEXT_PUBLIC_ATLASSIAN_SITE (Next.js client)
 *   4. process.env.EXPO_PUBLIC_ATLASSIAN_SITE (Expo/RN)
 *
 * Throws AuthError if any required variable is missing.
 */
export function loadAuthFromEnv(): AuthConfig {
  const site = resolveEnv("ATLASSIAN_SITE");
  const email = resolveEnv("ATLASSIAN_EMAIL");
  const apiToken = resolveEnv("ATLASSIAN_API_TOKEN");

  const missing: string[] = [];
  if (!site) missing.push("ATLASSIAN_SITE");
  if (!email) missing.push("ATLASSIAN_EMAIL");
  if (!apiToken) missing.push("ATLASSIAN_API_TOKEN");

  if (missing.length > 0) {
    throw new AuthError(
      `Missing required environment variables: ${missing.join(", ")}\n\n` +
      `To fix this, either:\n` +
      `  1. Create a .env file with the variables and use --env-file .env\n` +
      `  2. Set them in your shell: export ATLASSIAN_SITE=your-site.atlassian.net\n` +
      `  3. Add env field in .mcp.json: "env": { "ATLASSIAN_SITE": "..." }\n\n` +
      `Required variables:\n` +
      `  ATLASSIAN_SITE      — Your Atlassian site (e.g. mysite.atlassian.net)\n` +
      `  ATLASSIAN_EMAIL     — Account email address\n` +
      `  ATLASSIAN_API_TOKEN — API token (https://id.atlassian.com/manage-profile/security/api-tokens)`,
    );
  }

  return { site: site!, email: email!, apiToken: apiToken! };
}

/**
 * Builds a Basic Auth header value from the given config.
 */
export function buildAuthHeader(config: AuthConfig): string {
  const credentials = `${config.email}:${config.apiToken}`;
  return `Basic ${btoa(credentials)}`;
}

/**
 * Builds the base URL for the Atlassian site.
 * Strips any trailing slash from the site string.
 */
export function buildBaseUrl(site: string): string {
  const cleaned = site.replace(/\/+$/, "");
  return `https://${cleaned}`;
}
