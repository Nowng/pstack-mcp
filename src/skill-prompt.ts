/**
 * src/skill-prompt.ts — Generate ready-to-use prompts for skills.
 * Returns formatted prompt + usage guide for each skill.
 */
import { PstackSkillIndex, SkillPromptResult } from "./types.js";

const SKILL_PROMPT_TEMPLATES: Record<string, { prompt: string; example: string }> = {
  "poteto-mode": {
    prompt: "/poteto-mode [your task description]\n\nDone means: [observable check]\nShow me the evidence.\n\n[any constraints: repro first, don't change code yet, etc.]",
    example: "/poteto-mode the CSV export drops its last row since yesterday's deploy. Reproduce first, then fix and verify. Done means the 60k-row fixture exports every row. Show me the row counts before and after.",
  },
  "poteto-help": {
    prompt: "/poteto-help\n\n[Your task description. Ask which skill fits.]",
    example: "/poteto-help which skill should I use to review this branch?",
  },
  "how": {
    prompt: "/how [what do you want to understand?]\n\n[Scope: which module/subsystem?]\n[What level: high-level architecture or detailed code flow?]",
    example: "/how do we cancel runs? Do we have an n+1 when we look up every run to cancel?",
  },
  "why": {
    prompt: "/why [what was built this way?]\n\n[What context: what problem was it trying to solve?]",
    example: "/why is this feature flag not on yet?",
  },
  "architect": {
    prompt: "/architect [design goal]\n\nConstraints: [what must be true]\nCompare at least 2 structurally different approaches.\nStop at the design checkpoint for review.\nDo not commit.",
    example: "/architect with checkpoint\nDesign a replaceable index-reading interface for article search.\nMust support today's static JSON and a future remote source.",
  },
  "arena": {
    prompt: "/arena [your brief]\n\nTake my prompt to the arena verbatim. I want to compare their proposals with yours.\n[Number of parallel attempts, or use default]",
    example: "/arena take my prompt to the arena verbatim. I want to compare their proposals with yours.",
  },
  "swarm": {
    prompt: "/swarm [task description]\n\nScope: [what to check/cover]\nOne report per item, then aggregated summary.",
    example: "/swarm check every package under packages/ against its check.sh. One worker per package. One report.",
  },
  "interrogate": {
    prompt: "/interrogate [review target]\n\nDo not modify the implementation or commit anything.\nFocus on incorrect behavior and compatibility regressions.\nEach finding needs an executable reproduction.\nList unverifiable concerns as limitations.",
    example: "/interrogate review this branch against main, including uncommitted changes.",
  },
  "unslop": {
    prompt: "can we unslop and tighten the [new changes / this code]?",
    example: "can we unslop and tighten the new changes?",
  },
  "tdd": {
    prompt: "/tdd [implement this]\n\nWrite the failing test first, then the fix.\n[What behavior should the test assert?]",
    example: "/tdd implement the cache invalidation logic",
  },
  "sharpen": {
    prompt: "/sharpen [your vague task description]\n\nI want a prompt made deeper, not bigger: what a top professional would do that you didn't ask for.",
    example: "/sharpen write a migration guide for the v2 config format.",
  },
  "ketchup": {
    prompt: "/ketchup\n\nWhat happened in this chat since your last message, in plain words and small visuals.",
    example: "/ketchup",
  },
  "recall": {
    prompt: "/recall [topic]\n\nRebuild recent context on this topic from chat history and shared record.",
    example: "/recall the auth flow",
  },
  "reflect": {
    prompt: "/reflect\n\nThat took too long. Capture what we learned so the next run doesn't repeat it.",
    example: "/reflect",
  },
  "show-me-your-work": {
    prompt: "/show-me-your-work\n\nKeep a decision trail I can review when I'm back.\n[Log to a TSV file you can commit?]",
    example: "/show-me-your-work keep a decision trail I can review when I'm back.",
  },
  "correct": {
    prompt: "/correct\n\nI keep correcting agents for the same mistakes. Mine history for mistake classes.",
    example: "/correct",
  },
  "teach": {
    prompt: "/teach [what to understand]\n\nI want to actually understand a change or subsystem, not just have it summarized.\nBuild up the explanation diagram by diagram.",
    example: "/teach how the authentication pipeline works",
  },
  "technical-writing": {
    prompt: "/technical-writing [what to write]\n\nFollow Diátaxis + Google developer style + STE + Global English.\n[Target audience? Docs, RFC, README, PR description?]",
    example: "/technical-writing write the API docs for the new auth endpoint",
  },
  "typescript-best-practices": {
    prompt: "/typescript-best-practices [what to review]\n\nGround the type-system-discipline principle in syntax.\nMake illegal states unrepresentable, brand semantic primitives.",
    example: "/typescript-best-practices review the new store module",
  },
  "in-your-own-words": {
    prompt: "/in-your-own-words\n\nPlay back my goal and the problem before you start.\nDon't wait for confirmation.",
    example: "/in-your-own-words",
  },
  "bro": {
    prompt: "/bro\n\nRestate the last message in plain human language, no jargon.",
    example: "/bro",
  },
  "blast-radius": {
    prompt: "/blast-radius [the change]\n\nWhat else could this break? With the one fact it's safe, proven by running code.\nNot asserted — proven.",
    example: "/blast-radius this small change to the cache key format",
  },
  "automate-me": {
    prompt: "/automate-me\n\nMine my recent transcripts. Draft a <your-name>-mode skill from how I've actually worked.",
    example: "/automate-me",
  },
  "setup-pstack": {
    prompt: "/setup-pstack\n\nPick which models pstack uses per role. Detects your models and writes a config rule.",
    example: "/setup-pstack",
  },
  "statechart": {
    prompt: "/statechart [what behavior to model]\n\nDraws a mermaid statechart, marks each state that breaks a rule, gives the shortest path to each.",
    example: "/statechart the payment lifecycle",
  },
};

const WHEN_TO_USE: Record<string, string[]> = {
  "poteto-mode": ["Any non-trivial task requiring rigorous engineering", "Want the agent to do full work with verification"],
  "poteto-help": ["New to pstack, unsure which skill fits", "Want routing guidance"],
  "how": ["Want a walkthrough of how a subsystem works", "Placement/ownership questions"],
  "why": ["Want to know why something was built this way", "Understand motivation behind a design"],
  "architect": ["About to write code crossing a function boundary", "Need design exploration before implementation"],
  "arena": ["Want N parallel attempts at the same thing", "Compare multiple proposals side by side"],
  "swarm": ["Want N parallel workers across different slices", "Coverage matrices and exploration partitions"],
  "interrogate": ["Have a diff and want models to try to break it", "Adversarial review before shipping"],
  "unslop": ["Cleaning up writing", "Removing AI tells from prose"],
  "tdd": ["Fixing a bug with a cheap local test path", "Write failing test first, then fix"],
  "sharpen": ["Request is vague, want a deeper prompt", "What a top professional would do that you didn't ask"],
  "ketchup": ["Wanted to know what changed since last message", "Catch-up on progress and pending decisions"],
  "recall": ["Starting or resuming work, need context rebuilt", "What happened on topic X?"],
  "reflect": ["Long task landed, want recipe captured", "Learn from past runs"],
  "show-me-your-work": ["Long autonomous task, need auditable trail", "Decision logging for review"],
  "correct": ["Keep correcting agents for same mistakes", "Mine history for mistake classes"],
  "teach": ["Want to understand a change/subsystem", "Not just summary, build diagram by diagram"],
  "technical-writing": ["Writing docs, RFCs, READMEs, PR descriptions", "Need Diátaxis structure"],
  "typescript-best-practices": ["Reading or editing TypeScript", "Type system discipline in syntax"],
  "in-your-own-words": ["Want agent to restate your goal before acting", "Catch misreadings early"],
  "bro": ["Last message was jargon-heavy", "Need plain-language restatement"],
  "blast-radius": ["Small-looking change, want to know what breaks", "Proven by running code, not asserted"],
  "automate-me": ["Want your own -mode skill drafted from your style", "Customize pstack to your workflow"],
  "setup-pstack": ["Pick models per role", "Configure reasoning budgets"],
  "statechart": ["Need to visualize behavior/state machine", "TLA+ model + mermaid output"],
};

export function skillPrompt(skillName: string, index: PstackSkillIndex): SkillPromptResult | null {
  const skill = index.by_name[skillName];
  if (!skill) return null;

  const template = SKILL_PROMPT_TEMPLATES[skillName];
  const whenToUse = WHEN_TO_USE[skillName] || skill.when_to_use ? [skill.when_to_use] : [];

  return {
    skill_name: skillName,
    prompt: template?.prompt || `/poteto-mode use skill "${skillName}" for: ${skill.description}`,
    explanation: skill.description || skill.title,
    when_to_use: whenToUse.length > 0 ? whenToUse : [skill.description.slice(0, 100)],
    example: template?.example || `/poteto-mode ${skill.description.slice(0, 80)}`,
  };
}

export function getSkillPrompt(name: string, index: PstackSkillIndex, taskContext?: string): {
  result: SkillPromptResult;
  error?: string;
} {
  const result = skillPrompt(name, index);
  if (!result) {
    return {
      result: {
        skill_name: name,
        prompt: `Skill not found: ${name}.`,
        explanation: "",
        when_to_use: [],
        example: "",
      },
      error: `Skill not found: ${name}. Use list_skills or search_skills.`,
    };
  }

  // Inject task context into prompt
  if (taskContext) {
    result.prompt = result.prompt.replace("[your task description]", taskContext);
    result.prompt = result.prompt.replace("[what to review]", taskContext);
    result.prompt = result.prompt.replace("[what to understand?]", taskContext);
    result.prompt = result.prompt.replace("[design goal]", taskContext);
    result.prompt = result.prompt.replace("[what to write]", taskContext);
  }

  return { result };
}
