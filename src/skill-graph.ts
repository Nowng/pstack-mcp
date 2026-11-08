/**
 * src/skill-graph.ts — Skill dependency and relation graph.
 * Auto-generated from PLAYBOOK_SKILL_MAP + skill index.
 */
import { PLAYBOOK_SKILL_MAP } from "./data/playbook-map.js";
import { SkillGraphResult, SkillIndexEntry } from "./types.js";

export function buildSkillGraph(index: { skills: SkillIndexEntry[]; playbooks: any[] }): SkillGraphResult {
  const { skills, playbooks } = index;
  const edges: { from: string; to: string; label: string }[] = [];
  const adjacency: Record<string, string[]> = {};

  // Initialize adjacency for all skills
  for (const skill of skills) {
    adjacency[skill.name] = [];
  }
  // Also include principles
  for (const skill of skills) {
    if (skill.is_principle && !adjacency[skill.name]) {
      adjacency[skill.name] = [];
    }
  }

  // Edges: playbook -> recommended skills
  for (const pb of playbooks) {
    for (const skillName of pb.recommended_skills) {
      const fullSkillName = skillName.startsWith("principle-") ? skillName : skillName;
      if (adjacency[pb.name]) {
        adjacency[pb.name].push(fullSkillName);
        edges.push({
          from: pb.name,
          to: fullSkillName,
          label: `recommended by playbook "${pb.name}"`,
        });
      }
    }
    // Edges: playbook -> principles
    for (const principle of pb.principles) {
      const fullPrinciple = principle.startsWith("principle-") ? principle : `principle-${principle}`;
      if (adjacency[pb.name]) {
        adjacency[pb.name].push(fullPrinciple);
        edges.push({
          from: pb.name,
          to: fullPrinciple,
          label: `applies principle "${fullPrinciple}"`,
        });
      }
    }
  }

  // Edges: skill -> skill (if depends_on is set)
  for (const skill of skills) {
    for (const dep of skill.depends_on) {
      if (adjacency[skill.name] && !adjacency[skill.name].includes(dep)) {
        adjacency[skill.name].push(dep);
        edges.push({
          from: skill.name,
          to: dep,
          label: `depends on "${dep}"`,
        });
      }
    }
  }

  return {
    nodes: [
      ...skills.map((s) => ({ name: s.name, category: s.category })),
      ...playbooks.map((p) => ({ name: p.name, category: "verification" as any })),
    ],
    edges,
    adjacency,
    stats: {
      total_skills: skills.filter((s) => !s.is_principle).length,
      total_principles: skills.filter((s) => s.is_principle).length,
      total_playbooks: playbooks.length,
    },
  };
}
