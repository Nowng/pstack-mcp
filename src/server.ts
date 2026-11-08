/**
 * src/server.ts — MCP server (auto-generated from tool-definitions.ts).
 * The tool list is derived from ALL_TOOL_DEFS; implementations are here.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { PstackSkillIndex } from "./types.js";
import { ALL_TOOL_DEFS } from "./tool-definitions.js";
import { recommendSkills } from "./recommend.js";
import { playbookRoute } from "./playbook-route.js";
import { searchTfidf } from "./search-embedded.js";
import { getSkillPrompt } from "./skill-prompt.js";
import { buildPrinciplesIndex } from "./principles-index.js";
import { buildSkillGraph } from "./skill-graph.js";
import { toolModelSetup, toolAutomateWorkflow } from "./phase4-tools.js";

export function createServer(index: PstackSkillIndex) {
  const server = new Server(
    { name: "pstack-mcp", version: index.version },
    { capabilities: { tools: {} } },
  );

  // Auto-generate tool list from definitions
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: (ALL_TOOL_DEFS as any[]).map((def) => ({
      name: def.name,
      description: def.description,
      inputSchema: def.parameters,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name: toolName, arguments: args } = request.params;
    try {
      // ---- list_skills ----
      if (toolName === "list_skills") {
        const parsed = (ALL_TOOL_DEFS[0] as any).parameters.parse(args ?? {});
        const names = parsed.category === "all"
          ? index.by_category.all
          : index.by_category[parsed.category as keyof typeof index.by_category] ?? [];
        const items = names.map((n: string) => ({
          name: n,
          category: index.by_name[n].category,
          desc: index.by_name[n].description.slice(0, 120),
        }));
        return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
      }

      // ---- search_skills ----
      if (toolName === "search_skills") {
        const parsed = (ALL_TOOL_DEFS[1] as any).parameters.parse(args ?? {});
        const q = parsed.query.toLowerCase();
        const hits = index.skills
          .map((s) => {
            let score = 0;
            if (s.name.includes(q)) score += 10;
            if (s.description.toLowerCase().includes(q)) score += 5;
            if (s.tags.some((t) => t.includes(q) || q.includes(t))) score += 3;
            return { s, score };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, parsed.limit)
          .map(({ s }) => ({
            name: s.name,
            category: s.category,
            desc: s.description.slice(0, 120),
          }));
        return { content: [{ type: "text", text: JSON.stringify(hits, null, 2) }] };
      }

      // ---- get_skill ----
      if (toolName === "get_skill") {
        const parsed = (ALL_TOOL_DEFS[2] as any).parameters.parse(args ?? {});
        const skill = index.by_name[parsed.name];
        if (!skill) {
          return { content: [{ type: "text", text: `Skill not found: ${parsed.name}. Use list_skills or search_skills.` }], isError: true };
        }
        const text = parsed.mode === "full" ? skill.content_full : skill.content_summary;
        return { content: [{ type: "text", text }] };
      }

      // ---- recommend_skills ----
      if (toolName === "recommend_skills") {
        const parsed = (ALL_TOOL_DEFS[3] as any).parameters.parse(args ?? {});
        const results = recommendSkills(parsed.task, index, parsed.limit);
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }

      // ---- get_principles ----
      if (toolName === "get_principles") {
        const parsed = (ALL_TOOL_DEFS[4] as any).parameters.parse(args ?? {});
        const principles = index.skills.filter((s) => s.is_principle);
        let selected = principles;
        if (parsed.names && parsed.names.length > 0) {
          const normalized = parsed.names.map((n: string) =>
            n.startsWith("principle-") ? n : `principle-${n}`,
          );
          selected = principles.filter((p) => normalized.includes(p.name));
        }
        if (parsed.mode === "summary") {
          const brief = selected.map((p) => ({
            name: p.name,
            desc: p.description.slice(0, 160),
          }));
          return { content: [{ type: "text", text: JSON.stringify(brief, null, 2) }] };
        }
        const full = selected
          .map((p) => `### ${p.name}\n\n${p.content_full}`)
          .join("\n\n---\n\n");
        return { content: [{ type: "text", text: full }] };
      }

      // ---- get_playbook ----
      if (toolName === "get_playbook") {
        const parsed = (ALL_TOOL_DEFS[5] as any).parameters.parse(args ?? {});
        const pb = index.playbook_by_name[parsed.name];
        if (!pb) {
          const known = Object.keys(index.playbook_by_name).join(", ");
          return { content: [{ type: "text", text: `Playbook not found: ${parsed.name}. Known: ${known}` }], isError: true };
        }
        const text = parsed.mode === "full" ? pb.content_full : pb.content_summary;
        return { content: [{ type: "text", text }] };
      }

      // ---- playbook-route ----
      if (toolName === "playbook-route") {
        const parsed = (ALL_TOOL_DEFS[6] as any).parameters.parse(args ?? {});
        const result = playbookRoute(parsed.task, index, parsed.limit);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      // ---- skill-graph ----
      if (toolName === "skill-graph") {
        const parsed = (ALL_TOOL_DEFS[7] as any).parameters.parse(args ?? {});
        const graph = buildSkillGraph(index);
        let filtered = graph;
        if (parsed.skill_name) {
          const neighbors = new Set([parsed.skill_name]);
          for (const edge of graph.edges) {
            if (edge.from === parsed.skill_name || edge.to === parsed.skill_name) {
              neighbors.add(edge.from);
              neighbors.add(edge.to);
            }
          }
          const filteredEdges = graph.edges.filter((e) => neighbors.has(e.from) && neighbors.has(e.to));
          const filteredNodes = graph.nodes.filter((n) => neighbors.has(n.name));
          const filteredAdj: Record<string, string[]> = {};
          for (const n of filteredNodes) filteredAdj[n.name] = graph.adjacency[n.name]?.filter((x) => neighbors.has(x)) || [];
          filtered = { nodes: filteredNodes, edges: filteredEdges, adjacency: filteredAdj, stats: graph.stats };
        }
        return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
      }

      // ---- search_skills_embedded ----
      if (toolName === "search_skills_embedded") {
        const parsed = (ALL_TOOL_DEFS[8] as any).parameters.parse(args ?? {});
        const hits = searchTfidf(parsed.query, index.skills, parsed.limit);
        return { content: [{ type: "text", text: JSON.stringify(hits, null, 2) }] };
      }

      // ---- skill-prompt ----
      if (toolName === "skill-prompt") {
        const parsed = (ALL_TOOL_DEFS[9] as any).parameters.parse(args ?? {});
        const { result, error } = getSkillPrompt(parsed.skill_name, index, parsed.task_context);
        if (error) return { content: [{ type: "text", text: error }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      // ---- principles-index ----
      if (toolName === "principles-index") {
        const parsed = (ALL_TOOL_DEFS[10] as any).parameters.parse(args ?? {});
        const idx = buildPrinciplesIndex(index);
        if (parsed.category === "all") return { content: [{ type: "text", text: JSON.stringify(idx, null, 2) }] };
        return { content: [{ type: "text", text: JSON.stringify({ hierarchy: { [parsed.category]: idx.hierarchy[parsed.category as keyof typeof idx.hierarchy] }, total_count: idx.total_count }, null, 2) }] };
      }

      // ---- model-setup (Phase 4) ----
      if (toolName === "model-setup") {
        const parsed = (ALL_TOOL_DEFS[11] as any).parameters.parse(args ?? {});
        const pstackRoot = process.env.PSTACK_ROOT || process.cwd();
        const result = toolModelSetup(parsed, pstackRoot);
        if (result.success) {
          const models = result.models!;
          const raw = result.raw!;
          if (parsed.name) {
            return { content: [{ type: "text", text: JSON.stringify({ model: models[0] }, null, 2) }] };
          }
          const lines = models.map((m: any) =>
            `  - ${m.name} (aliases: ${m.aliases.join(", ") || "none"} | reasoning: ${m.reasoningLevel})`,
          );
          const summary = `Found ${models.length} models:\n${lines.join("\n")}`;
          return { content: [{ type: "text", text: `${summary}\n\n---\n\nFull config (${raw.length} chars):\n\n${raw}` }] };
        }
        return { content: [{ type: "text", text: result.error }], isError: true };
      }

      // ---- automate-workflow (Phase 4) ----
      if (toolName === "automate-workflow") {
        const parsed = (ALL_TOOL_DEFS[12] as any).parameters.parse(args ?? {});
        const pstackRoot = process.env.PSTACK_ROOT || process.cwd();
        const result = toolAutomateWorkflow(parsed, pstackRoot);
        if (result.success && "count" in result) {
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        if (result.success && "content" in result) {
          const automation = result.automation!;
          return { content: [{ type: "text", text: `=== Automation: ${automation.name}\n=== Description: ${automation.description}\n\n${result.content}` }] };
        }
        return { content: [{ type: "text", text: result.error }], isError: true };
      }

      // ---- unknown tool ----
      return { content: [{ type: "text", text: `Unknown tool: ${toolName}` }], isError: true };
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
    }
  });

  return server;
}

export async function runServer(index: PstackSkillIndex) {
  const server = createServer(index);
  const transport = new (await import("@modelcontextprotocol/sdk/server/stdio.js")).StdioServerTransport();
  await server.connect(transport);
}
