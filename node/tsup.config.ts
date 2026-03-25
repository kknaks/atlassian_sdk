import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    outDir: "dist",
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ["@modelcontextprotocol/sdk", "zod"],
  },
  {
    entry: ["src/mcp/index.ts"],
    outDir: "dist/mcp",
    format: ["esm"],
    dts: true,
    sourcemap: true,
    external: ["@modelcontextprotocol/sdk", "zod"],
  },
]);
