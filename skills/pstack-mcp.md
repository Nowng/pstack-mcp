# pstack-mcp: Skills-on-Demand for Small Models

**Purpose:** When you (the LLM) are working on a task and need the right skill, principle, or playbook — call pstack-mcp instead of guessing.

## When to use pstack-mcp

- You need to **structure a task** (refactoring, debugging, testing) but don't know the right approach
- You need a **principle** to guide a design or implementation decision
- You need a **playbook** for a known pattern (bug fix, feature, shipping)
- You need a **prompt template** to format a skill for a subagent or code-writing task
- You need to **discover skills** related to your current task
- You need to **check which model settings or automations** are configured

## Available tools (13 tools)

### Discovery tools

**`list_skills`** — List all skills, optionally filtered by category.
```json
{ "tool": "list_skills", "params": { "category": "design" } }
```

**`search_skills`** — Keyword search across all skills.
```json
{ "tool": "search_skills", "params": { "query": "parallel design", "limit": 5 } }
```

**`search_skills_embedded`** — Phrase search (handles partial matches, synonyms).
```json
{ "tool": "search_skills_embedded", "params": { "query": "remove unnecessary comments", "limit": 10 } }
```

### Skill loading tools

**`get_skill`** — Load one skill. `mode: "summary"` = brief, `mode: "full"` = complete SKILL.md.
```json
{ "tool": "get_skill", "params": { "name": "how", "mode": "full" } }
```

**`get_skill`** — Also loads principles (prefixed with `principle-`).
```json
{ "tool": "get_skill", "params": { "name": "principle-prove-it-works", "mode": "full" } }
```

### Recommendation tools

**`recommend_skills`** — Given a task description, return the most relevant 1–5 skills. **Best entry point when you're unsure.**
```json
{ "tool": "recommend_skills", "params": { "task": "fix a race condition in a React app and verify the fix", "limit": 3 } }
```

**`playbook-route`** — Route a task → best playbook + recommended skills + structured prompt. Like typing `/poteto-mode`.
```json
{ "tool": "playbook-route", "params": { "task": "write a new feature for user authentication", "limit": 3 } }
```

### Principle tools

**`get_principles`** — List all 24 principles, or load specific ones.
```json
{ "tool": "get_principles", "params": { "names": ["fix-root-causes", "test-behavior-not-implementation"], "mode": "full" } }
```

**`principles-index`** — Browse all 24 organized by hierarchy (Core → Architecture → Verification → Delegation → Meta).
```json
{ "tool": "principles-index", "params": { "category": "verification" } }
```

### Playbook tools

**`get_playbook`** — Load one poteto-mode playbook.
```json
{ "tool": "get_playbook", "params": { "name": "bug-fix", "mode": "full" } }
```

### Graph tools

**`skill-graph`** — Explore the pstack skill dependency graph.
```json
{ "tool": "skill-graph", "params": { "skill_name": "how" } }
```

### Prompt tools

**`skill-prompt`** — Get a ready-to-use prompt for a skill.
```json
{ "tool": "skill-prompt", "params": { "skill_name": "how", "task_context": "explain why a React state machine has a deadlock" } }
```

### Configuration tools

**`model-setup`** — Read `pstack-models.mdc` config (model names, aliases, fallbacks).
```json
{ "tool": "model-setup", "params": {} }
```

**`automate-workflow`** — List or read benny automations.
```json
{ "tool": "automate-workflow", "params": { "mode": "list" } }
{ "tool": "automate-workflow", "params": { "automation_name": "reproduce-and-fix-issues", "mode": "read" } }
```

## Practical examples (copy these patterns)

### Situation: "I need to refactor a large component"
```
Step 1: "I'm refactoring. What should I do?"
→ call: playbook-route({ "task": "refactor a large component into smaller pieces" })
→ read the returned playbook steps
Step 2: call: get_skill({ "name": "refactoring", "mode": "full" })
→ apply the extracted pattern to the actual code
```

### Situation: "My test is flaky. How to fix?"
```
Step 1: call: recommend_skills({ "task": "flaky test race condition debug" })
→ gets: blast-radius, principle-fix-root-causes, how
Step 2: call: get_skill({ "name": "principle-fix-root-causes", "mode": "full" })
→ trace the real root cause before patching
```

### Situation: "I'm writing a feature spec. Need structure."
```
Step 1: call: playbook-route({ "task": "implement user onboarding flow" })
→ returns: feature playbook, recommended skills (how, arena, statechart)
Step 2: call: get_skill({ "name": "how", "mode": "full" })
→ use the explanation prompt to document the flow before coding
```

### Situation: "I need a principled design choice"
```
Step 1: call: principles-index({ "category": "architecture" })
→ pick: principle-model-the-domain or principle-boundary-discipline
Step 2: call: get_skill({ "name": "principle-model-the-domain", "mode": "full" })
→ apply the domain-modeling pattern to your design
```

### Situation: "I need to explain my reasoning to a reviewer"
```
Step 1: call: skill-prompt({ "skill_name": "how", "task_context": "justify choosing Redux over Context for this app state" })
→ use the returned prompt to generate the explanation
```

## Quick decision guide

| Need | Use this tool |
|------|--------------|
| "What skills help me with X?" | `recommend_skills({ task: "X" })` |
| "What playbook for X?" | `playbook-route({ task: "X" })` |
| "Show me all principles" | `get_principles()` |
| "Load a skill full" | `get_skill({ name, mode: "full" })` |
| "I need a prompt to explain X" | `skill-prompt({ skill_name: "how", ... })` |
| "What automations exist?" | `automate-workflow({ mode: "list" })` |
| "Show me the skill graph" | `skill-graph()` |

## When pstack-mcp won't help

- If the answer is "yes/no" or a number — just answer it directly.
- If the task is trivial (rename a variable, fix a typo) — don't call pstack-mcp for that.
- If you already have the skill content cached from a previous call — reuse it.

## Summary

pstack-mcp = **skills on demand**. You never need to memorize pstack skills. Just call the tool, read the answer, and continue your work.
