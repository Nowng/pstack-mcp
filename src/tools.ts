/**
 * src/tools.ts — Unified tool definitions for Phase 2+ tools.
 * All new tools are defined here for both MCP server and LM Studio plugin.
 */
import { z } from "zod";

// Playbook route tool
export const PlaybookRouteArgs = z.object({
  task: z.string().min(1).describe("Task description to route to a playbook (like what you'd type after /poteto-mode)"),
  limit: z.number().int().min(1).max(10).default(3).describe("Max recommended skills to return"),
});

// Skill graph tool
export const SkillGraphArgs = z.object({
  skill_name: z.string().optional().describe("If given, show the graph neighborhood for this skill (neighbors, dependents, dependees)"),
  include_principles: z.boolean().default(true).describe("Include principle edges in the graph"),
  include_playbooks: z.boolean().default(true).describe("Include playbook edges in the graph"),
});

// Embedded search tool
export const SearchSkillsEmbeddedArgs = z.object({
  query: z.string().min(1).describe("Query to search (can be a phrase, not just a keyword)"),
  limit: z.number().int().min(1).max(20).default(10).describe("Max results"),
});

// Skill prompt tool
export const SkillPromptArgs = z.object({
  skill_name: z.string().describe("Exact skill name (e.g. 'how', 'arena', 'principle-prove-it-works')"),
  task_context: z.string().optional().describe("Optional task context to inject into the prompt template"),
});

// Principles index tool
export const PrinciplesIndexArgs = z.object({
  category: z.enum(["all", "core", "architecture", "verification", "delegation", "meta"]).default("all").describe("Filter by category"),
});

// Phase 4: model-setup tool
export const ModelSetupArgs = z.object({
  name: z.string().optional().describe("Specific model to look up (optional). If omitted, returns the full config."),
});

// Phase 4: automate-workflow tool
export const AutomateWorkflowArgs = z.object({
  automation_name: z.string().optional().describe("Specific automation name (e.g. 'reproduce-and-fix-issues'). If omitted, lists all."),
  mode: z.enum(["list", "read"]).default("list").describe("'list' shows all automations, 'read' returns full content of one."),
});
