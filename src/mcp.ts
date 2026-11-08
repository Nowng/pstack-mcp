/**
 * src/mcp.ts — MCP server entry point.
 * Uses tool-definitions.ts for unified tool generation.
 */
import { buildIndex } from "./index-builder.js";
import { createServer } from "./server.js";

export async function main() {
  const root = process.env.PSTACK_ROOT || process.cwd();
  const index = buildIndex(root, "0.1.0");
  console.error(`[pstack-mcp] loaded ${index.skills.length} skills, ${index.playbooks.length} playbooks from ${root}`);
  await runServer(index);
}

export async function runServer(index: ReturnType<typeof buildIndex>) {
  const server = createServer(index);
  const transport = new (await import("@modelcontextprotocol/sdk/server/stdio.js")).StdioServerTransport();
  await server.connect(transport);
}

// Export for plugin use
export { buildIndex, createServer };
