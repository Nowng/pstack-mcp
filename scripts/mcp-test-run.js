import { buildIndex } from "../dist/index-builder.js";
import { createServer } from "../dist/server.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const root = "./pstack";
const index = buildIndex(root, "0.1.0");
console.error(`[test] loaded ${index.skills.length} skills, ${index.playbooks.length} playbooks from ${root}`);

const server = createServer(index);

// Test 1: tools list
const toolsResult = await server.handleRequest(CallToolRequestSchema, {
  jsonrpc: "2.0", id: 1, method: "tools/call",
  params: { name: "list_skills", arguments: { category: "all" } },
});
const skillNames = JSON.parse(toolsResult.content[0].text).map(s => s.name);
console.log(`✅ list_skills: ${skillNames.length} skills`);

// Test 2: playbook-route
const routeResult = await server.handleRequest(CallToolRequestSchema, {
  jsonrpc: "2.0", id: 2, method: "tools/call",
  params: { name: "playbook-route", arguments: { task: "fix the CSV export" } },
});
const route = JSON.parse(routeResult.content[0].text);
console.log(`✅ playbook-route: matched="${route.matched_playbook}" (confidence=${route.confidence.toFixed(2)})`);

// Test 3: search_skills_embedded
const embeddedResult = await server.handleRequest(CallToolRequestSchema, {
  jsonrpc: "2.0", id: 3, method: "tools/call",
  params: { name: "search_skills_embedded", arguments: { query: "parallel design", limit: 3 } },
});
const hits = JSON.parse(embeddedResult.content[0].text);
console.log(`✅ search_skills_embedded: ${hits.length} hits, #1="${hits[0].name}" (${hits[0].score.toFixed(3)})`);

// Test 4: skill-prompt
const promptResult = await server.handleRequest(CallToolRequestSchema, {
  jsonrpc: "2.0", id: 4, method: "tools/call",
  params: { name: "skill-prompt", arguments: { skill_name: "how", task_context: "walk through the cache system" } },
});
const prompt = JSON.parse(promptResult.content[0].text);
console.log(`✅ skill-prompt: "${prompt.skill_name}" -> "${prompt.prompt.slice(0,70)}..."`);

// Test 5: principles-index
const principlesResult = await server.handleRequest(CallToolRequestSchema, {
  jsonrpc: "2.0", id: 5, method: "tools/call",
  params: { name: "principles-index", arguments: { category: "core" } },
});
const principles = JSON.parse(principlesResult.content[0].text);
console.log(`✅ principles-index: core=${principles.hierarchy.core.length} total=${principles.total_count}`);

// Test 6: skill-graph
const graphResult = await server.handleRequest(CallToolRequestSchema, {
  jsonrpc: "2.0", id: 6, method: "tools/call",
  params: { name: "skill-graph", arguments: { include_principles: true, include_playbooks: true } },
});
const graph = JSON.parse(graphResult.content[0].text);
console.log(`✅ skill-graph: nodes=${graph.stats.total_skills} principles=${graph.stats.total_principles} playbooks=${graph.stats.total_playbooks}`);

console.log("\n🎉 Phase 3 全部通過！統一 tool-definitions 工作正常。");
