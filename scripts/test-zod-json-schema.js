const z = require("zod");
const zodToJsonSchema = require("zod-to-json-schema").default;

const CATEGORY_OPTIONS = ["all","orchestration","investigation","design","principle","build","verification"];

const tools = [
  { name: "list_skills", schema: z.object({ category: z.enum(CATEGORY_OPTIONS).default("all").describe("Filter by category.") }) },
  { name: "search_skills", schema: z.object({ query: z.string().describe("Keyword."), limit: z.number().int().min(1).max(10).default(5).describe("Max results.") }) },
  { name: "get_skill", schema: z.object({ name: z.string().describe("Skill name."), mode: z.enum(["summary","full"]).default("summary").describe("Return format.") }) },
  { name: "recommend_skills", schema: z.object({ task: z.string().describe("Task."), limit: z.number().int().min(1).max(5).default(3).describe("Max skills.") }) },
  { name: "get_principles", schema: z.object({ names: z.array(z.string()).optional().describe("Principle names."), mode: z.enum(["summary","full"]).default("summary").describe("Return format.") }) },
  { name: "get_playbook", schema: z.object({ name: z.string().describe("Playbook name."), mode: z.enum(["summary","full"]).default("summary").describe("Return format.") }) },
  { name: "playbook-route", schema: z.object({ task: z.string().describe("Task."), limit: z.number().int().min(1).max(10).default(3).describe("Max skills.") }) },
  { name: "skill-graph", schema: z.object({ skill_name: z.string().optional().describe("Skill name."), include_principles: z.boolean().default(true).describe("Include principles."), include_playbooks: z.boolean().default(true).describe("Include playbooks.") }) },
  { name: "search_skills_embedded", schema: z.object({ query: z.string().describe("Search phrase."), limit: z.number().int().min(1).max(20).default(10).describe("Max results.") }) },
  { name: "skill-prompt", schema: z.object({ skill_name: z.string().describe("Skill name."), task_context: z.string().optional().describe("Task context.") }) },
  { name: "principles-index", schema: z.object({ category: z.enum(["all","core","architecture","verification","delegation","meta"]).default("all").describe("Category.") }) },
];

for (const t of tools) {
  try {
    zodToJsonSchema(t.schema);
    console.log("✅ " + t.name);
  } catch (e) {
    console.log("❌ " + t.name + ": " + e.message.slice(0,100));
  }
}
