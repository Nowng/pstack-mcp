import { PLAYBOOK_SKILL_MAP, GLOBAL_SOFT_SKILLS } from "./data/playbook-map.js";
import type { RecommendResult, PstackSkillIndex } from "./types.js";

export function recommendSkills(
  task: string,
  index: PstackSkillIndex,
  limit = 3
): RecommendResult[] {
  const lower = task.toLowerCase();
  const scores = new Map<string, { score: number; reason: string }>();

  // 1. Match playbooks by keywords
  for (const [playbook, meta] of Object.entries(PLAYBOOK_SKILL_MAP)) {
    let hit = 0;
    for (const kw of meta.keywords) {
      if (lower.includes(kw.toLowerCase())) hit += 1;
    }
    if (hit === 0) continue;

    const base = hit * 10;
    meta.skills.forEach((name, i) => {
      const prev = scores.get(name);
      const score = base + (meta.skills.length - i);
      const reason = `Matched playbook "${playbook}" (${meta.title})`;
      if (!prev || score > prev.score) {
        scores.set(name, { score, reason });
      }
    });
  }

  // 2. Direct name / tag hits from skill index
  for (const skill of index.skills) {
    const plain = skill.name.replace(/^principle-/, "").replace(/-/g, " ");
    if (lower.includes(plain) || lower.includes(skill.name)) {
      const prev = scores.get(skill.name);
      const score = (prev?.score ?? 0) + 5;
      scores.set(skill.name, {
        score,
        reason: prev?.reason ?? `Name/tag match for "${skill.name}"`,
      });
    }
    for (const tag of skill.tags) {
      if (lower.includes(tag.toLowerCase())) {
        const prev = scores.get(skill.name);
        const score = (prev?.score ?? 0) + 3;
        scores.set(skill.name, {
          score,
          reason: prev?.reason ?? `Tag match: ${tag}`,
        });
      }
    }
  }

  // 3. Soft global skills when task looks like a change
  const looksLikeChange =
    /\b(fix|implement|add|change|refactor|ship|merge|build|write|code)\b/i.test(
      task
    );
  if (looksLikeChange) {
    for (const name of GLOBAL_SOFT_SKILLS) {
      if (!scores.has(name) && index.by_name[name]) {
        scores.set(name, {
          score: 2,
          reason: "Global soft recommend for change-oriented tasks",
        });
      }
    }
  }

  // Sort and slice
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([name, { reason }], i) => ({
      name,
      reason,
      priority: i + 1,
    }));

  // Fallback: poteto-help if nothing matched
  if (ranked.length === 0 && index.by_name["poteto-help"]) {
    return [
      {
        name: "poteto-help",
        reason: "No strong match; start with poteto-help to route the task",
        priority: 1,
      },
    ];
  }

  return ranked;
}
