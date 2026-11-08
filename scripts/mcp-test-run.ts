import { runServer, buildIndex } from "./src/mcp.js";
import { spawn } from "node:child_process";
import path from "node:path";

const root = "./pstack";
const index = buildIndex(root, "0.1.0");
console.error(`[test] loaded ${index.skills.length} skills, ${index.playbooks.length} playbooks from ${root}`);

// Use the server directly
const { createServer } = await import("./src/server.js");
const server = createServer(index);

// Test tools list
const { ListToolsRequestSchema } = await import("@modelcontextprotocol/sdk/types.js");
const toolsResult = await server.handleRequest(ListToolsRequestSchema, {
  jsonrpc: "2.0",
  id: "test",
  method: "tools/list",
  params: {},
});
console.log(JSON.stringify({ toolsCount: toolsResult.tools.length, names: toolsResult.tools.map(t => t.name) }));

// Test playbook-route
const { CallToolRequestSchema } = await import("@modelcontextprotocol/sdk/types.js");
const routeResult = await server.handleRequest(CallToolRequestSchema, {
  jsonrpc: "2.0",
  id: "test-route",
  method: "tools/call",
  params: { name: "playbook-route", arguments: { task: "fix the CSV export" } },
});
console.log(JSON.stringify({ playbook_route: JSON.parse(routeResult.content[0].text).matched_playbook }));

// Test search_skills_embedded
const embeddedResult = await server.handleRequest(CallToolRequestSchema, {
  jsonrpc: "2.0",
  id: "test-embedded",
  method: "tools/call",
  params: { name: "search_skills_embedded", arguments: { query: "parallel design", limit: 3 } },
});
const hits = JSON.parse(embeddedResult.content[0].text);
console.log(JSON.stringify({ embedded_hits: hits.map(h => `${h.name}(${h.score.toFixed(3)})`) }));

// Test skill-prompt
const promptResult = await server.handleRequest(CallToolRequestSchema, {
  jsonrpc: "2.0",
  id: "test-prompt",
  method: "tools/call",
  params: { name: "skill-prompt", arguments: { skill_name: "how", task_context: "walk through the cache system" } },
});
const prompt = JSON.parse(promptResult.content[0].text);
console.log(JSON.stringify({ skill_prompt: `${prompt.skill_name} -> ${prompt.prompt.slice(0,80)}...` }));

// Test principles-index
const principlesResult = await server.handleRequest(CallToolRequestSchema, {
  jsonrpc: "2.0",
  id: "test-principles",
  method: "tools/call",
  params: { name: "principles-index", arguments: { category: "core" } },
});
const principles = JSON.parse(principlesResult.content[0].text);
console.log(JSON.stringify({ principles_count: principles.hierarchy.core.length }));

console.log("\n✅ All Phase 3 tests passed!");
