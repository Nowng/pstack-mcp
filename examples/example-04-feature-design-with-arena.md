# Example 4: Designing a New Feature with Arena

## Problem

A team needs to design a replaceable index-reading interface for article search. The interface must support today's static JSON config and a future remote source. The team wants to compare multiple approaches before committing to one.

## How pstack-mcp solves this

This maps to the **Feature** playbook combined with the **Arena** skill. The real pstack pattern is: describe the requirement, let pstack route it to Feature, then explicitly ask for an arena comparison of structurally different approaches.

## pstack-mcp Tool Calls

**Step 1: Route to the Feature playbook**

```json
{
  "tool": "playbook-route",
  "parameters": {
    "task": "Design a replaceable index-reading interface for article search. It must support today's static JSON config and a future remote source. Compare at least two structurally different approaches.",
    "limit": 1
  }
}
```

**Step 2: Load the Feature playbook**

```json
{
  "tool": "get_playbook",
  "parameters": {
    "name": "feature",
    "mode": "full"
  }
}
```

**Step 3: Get the Arena skill prompt for comparison**

```json
{
  "tool": "skill-prompt",
  "parameters": {
    "skill_name": "arena",
    "task_context": "pit three approaches: (1) strategy pattern with registry, (2) plugin interface with dynamic loading, (3) configuration-driven adapter. Evaluate each on extensibility, complexity, and performance."
  }
}
```

**Step 4: Get the principle about exhaustive design space**

```json
{
  "tool": "get_principles",
  "parameters": {
    "names": ["exhaust-the-design-space", "model-the-domain"],
    "mode": "full"
  }
}
```

**Step 5: Use the skill-graph to check dependencies**

```json
{
  "tool": "skill-graph",
  "parameters": {
    "skill_name": "architect"
  }
}
```

## Expected Outcome

pstack-mcp returns:
- The Feature playbook steps (grounding → comparison → synthesis → implementation)
- The Arena skill's structured format for comparing multiple approaches
- The design-space-exhaustion principle reminding the model to not pick the first approach seen

The model produces a design comparison table with trade-offs, then selects the best approach and writes the interface spec before any code.
