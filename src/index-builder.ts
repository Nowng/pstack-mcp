import fs from "node:fs";
import path from "node:path";
import type {
  PstackSkillIndex,
  SkillIndexEntry,
  SkillCategory,
  PlaybookIndexEntry,
} from "./types.js";
import { PLAYBOOK_SKILL_MAP } from "./data/playbook-map.js";
import { cache, TTL_INDEX, TTL_FILE_FULL } from "./cache.js";

// Cache keys
const INDEX_CACHE_KEY = (root: string) => `index:${root}`;
const FILE_CACHE_KEY = (relPath: string) => `file:${relPath}`;
const PLAYBOOK_CACHE_KEY = (name: string) => `file:playbook:${name}`;

const CATEGORY_RULES: { test: (name: string) => boolean; cat: SkillCategory }[] = [
  {
    test: (n) =>
      ["poteto-mode", "poteto-help", "setup-pstack", "automate-me", "in-your-own-words"].includes(
        n
      ),
    cat: "orchestration",
  },
  {
    test: (n) =>
      ["how", "why", "teach", "recall", "figure-it-out", "reflect", "show-me-your-work"].includes(
        n
      ),
    cat: "investigation",
  },
  {
    test: (n) =>
      ["architect", "arena", "swarm", "interrogate", "blast-radius"].includes(n),
    cat: "design",
  },
  { test: (n) => n.startsWith("principle-"), cat: "principle" },
  {
    test: (n) =>
      [
        "tdd",
        "unslop",
        "no-comments",
        "technical-writing",
        "typescript-best-practices",
        "correct",
        "sharpen",
        "bro",
      ].includes(n),
    cat: "build",
  },
  { test: () => true, cat: "verification" },
];

function inferCategory(name: string): SkillCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.test(name)) return rule.cat;
  }
  return "verification";
}

function parseFrontmatter(raw: string): { description: string; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { description: "", body: raw };
  const fm = match[1];
  const body = match[2];
  const descMatch = fm.match(/description:\s*[>|]?\s*([\s\S]*?)(?=\n\w|\n---|$)/);
  let description = "";
  if (descMatch) {
    description = descMatch[1]
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^["']|["']$/g, "")
      .trim();
  }
  return { description, body };
}

function makeSummary(name: string, description: string, body: string): string {
  const firstHeading = body.match(/^#\s+(.+)$/m)?.[1] ?? name;
  const firstPara =
    body
      .split(/\n\n+/)
      .map((p) => p.replace(/^#+\s.*/gm, "").trim())
      .find((p) => p.length > 40) ?? description;
  return [
    `Skill: ${name}`,
    `Title: ${firstHeading}`,
    `Description: ${description || firstPara.slice(0, 200)}`,
    "",
    firstPara.slice(0, 600) + (firstPara.length > 600 ? "…" : ""),
  ].join("\n");
}

export function buildIndex(skillsRoot: string, version = "0.1.0"): PstackSkillIndex {
  // Check index-level cache
  const cachedIndex = cache.get(INDEX_CACHE_KEY(skillsRoot));
  if (cachedIndex) return JSON.parse(cachedIndex);

  const skillsDir = path.join(skillsRoot, "skills");
  const playbooksDir = path.join(skillsDir, "poteto-mode", "playbooks");

  const skills: SkillIndexEntry[] = [];
  const by_name: Record<string, SkillIndexEntry> = {};
  const by_category: Record<string, string[]> = {
    all: [],
    orchestration: [],
    investigation: [],
    design: [],
    principle: [],
    build: [],
    verification: [],
  };

  if (fs.existsSync(skillsDir)) {
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      const skillPath = path.join(skillsDir, name, "SKILL.md");
      if (!fs.existsSync(skillPath)) continue;

      const relPath = path.join("skills", name, "SKILL.md");
      let raw = cache.get(FILE_CACHE_KEY(relPath));

      if (!raw) {
        raw = fs.readFileSync(skillPath, "utf8");
        cache.set(FILE_CACHE_KEY(relPath), raw, TTL_FILE_FULL);
      }

      const { description, body } = parseFrontmatter(raw);
      const category = inferCategory(name);
      const is_principle = name.startsWith("principle-");

      const item: SkillIndexEntry = {
        name,
        title: name,
        category,
        description: description || `${name} skill`,
        tags: name.split("-").filter((t) => t !== "principle"),
        when_to_use: description.slice(0, 160) || `Use for ${name}`,
        depends_on: [],
        is_principle,
        content_summary: makeSummary(name, description, body),
        content_full: raw,
        path: relPath,
      };

      skills.push(item);
      by_name[name] = item;
      by_category.all.push(name);
      by_category[category].push(name);
    }
  }

  const playbooks: PlaybookIndexEntry[] = [];
  const playbook_by_name: Record<string, PlaybookIndexEntry> = {};

  for (const [name, meta] of Object.entries(PLAYBOOK_SKILL_MAP)) {
    let content_full = "";
    const pbPath = path.join(playbooksDir, `${name}.md`);
    const pbKey = PLAYBOOK_CACHE_KEY(name);

    const cached = cache.get(pbKey);
    if (cached) {
      content_full = cached;
    } else if (fs.existsSync(pbPath)) {
      content_full = fs.readFileSync(pbPath, "utf8");
      cache.set(pbKey, content_full, TTL_FILE_FULL);
    }

    const entry: PlaybookIndexEntry = {
      name,
      title: meta.title,
      description: meta.description,
      recommended_skills: meta.skills,
      principles: meta.principles,
      path: `skills/poteto-mode/playbooks/${name}.md`,
      content_summary: [
        `Playbook: ${name}`,
        `Title: ${meta.title}`,
        `Description: ${meta.description}`,
        `Recommended skills: ${meta.skills.join(", ")}`,
        `Principles: ${meta.principles.join(", ") || "(none)"}`,
      ].join("\n"),
      content_full: content_full || meta.description,
    };
    playbooks.push(entry);
    playbook_by_name[name] = entry;
  }

  const index: PstackSkillIndex = {
    version,
    generated_at: new Date().toISOString(),
    skills,
    by_name,
    by_category: by_category as PstackSkillIndex["by_category"],
    playbooks,
    playbook_by_name,
  };

  // Cache the full index
  cache.set(INDEX_CACHE_KEY(skillsRoot), JSON.stringify(index), TTL_INDEX);

  return index;
}
