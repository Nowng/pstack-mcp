/**
 * src/principles-index.ts — Principles hierarchy index.
 * All 24 principles organized by category with cross-references.
 */
import { PstackSkillIndex, PrinciplesIndexResult } from "./types.js";
import { PLAYBOOK_SKILL_MAP } from "./data/playbook-map.js";

// Category hierarchy
const CATEGORY_ORDER = {
  core: "Core",
  architecture: "Architecture",
  verification: "Verification",
  delegation: "Delegation",
  meta: "Meta",
} as const;

const CATEGORY_TITLES = {
  core: "Core — Laziness, foundational thinking, redesign from first principles, attack the premise, subtract before adding",
  architecture: "Architecture — Model the domain, boundary discipline, type system, idempotence, migrate callers, separate before serializing",
  verification: "Verification — Prove it works, fix root causes, sequence verifiable units, test behavior not implementation, explain the number",
  delegation: "Delegation — Guard the context window, never block on the human",
  meta: "Meta — Encode lessons in structure",
} as const;

// Map from principle name to category
const PRINCIPLE_CATEGORY: Record<string, "core" | "architecture" | "verification" | "delegation" | "meta"> = {
  "principle-laziness-protocol": "core",
  "principle-foundational-thinking": "core",
  "principle-redesign-from-first-principles": "core",
  "principle-attack-the-premise": "core",
  "principle-subtract-before-you-add": "core",
  "principle-minimize-reader-load": "core",
  "principle-outcome-oriented-execution": "core",
  "principle-experience-first": "core",
  "principle-exhaust-the-design-space": "core",
  "principle-build-the-lever": "core",
  "principle-model-the-domain": "architecture",
  "principle-boundary-discipline": "architecture",
  "principle-type-system-discipline": "architecture",
  "principle-make-operations-idempotent": "architecture",
  "principle-migrate-callers-then-delete-legacy-apis": "architecture",
  "principle-separate-before-serializing-shared-state": "architecture",
  "principle-prove-it-works": "verification",
  "principle-fix-root-causes": "verification",
  "principle-sequence-verifiable-units": "verification",
  "principle-test-behavior-not-implementation": "verification",
  "principle-explain-the-number": "verification",
  "principle-guard-the-context-window": "delegation",
  "principle-never-block-on-the-human": "delegation",
  "principle-encode-lessons-in-structure": "meta",
};

export function buildPrinciplesIndex(index: PstackSkillIndex): PrinciplesIndexResult {
  const principles = index.skills.filter((s) => s.is_principle);
  const hierarchy: Record<string, Array<{ name: string; title: string; desc: string; is_principle: boolean }>> = {
    core: [],
    architecture: [],
    verification: [],
    delegation: [],
    meta: [],
  };

  for (const p of principles) {
    const cat = PRINCIPLE_CATEGORY[p.name] || "meta";
    hierarchy[cat].push({
      name: p.name,
      title: p.title,
      desc: p.description.slice(0, 200),
      is_principle: true,
    });
  }

  // Cross-references: which playbooks reference each principle
  const crossRefs: Record<string, { referenced_in: string[]; supports: string[] }> = {};
  for (const p of principles) {
    const refs: string[] = [];
    for (const [pbName, meta] of Object.entries(PLAYBOOK_SKILL_MAP)) {
      const fullPName = p.name.startsWith("principle-") ? p.name : `principle-${p.name}`;
      if (meta.principles.includes(fullPName)) {
        refs.push(pbName);
      }
    }
    crossRefs[p.name] = {
      referenced_in: refs,
      supports: [],
    };
  }

  return {
    hierarchy,
    cross_references: crossRefs,
    total_count: principles.length,
  };
}
