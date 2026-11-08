/**
 * LM Studio Plugin entry point.
 * Tools are auto-generated from src/tool-definitions.ts.
 *
 * KEY: @lmstudio/sdk's tool() wraps `parameters` in z.object().
 * So we must pass the RAW PROPERTIES (Record<string, ZodType>),
 * NOT a z.object() schema.
 */
import path from "node:path";
import { buildIndex } from "./index-builder.js";
import type { Tool, PluginContext, ToolsProviderController } from "@lmstudio/sdk";
import { tool } from "@lmstudio/sdk";
import { ALL_TOOL_DEFS } from "./tool-definitions.js";
import { recommendSkills } from "./recommend.js";
import { playbookRoute } from "./playbook-route.js";
import { buildSkillGraph } from "./skill-graph.js";
import { searchTfidf } from "./search-embedded.js";
import { getSkillPrompt } from "./skill-prompt.js";
import { buildPrinciplesIndex } from "./principles-index.js";
import { toolModelSetup, toolAutomateWorkflow } from "./phase4-tools.js";

/**
 * Build all tools from tool-definitions.ts (single source of truth).
 * Unwraps z.object() to raw properties for @lmstudio/sdk compatibility.
 */
function buildAllTools(index: ReturnType<typeof buildIndex>): Tool[] {
  return ALL_TOOL_DEFS.map((def) => {
    // Extract raw properties from the zod object (for @lmstudio/sdk tool())
    const params = (def.parameters as any)._def.shape;

    return tool({
      name: def.name,
      description: def.description,
      parameters: params,  // raw properties, NOT a z.object()
      implementation: async (params: any) => {
        switch (def.name) {
          case "list_skills": {
            const category = params?.category ?? "all";
            const names = category === "all"
              ? index.by_category.all
              : index.by_category[category as keyof typeof index.by_category] ?? [];
            const items = names.map((n: string) => ({
              name: n,
              category: index.by_name[n].category,
              desc: index.by_name[n].description.slice(0, 120),
            }));
            return JSON.stringify(items, null, 2);
          }

          case "search_skills": {
            const q = params?.query ?? "";
            const limit = params?.limit ?? 5;
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
              .slice(0, limit)
              .map(({ s }) => ({ name: s.name, category: s.category, desc: s.description.slice(0, 120) }));
            return JSON.stringify(hits, null, 2);
          }

          case "get_skill": {
            const name = params?.name;
            const mode = params?.mode ?? "summary";
            if (!name) return "Error: 'name' parameter is required.";
            const skill = index.by_name[name];
            if (!skill) return `Skill not found: ${name}. Use list_skills or search_skills.`;
            return mode === "full" ? skill.content_full : skill.content_summary;
          }

          case "recommend_skills": {
            const task = params?.task ?? "";
            const limit = params?.limit ?? 3;
            const results = recommendSkills(task, index, limit);
            return JSON.stringify(results, null, 2);
          }

          case "get_principles": {
            const names = params?.names ?? [];
            const mode = params?.mode ?? "summary";
            const principles = index.skills.filter((s) => s.is_principle);
            let selected = principles;
            if (names && names.length > 0) {
              const normalized = names.map((n: string) =>
                n.startsWith("principle-") ? n : `principle-${n}`,
              );
              selected = principles.filter((p) => normalized.includes(p.name));
            }
            if (mode === "summary") {
              const brief = selected.map((p) => ({ name: p.name, desc: p.description.slice(0, 160) }));
              return JSON.stringify(brief, null, 2);
            }
            return selected.map((p) => `### ${p.name}\n\n${p.content_full}`).join("\n\n---\n\n");
          }

          case "get_playbook": {
            const name = params?.name;
            const mode = params?.mode ?? "summary";
            if (!name) return "Error: 'name' parameter is required.";
            const pb = index.playbook_by_name[name];
            if (!pb) {
              const known = Object.keys(index.playbook_by_name).join(", ");
              return `Playbook not found: ${name}. Known: ${known}`;
            }
            return mode === "full" ? pb.content_full : pb.content_summary;
          }

          case "playbook-route": {
            const task = params?.task ?? "";
            const limit = params?.limit ?? 3;
            const result = playbookRoute(task, index, limit);
            return JSON.stringify(result, null, 2);
          }

          case "skill-graph": {
            const skill_name = params?.skill_name;
            const include_principles = params?.include_principles ?? true;
            const include_playbooks = params?.include_playbooks ?? true;
            const graph = buildSkillGraph(index);
            let filtered = graph;
            if (skill_name) {
              const neighbors = new Set([skill_name]);
              for (const edge of graph.edges) {
                if (edge.from === skill_name || edge.to === skill_name) {
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
            return JSON.stringify(filtered, null, 2);
          }

          case "search_skills_embedded": {
            const query = params?.query ?? "";
            const limit = params?.limit ?? 10;
            const hits = searchTfidf(query, index.skills, limit);
            return JSON.stringify(hits, null, 2);
          }

          case "skill-prompt": {
            const skill_name = params?.skill_name;
            const task_context = params?.task_context;
            if (!skill_name) return "Error: 'skill_name' parameter is required.";
            const { result, error } = getSkillPrompt(skill_name, index, task_context);
            if (error) return error;
            return JSON.stringify(result, null, 2);
          }

          case "principles-index": {
            const category = params?.category ?? "all";
            const idx = buildPrinciplesIndex(index);
            if (category === "all") return JSON.stringify(idx, null, 2);
            return JSON.stringify({
              hierarchy: { [category as keyof typeof idx.hierarchy]: idx.hierarchy[category as keyof typeof idx.hierarchy] },
              total_count: idx.total_count,
            }, null, 2);
          }

          // Phase 4: model-setup
          case "model-setup": {
            const pstackRoot = process.env.PSTACK_ROOT || process.cwd();
            const name = params?.name;
            const result = toolModelSetup({ name }, pstackRoot);
            if (!result.success) return result.error;
            const models = result.models!;
            const raw = result.raw!;
            if (name) return JSON.stringify({ model: models[0] }, null, 2);
            const lines = models.map((m: any) =>
              `  - ${m.name} (aliases: ${m.aliases.join(", ") || "none"} | reasoning: ${m.reasoningLevel})`
            );
            return `Found ${models.length} models:\n${lines.join("\n")}\n\n---\n\nFull config (${raw.length} chars):\n\n${raw}`;
          }

          // Phase 4: automate-workflow
          case "automate-workflow": {
            const pstackRoot = process.env.PSTACK_ROOT || process.cwd();
            const name = params?.automation_name;
            const mode = params?.mode ?? "list";
            const result = toolAutomateWorkflow({ automation_name: name, mode }, pstackRoot);
            if (!result.success) return result.error;
            if ("count" in result) return JSON.stringify(result, null, 2);
            if ("content" in result) {
              const automation = result.automation!;
              return `=== Automation: ${automation.name}\n=== Description: ${automation.description}\n\n${result.content}`;
            }
            return result.error;
          }

          default:
            return `Unknown tool: ${def.name}`;
        }
      },
    });
  });
}

/**
 * LM Studio toolsProvider — generates tools from unified definitions.
 */
export async function toolsProvider(_ctl: ToolsProviderController): Promise<Tool[]> {
  const root = process.env.PSTACK_ROOT || path.resolve(process.cwd(), "pstack");
  const index = buildIndex(root, "0.1.0");
  console.error(
    `[pstack-mcp] loaded ${index.skills.length} skills, ${index.playbooks.length} playbooks from ${root}`,
  );
  return buildAllTools(index);
}

/**
 * LM Studio plugin main entry point.
 * MUST accept PluginContext and call context.withToolsProvider(toolsProvider).
 */
export function main(context: PluginContext): void {
  context.withToolsProvider(toolsProvider);
}
