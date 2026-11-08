/**
 * src/types.ts — Extended types for Phase 2 tools.
 */
export type SkillCategory =
  | "orchestration"
  | "investigation"
  | "design"
  | "principle"
  | "build"
  | "verification";

export interface SkillIndexEntry {
  name: string;
  title: string;
  category: SkillCategory;
  description: string;
  tags: string[];
  when_to_use: string;
  depends_on: string[];
  is_principle: boolean;
  content_summary: string;
  content_full: string;
  path: string;
}

export interface PlaybookIndexEntry {
  name: string;
  title: string;
  description: string;
  recommended_skills: string[];
  principles: string[];
  path: string;
  content_summary: string;
  content_full: string;
}

export interface PstackSkillIndex {
  version: string;
  generated_at: string;
  skills: SkillIndexEntry[];
  by_name: Record<string, SkillIndexEntry>;
  by_category: Record<SkillCategory | "all", string[]>;
  playbooks: PlaybookIndexEntry[];
  playbook_by_name: Record<string, PlaybookIndexEntry>;
}

export interface RecommendResult {
  name: string;
  reason: string;
  priority: number;
}

/* ===== Phase 2: New types ===== */

export interface PlaybookRouteResult {
  matched_playbook: string;
  matched_playbook_title: string;
  matched_playbook_description: string;
  recommended_skills: Array<{ name: string; reason: string }>;
  applicable_principles: string[];
  prompt_template: string;
  confidence: number;
  fallback_skills?: Array<{ name: string; reason: string }>;
}

export interface SkillGraphEdge {
  from: string;
  to: string;
  label: string;
}

export interface SkillGraphResult {
  nodes: Array<{ name: string; category: SkillCategory }>;
  edges: SkillGraphEdge[];
  adjacency: Record<string, string[]>;
  stats: { total_skills: number; total_principles: number; total_playbooks: number };
}

export interface SkillPromptResult {
  skill_name: string;
  prompt: string;
  explanation: string;
  when_to_use: string[];
  example: string;
}

export interface PrinciplesIndexResult {
  hierarchy: Record<"core" | "architecture" | "verification" | "delegation" | "meta", Array<{
    name: string;
    title: string;
    desc: string;
    is_principle: boolean;
  }>>;
  cross_references: Record<string, { referenced_in: string[]; supports: string[] }>;
  total_count: number;
}

export interface EmbeddedSearchResult {
  name: string;
  category: SkillCategory;
  desc: string;
  score: number;
  tfidf: Record<string, number>;
}
