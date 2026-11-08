/**
 * src/phase4-tools.ts — Phase 4 tools: model-setup and automate-workflow.
 *
 * Structure of pstack/automations/benny/:
 *   skills/<name>/SKILL.md          — skill file per automation
 *   templates/<name>-automation-prompt.md — template per automation
 */
import { readFileSync, readdirSync, lstatSync } from "fs";
import { join } from "path";

const SKILLS_DIR = "pstack/automations/benny/skills";
const TEMPLATES_DIR = "pstack/automations/benny/templates";

// ---------------------------------------------------------------------------
// model-setup tool
// ---------------------------------------------------------------------------

function readModelConfig(pstackRoot: string): string | null {
  const localPath = join(pstackRoot, "pstack-models.mdc");
  try { return readFileSync(localPath, "utf-8"); } catch { /* fallthrough */ }
  const homePath = join(process.env.HOME || "", ".cursor/rules/pstack-models.mdc");
  try { return readFileSync(homePath, "utf-8"); } catch { return null; }
}

function parseModelConfig(text: string): Array<{ name: string; aliases: string[]; fallbacks: string[]; reasoningLevel: string }> {
  const entries: Array<{ name: string; aliases: string[]; fallbacks: string[]; reasoningLevel: string }> = [];
  let current: (typeof entries)[number] | null = null;
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t.startsWith("model:")) { if (current) entries.push(current); current = { name: t.replace(/^model:\s*/, "").trim(), aliases: [], fallbacks: [], reasoningLevel: "" }; continue; }
    if (!current) continue;
    if (t.startsWith("aliases:")) current.aliases = t.replace(/^aliases:\s*/, "").trim().split(",").map(s => s.trim()).filter(Boolean);
    else if (t.startsWith("fallbacks:")) current.fallbacks = t.replace(/^fallbacks:\s*/, "").trim().split(",").map(s => s.trim()).filter(Boolean);
    else if (t.startsWith("reasoning_level:")) current.reasoningLevel = t.replace(/^reasoning_level:\s*/, "").trim();
  }
  if (current) entries.push(current);
  return entries;
}

export function toolModelSetup(args: { name?: string }, pstackRoot: string) {
  const text = readModelConfig(pstackRoot);
  if (!text) return { success: false, error: "pstack-models.mdc not found at $PSTACK_ROOT/pstack-models.mdc or ~/.cursor/rules/pstack-models.mdc" };
  const allModels = parseModelConfig(text);
  const name = args.name;
  return { success: true, models: name ? allModels.filter(m => m.name === name || m.aliases.includes(name)) : allModels, raw: text };
}

// ---------------------------------------------------------------------------
// automate-workflow tool
// ---------------------------------------------------------------------------

export interface AutomationEntry {
  name: string;
  description: string;
  has_skill: boolean;
  has_template: boolean;
  skill_path: string | null;
  template_path: string | null;
}

export function toolAutomateWorkflow(args: { automation_name?: string; mode: "list" | "read" }, pstackRoot: string) {
  const skillsDir = join(pstackRoot, SKILLS_DIR);

  let automations: AutomationEntry[] = [];
  try {
    const items = readdirSync(skillsDir).sort();
    for (const item of items) {
      const itemPath = join(skillsDir, item);
      const stat = lstatSync(itemPath);
      if (!stat.isDirectory()) continue;

      const skillPath = join(itemPath, "SKILL.md");
      const templatePath = join(pstackRoot, TEMPLATES_DIR, `${item}-automation-prompt.md`);
      let skillExists = false;
      let templateExists = false;
      try { skillExists = lstatSync(skillPath).isFile(); } catch { /* not found */ }
      try { templateExists = lstatSync(templatePath).isFile(); } catch { /* not found */ }

      let description = "";
      if (skillExists) {
        try {
          const lines = readFileSync(skillPath, "utf-8").split("\n");
          for (const l of lines) { if (l.trim().startsWith("# ")) { description = l.trim().slice(2); break; } }
        } catch { description = "(unreadable)"; }
      }

      automations.push({ name: item, description, has_skill: skillExists, has_template: templateExists, skill_path: skillExists ? skillPath : null, template_path: templateExists ? templatePath : null });
    }
  } catch { return { success: false, error: `Benny automations directory not found at: ${skillsDir}` }; }

  if (args.mode === "read") {
    const entry = automations.find(a => a.name === args.automation_name);
    if (!entry) return { success: false, error: `Automation not found: ${args.automation_name}. Available: ${automations.map(a => a.name).join(", ")}` };
    let content = "";
    if (entry.skill_path) content += readFileSync(entry.skill_path, "utf-8");
    if (entry.template_path) { content += (content ? "\n\n=== TEMPLATE ===\n\n" : ""); content += readFileSync(entry.template_path, "utf-8"); }
    return { success: true, automation: { name: entry.name, description: entry.description }, content };
  }

  return { success: true, count: automations.length, automations: automations.map(a => ({ name: a.name, description: a.description.slice(0, 160), has_skill: a.has_skill, has_template: a.has_template })) };
}
