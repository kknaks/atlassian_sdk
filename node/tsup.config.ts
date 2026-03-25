import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ["@modelcontextprotocol/sdk", "zod"],
  },
  {
    entry: ["src/mcp/index.ts"],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    external: ["@modelcontextprotocol/sdk", "zod"],
  },
]);
