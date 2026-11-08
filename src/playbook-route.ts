/**
 * src/playbook-route.ts — /poteto-mode routing engine.
 * Matches task description to best playbook, returns structured route with prompt template.
 */
import { PstackSkillIndex, PlaybookRouteResult } from "./types.js";
import { PLAYBOOK_SKILL_MAP } from "./data/playbook-map.js";

const PLAYBOOK_PROMPT_TEMPLATES: Record<string, string> = {
  "bug-fix":
    "poteto-mode reproduce first, then fix and verify.\nDone means: [verify against the real artifact].\nShow the command output and before/after numbers.",
  feature:
    "poteto-mode build this feature behind a feature flag.\nVerify it really works by running the feature.\nShow the before/after state.",
  refactoring:
    "poteto-mode refactor this code. Keep behavior identical.\nRecord current outputs for fixtures first.\nDone means identical fixture results and all callers updated.",
  investigation:
    "poteto-mode new task. Investigate [what]. Don't modify any files yet.\nTrace with source locations. Use reproducible steps to separate confirmed behavior from hypotheses.",
  "perf-issue":
    "poteto-mode trace measured slowness and improve against baseline.\nRun a cpu trace or profiler. Show before/after numbers with explain-the-number.",
  hillclimb:
    "poteto-mode hillclimb this metric against target.\nLoop hypotheses with before/after measurement. One commit per accepted win.",
  "runtime-forensics":
    "poteto-mode diagnose this live symptom from instrumentation.\nDeliverable is a diagnosis, not a fix. Trace to the first place the system went wrong.",
  "trace-forensics":
    "poteto-mode diagnose this captured profiling artifact (cpuprofile/trace/spindump/heap snapshot).\nDeliverable is a diagnosis, not a fix.",
  prototype:
    "poteto-mode build 2-3 competing prototypes and compare side by side.\nThen commit to the best option. Exhaust the design space before committing.",
  "visual-parity":
    "poteto-mode match these two implementations pixel-exactly.\nRepro and fix until screenshots match. Check all breakpoints.",
  "authoring-a-skill":
    "poteto-mode author/edit this skill. Write the SKILL.md with Diátaxis structure.",
  eval:
    "poteto-mode evaluate this skill/prompt change. Blind test against baseline.\nReport the measured effect with explain-the-number.",
  babysit:
    "poteto-mode drive this PR/stack to merge-ready.\nCheck conflicts, review threads, CI status. Report what's outstanding.",
  shipping:
    "poteto-mode independently verify a green stack, then land bottom-up.\nNothing gets armed before an independent per-PR verdict.",
  "autonomous-run":
    "poteto-mode go to bed. Keep going until [done]. Log your decisions.",
  orchestrate:
    "poteto-mode stand up this project. Multi-day, many stacked PRs, fleet of subagents.\nOne coordinator chat, minimal human turns.",
  "autopilot-full":
    "poteto-mode run this queue of independent PRs to merged with full autonomy.",
  "autopilot-stack":
    "poteto-mode build and verify this PR queue. Don't merge. Stack each PR on its builder.",
  "session-pickup":
    "poteto-mode resume or take over a prior agent's in-flight work.\nReconstruct the current state from the transcript.",
  "pause-safely":
    "poteto-mode safely suspend in-flight work. Clean checkpoint for later resume.",
  "multi-phase-plan":
    "poteto-mode plan this work spanning phases/stacked PRs. Show the dependency graph first.",
  "worktree-cleanup":
    "poteto-mode what's eating my disk? Prune safe worktrees and stale simulators.",
  "opening-a-pr":
    "poteto-mode open a ready PR from small ordered commits. Conventional commits title + briefing body.",
};

export function playbookRoute(
  task: string,
  index: PstackSkillIndex,
  limit = 3
): PlaybookRouteResult {
  const lower = task.toLowerCase();
  const scores = new Map<string, { score: number; reason: string }>();

  // 1. Keyword matching against playbook keywords (same as recommendSkills)
  for (const [playbook, meta] of Object.entries(PLAYBOOK_SKILL_MAP)) {
    let hit = 0;
    for (const kw of meta.keywords) {
      if (lower.includes(kw.toLowerCase())) hit += 1;
    }
    if (hit === 0) continue;
    const base = hit * 10 + 20; // Higher base for playbook matching
    scores.set(playbook, { score: base, reason: meta.description });
  }

  // 2. Direct name/tag hits
  for (const skill of index.skills) {
    const plain = skill.name.replace(/^principle-/, "").replace(/-/g, " ");
    if (lower.includes(plain) || lower.includes(skill.name)) {
      const prev = scores.get(skill.name);
      const score = (prev?.score ?? 0) + 15;
      scores.set(skill.name, { score, reason: `Skill name match: "${skill.name}"` });
    }
  }

  // 3. Task-type heuristics
  const hasRepro = /\b(repro|reproduce|reproduction|bug|defect|crash|break|fail|error)\b/i.test(lower);
  const hasFeature = /\b(build|implement|add|create|new|feature)\b/i.test(lower);
  const hasPerf = /\b(perf|performance|slow|latency|throughput|speed|benchmark)\b/i.test(lower);
  const hasRefactor = /\b(refactor|cleanup|reshape|restructure|rename|clean)\b/i.test(lower);
  const hasInvestigate = /\b(investigat|how does|why is|why was|understand|explain)\b/i.test(lower);

  // Add playbook scores based on task heuristics
  if (hasRepro && !scores.has("bug-fix")) {
    scores.set("bug-fix", { score: 40, reason: "Task implies a defect reproduction scenario" });
  }
  if (hasFeature && !scores.has("feature")) {
    scores.set("feature", { score: 35, reason: "Task implies building new behavior" });
  }
  if (hasPerf && !scores.has("perf-issue")) {
    scores.set("perf-issue", { score: 35, reason: "Task implies performance measurement" });
  }
  if (hasRefactor && !scores.has("refactoring")) {
    scores.set("refactoring", { score: 30, reason: "Task implies structure-only changes" });
  }
  if (hasInvestigate && !scores.has("investigation")) {
    scores.set("investigation", { score: 30, reason: "Task implies read-only investigation" });
  }

  // Sort and pick best playbook
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 1); // Best playbook only

  if (ranked.length === 0) {
    // Fallback: figure-it-out
    return {
      matched_playbook: "figure-it-out",
      matched_playbook_title: "Figure it out",
      matched_playbook_description: "No bundled playbook fits. Designs a bespoke rigorous playbook.",
      recommended_skills: [],
      applicable_principles: [
        "principle-build-the-lever",
        "principle-exhaust-the-design-space",
        "principle-never-block-on-the-human",
      ],
      prompt_template: "/figure-it-out " + task + "\nI'm stepping away. Design a rigorous, auditable playbook for this task.",
      confidence: 0.15,
      fallback_skills: [
        { name: "poteto-help", reason: "No strong playbook match; start with poteto-help for routing" },
        { name: "how", reason: "Understand the codebase before acting" },
      ],
    };
  }

  const bestPlaybook = ranked[0][0];
  const meta = PLAYBOOK_SKILL_MAP[bestPlaybook];
  const prompt = PLAYBOOK_PROMPT_TEMPLATES[bestPlaybook] || `poteto-mode ${task}`;

  // Recommend skills from the playbook
  const recommended: Array<{ name: string; reason: string }> = (meta?.skills ?? [])
    .map((s) => ({ name: s, reason: `Recommended by "${bestPlaybook}" playbook` }))
    .filter((s) => index.by_name[s.name] || index.by_name["principle-" + s.name.replace("-", "")]);

  // Also add matching principles
  const principles = (meta?.principles ?? []).map((p) =>
    p.startsWith("principle-") ? p : `principle-${p}`
  );

  return {
    matched_playbook: bestPlaybook,
    matched_playbook_title: meta?.title || bestPlaybook,
    matched_playbook_description: meta?.description || "",
    recommended_skills: recommended.slice(0, limit),
    applicable_principles: principles,
    prompt_template: prompt,
    confidence: Math.min(0.95, 0.3 + ranked[0][1].score * 0.005),
    fallback_skills: [
      { name: "poteto-help", reason: "Alternative: start with poteto-help to refine the task" },
    ],
  };
}
