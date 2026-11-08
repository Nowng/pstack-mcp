/** Static mapping extracted from poteto-mode 23 playbooks */
export const PLAYBOOK_SKILL_MAP: Record<
  string,
  {
    title: string;
    description: string;
    skills: string[];
    principles: string[];
    keywords: string[];
  }
> = {
  investigation: {
    title: "Investigation",
    description: "Read-only question: how does X work, why was Y built, are we sure.",
    skills: ["how", "why", "unslop"],
    principles: [],
    keywords: ["how does", "why was", "are we sure", "explain", "understand", "investigation"],
  },
  "bug-fix": {
    title: "Bug fix",
    description: "Reproduce a defect, root-cause it, fix with runtime evidence.",
    skills: [
      "how",
      "why",
      "principle-fix-root-causes",
      "tdd",
      "principle-prove-it-works",
      "architect",
    ],
    principles: [
      "principle-fix-root-causes",
      "principle-prove-it-works",
      "principle-sequence-verifiable-units",
    ],
    keywords: ["bug", "fix", "repro", "reproduce", "defect", "regression", "crash"],
  },
  "perf-issue": {
    title: "Perf issue",
    description: "Trace measured slowness and improve against a baseline.",
    skills: [
      "how",
      "benchmark-checklist",
      "principle-explain-the-number",
      "principle-prove-it-works",
      "architect",
    ],
    principles: [
      "principle-explain-the-number",
      "principle-prove-it-works",
      "principle-sequence-verifiable-units",
    ],
    keywords: ["perf", "performance", "slow", "latency", "throughput", "speed"],
  },
  hillclimb: {
    title: "Hillclimb",
    description: "Sustained scientific improvement of one metric against a target.",
    skills: [
      "how",
      "benchmark-checklist",
      "principle-explain-the-number",
      "show-me-your-work",
      "principle-sequence-verifiable-units",
    ],
    principles: [
      "principle-explain-the-number",
      "principle-sequence-verifiable-units",
      "principle-prove-it-works",
    ],
    keywords: ["hillclimb", "optimize metric", "improve metric", "sustained improvement"],
  },
  "runtime-forensics": {
    title: "Runtime forensics",
    description: "Diagnose a live symptom from instrumentation.",
    skills: ["how", "principle-fix-root-causes", "principle-prove-it-works"],
    principles: ["principle-fix-root-causes", "principle-prove-it-works"],
    keywords: ["leak", "idle-cpu", "glitch", "runtime", "live symptom", "forensics"],
  },
  "trace-forensics": {
    title: "Trace forensics",
    description: "Diagnose a captured profiling artifact.",
    skills: ["how", "principle-fix-root-causes", "benchmark-checklist"],
    principles: ["principle-fix-root-causes", "principle-explain-the-number"],
    keywords: ["cpuprofile", "trace", "spindump", "heap snapshot", "profile"],
  },
  feature: {
    title: "Feature",
    description: "New or changed behavior, built from a named data shape.",
    skills: [
      "how",
      "architect",
      "arena",
      "principle-model-the-domain",
      "principle-prove-it-works",
      "unslop",
    ],
    principles: [
      "principle-model-the-domain",
      "principle-prove-it-works",
      "principle-sequence-verifiable-units",
      "principle-laziness-protocol",
    ],
    keywords: ["feature", "new behavior", "implement", "add", "build"],
  },
  refactoring: {
    title: "Refactoring",
    description: "Behavior-preserving change to structure or shape.",
    skills: [
      "how",
      "principle-model-the-domain",
      "principle-subtract-before-you-add",
      "principle-laziness-protocol",
      "principle-migrate-callers-then-delete-legacy-apis",
      "architect",
    ],
    principles: [
      "principle-subtract-before-you-add",
      "principle-laziness-protocol",
      "principle-model-the-domain",
      "principle-foundational-thinking",
    ],
    keywords: ["refactor", "cleanup", "reshape", "restructure", "rename"],
  },
  prototype: {
    title: "Prototype",
    description: "Throwaway sketch to settle a design or empirical decision cheaply.",
    skills: ["principle-exhaust-the-design-space", "principle-never-block-on-the-human"],
    principles: ["principle-exhaust-the-design-space", "principle-never-block-on-the-human"],
    keywords: ["prototype", "sketch", "spike", "explore options", "try alternatives"],
  },
  "visual-parity": {
    title: "Visual parity",
    description: "Pixel-exact UI equivalence between two implementations.",
    skills: ["how", "principle-prove-it-works"],
    principles: ["principle-prove-it-works"],
    keywords: ["visual parity", "pixel", "ui equivalence", "screenshot compare"],
  },
  "authoring-a-skill": {
    title: "Authoring a skill",
    description: "Writing or editing a SKILL.md.",
    skills: [
      "unslop",
      "principle-encode-lessons-in-structure",
      "principle-minimize-reader-load",
    ],
    principles: [
      "principle-encode-lessons-in-structure",
      "principle-minimize-reader-load",
    ],
    keywords: ["skill.md", "author skill", "write skill", "create skill"],
  },
  eval: {
    title: "Eval",
    description: "Blind test how a skill or prompt change affects agent behavior.",
    skills: ["arena", "principle-explain-the-number", "unslop"],
    principles: ["principle-explain-the-number"],
    keywords: ["eval", "evaluate", "blind test", "ab test", "prompt change"],
  },
  babysit: {
    title: "Babysit",
    description: "Drive a PR or stack to merge-ready: conflicts, review, CI.",
    skills: ["show-me-your-work", "principle-never-block-on-the-human"],
    principles: [
      "principle-never-block-on-the-human",
      "principle-sequence-verifiable-units",
    ],
    keywords: ["babysit", "pr status", "get it green", "ci", "review threads"],
  },
  shipping: {
    title: "Shipping",
    description: "Independently verify a green stack, then land bottom-up.",
    skills: ["principle-prove-it-works", "swarm", "show-me-your-work"],
    principles: ["principle-prove-it-works", "principle-sequence-verifiable-units"],
    keywords: ["ship", "land", "merge stack", "shipping"],
  },
  "autonomous-run": {
    title: "Autonomous run",
    description: "Drive a long task to completion without stopping.",
    skills: [
      "show-me-your-work",
      "principle-sequence-verifiable-units",
      "principle-never-block-on-the-human",
      "principle-prove-it-works",
    ],
    principles: [
      "principle-sequence-verifiable-units",
      "principle-never-block-on-the-human",
      "principle-prove-it-works",
    ],
    keywords: ["autonomous", "don't stop", "until done", "overnight", "loop until"],
  },
  orchestrate: {
    title: "Orchestrate",
    description: "Multi-day standing project with many stacked PRs and subagents.",
    skills: [
      "show-me-your-work",
      "principle-guard-the-context-window",
      "principle-sequence-verifiable-units",
      "swarm",
    ],
    principles: [
      "principle-guard-the-context-window",
      "principle-sequence-verifiable-units",
    ],
    keywords: ["orchestrate", "multi-day", "standing project", "fleet"],
  },
  "autopilot-full": {
    title: "Autopilot full",
    description: "Independent PRs to merged with one owner per PR; swarm verifies.",
    skills: ["swarm", "principle-prove-it-works", "show-me-your-work"],
    principles: ["principle-prove-it-works", "principle-sequence-verifiable-units"],
    keywords: ["autopilot", "auto merge", "run to merged"],
  },
  "autopilot-stack": {
    title: "Autopilot stack",
    description: "Build and verify PRs for operator to review and land.",
    skills: ["swarm", "principle-prove-it-works", "show-me-your-work"],
    principles: ["principle-prove-it-works", "principle-sequence-verifiable-units"],
    keywords: ["autopilot stack", "stack prs", "no auto merge"],
  },
  "session-pickup": {
    title: "Session pickup",
    description: "Resume or take over a prior agent's in-flight work.",
    skills: ["show-me-your-work", "recall", "how"],
    principles: [],
    keywords: ["resume", "pickup", "take over", "continue previous"],
  },
  "pause-safely": {
    title: "Pause safely",
    description: "Suspend in-flight work cleanly so it can be resumed later.",
    skills: ["show-me-your-work"],
    principles: [],
    keywords: ["pause", "suspend", "checkpoint", "stop cleanly"],
  },
  "multi-phase-plan": {
    title: "Multi-phase plan",
    description: "Work that spans phases or stacked PRs (plan only, no implement).",
    skills: [
      "how",
      "architect",
      "principle-sequence-verifiable-units",
      "principle-never-block-on-the-human",
    ],
    principles: [
      "principle-sequence-verifiable-units",
      "principle-never-block-on-the-human",
      "principle-guard-the-context-window",
    ],
    keywords: ["plan", "multi-phase", "roadmap", "stacked prs plan"],
  },
  "worktree-cleanup": {
    title: "Worktree cleanup",
    description: "Reclaim disk by pruning merged or abandoned worktrees.",
    skills: ["principle-laziness-protocol"],
    principles: ["principle-laziness-protocol"],
    keywords: ["worktree", "cleanup", "prune", "disk"],
  },
  "opening-a-pr": {
    title: "Opening a PR",
    description: "Open a ready PR from small ordered commits with briefing body.",
    skills: ["technical-writing", "unslop", "no-comments"],
    principles: ["principle-minimize-reader-load"],
    keywords: ["open pr", "pull request", "create pr"],
  },
};

/** Always soft-recommend these when a change is involved */
export const GLOBAL_SOFT_SKILLS = [
  "unslop",
  "principle-prove-it-works",
  "principle-guard-the-context-window",
];
