/**
 * src/tool-definitions.ts — Single source of truth for ALL tools.
 * Both MCP server (src/mcp.ts) and LM Studio plugin (src/index.ts)
 * import from here.
 *
 * IMPORTANT: @lmstudio/sdk's tool() wraps `parameters` in z.object().
 * Therefore parameters must be a plain Record<string, ZodType>, NOT a zod object.
 */
import { z } from "zod";
import type { Tool, PluginContext, ToolsProviderController } from "@lmstudio/sdk";
import { tool } from "@lmstudio/sdk";

// Category options
const CATEGORY_OPTIONS = [
  "all", "orchestration", "investigation", "design", "principle", "build", "verification",
] as const;

// Phase 4: benny automations directory path (relative to pstack root)
const BENNY_AUTOMATIONS_DIR = "automations/benny";

// Property schemas (the raw zod types, NOT wrapped in z.object())
const PARAMS = {
  list_skills: z.object({
    category: z.enum(CATEGORY_OPTIONS).default("all").describe("Filter by category. Use 'all' to list everything."),
  }),
  search_skills: z.object({
    query: z.string().describe("Keyword or short need description."),
    limit: z.number().int().min(1).max(10).default(5).describe("Max results to return."),
  }),
  get_skill: z.object({
    name: z.string().describe("Exact skill name, e.g. 'how', 'arena', 'principle-prove-it-works'."),
    mode: z.enum(["summary", "full"]).default("summary").describe("Return format: summary (brief) or full (complete content)."),
  }),
  recommend_skills: z.object({
    task: z.string().describe("What the agent is trying to do."),
    limit: z.number().int().min(1).max(5).default(3).describe("Max skills to recommend."),
  }),
  get_principles: z.object({
    names: z.array(z.string()).optional().describe("Optional principle names (with or without principle- prefix)."),
    mode: z.enum(["summary", "full"]).default("summary").describe("Return format: summary or full."),
  }),
  get_playbook: z.object({
    name: z.string().describe("Playbook name without .md, e.g. 'bug-fix', 'feature'."),
    mode: z.enum(["summary", "full"]).default("summary").describe("Return format: summary or full."),
  }),
  "playbook-route": z.object({
    task: z.string().describe("Task description to route (what you'd type after /poteto-mode)."),
    limit: z.number().int().min(1).max(10).default(3).describe("Max recommended skills to return."),
  }),
  "skill-graph": z.object({
    skill_name: z.string().optional().describe("Optional: show graph around this skill (neighbors + dependents)."),
    include_principles: z.boolean().default(true).describe("Include principle edges."),
    include_playbooks: z.boolean().default(true).describe("Include playbook edges."),
  }),
  search_skills_embedded: z.object({
    query: z.string().describe("Search phrase (e.g. 'parallel design', 'remove comments')."),
    limit: z.number().int().min(1).max(20).default(10).describe("Max results."),
  }),
  "skill-prompt": z.object({
    skill_name: z.string().describe("Exact skill name (e.g. 'how', 'arena', 'principle-prove-it-works')."),
    task_context: z.string().optional().describe("Optional task context to inject into the prompt template."),
  }),
  "principles-index": z.object({
    category: z.enum(["all", "core", "architecture", "verification", "delegation", "meta"]).default("all").describe("Filter by category."),
  }),
  // Phase 4: model-setup — read ~/.cursor/rules/pstack-models.mdc config file
  "model-setup": z.object({
    name: z.string().optional().describe("Specific model to look up (optional). If omitted, returns the full config."),
  }),
  // Phase 4: automate-workflow — list/read benny automations from pstack/automations/benny/
  "automate-workflow": z.object({
    automation_name: z.string().optional().describe("Specific automation name (e.g. 'reproduce-and-fix-issues'). If omitted, lists all."),
    mode: z.enum(["list", "read"]).default("list").describe("'list' shows all automations with descriptions, 'read' returns full content."),
  }),
};

// Category labels
const CATEGORIES: Record<string, string> = {
  list_skills: "query", search_skills: "query", get_skill: "query",
  recommend_skills: "recommendation", get_principles: "query", get_playbook: "query",
  "playbook-route": "routing", "skill-graph": "graph",
  search_skills_embedded: "query", "skill-prompt": "query", "principles-index": "query",
  "model-setup": "config", "automate-workflow": "automation",
};

export interface ToolDef {
  name: string;
  description: string;
  parameters: z.ZodType;
  category: string;
}

export const ALL_TOOL_DEFS: ToolDef[] = [
  { name: "list_skills", description: "List all pstack skills with short name, category and one-line description. Filter by category when you already know the kind of skill needed.", parameters: PARAMS.list_skills, category: CATEGORIES.list_skills },
  { name: "search_skills", description: "Search skills by keyword or short phrase (e.g. 'bug fix', 'parallel design', 'remove comments').", parameters: PARAMS.search_skills, category: CATEGORIES.search_skills },
  { name: "get_skill", description: "Get one skill by exact name. Use summary for a short brief, full for complete SKILL.md.", parameters: PARAMS.get_skill, category: CATEGORIES.get_skill },
  { name: "recommend_skills", description: "Given a task description, recommend the most relevant 1-5 skills to load right now. Best entry point for small models.", parameters: PARAMS.recommend_skills, category: CATEGORIES.recommend_skills },
  { name: "get_principles", description: "List all 24 engineering principles, or fetch specific ones by name.", parameters: PARAMS.get_principles, category: CATEGORIES.get_principles },
  { name: "get_playbook", description: "Get one poteto-mode playbook by name (bug-fix, feature, investigation, shipping, ...).", parameters: PARAMS.get_playbook, category: CATEGORIES.get_playbook },
  { name: "playbook-route", description: "Route a task to the best pstack playbook (like /poteto-mode). Returns matched playbook name, recommended skills, applicable principles, and a structured prompt to type.", parameters: PARAMS["playbook-route"], category: CATEGORIES["playbook-route"] },
  { name: "skill-graph", description: "Get the dependency/relation graph of pstack skills. Shows which skills are recommended by which playbooks, which principles they use.", parameters: PARAMS["skill-graph"], category: CATEGORIES["skill-graph"] },
  { name: "search_skills_embedded", description: "TF-IDF search of pstack skills. Better than keyword matching — handles phrases, partial matches, and synonyms.", parameters: PARAMS.search_skills_embedded, category: CATEGORIES.search_skills_embedded },
  { name: "skill-prompt", description: "Get a ready-to-use prompt for a specific skill. Returns formatted prompt + explanation + usage guide.", parameters: PARAMS["skill-prompt"], category: CATEGORIES["skill-prompt"] },
  { name: "principles-index", description: "All 24 engineering principles organized by hierarchy (Core → Architecture → Verification → Delegation → Meta). Shows cross-references to playbooks.", parameters: PARAMS["principles-index"], category: CATEGORIES["principles-index"] },
  // Phase 4 new tools
  { name: "model-setup", description: "Read ~/.cursor/rules/pstack-models.mdc config file. Returns model configuration (model names, aliases, fallbacks, reasoning levels) or a specific model's entry.", parameters: PARAMS["model-setup"], category: CATEGORIES["model-setup"] },
  { name: "automate-workflow", description: "List or read benny automations from pstack/automations/benny/. Use 'list' to see all available automations, 'read' to get full content of a specific one.", parameters: PARAMS["automate-workflow"], category: CATEGORIES["automate-workflow"] },
];

export type ToolName = typeof ALL_TOOL_DEFS[number]["name"];
