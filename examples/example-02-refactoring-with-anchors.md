# Example 2: Refactoring a Large Component with Behavioral Anchors

## Problem

A developer needs to consolidate duplicated article reading-time calculations into one module. The concern is that "cleaning up" code might accidentally change behavior. The team needs a way to prove the refactor is safe.

## How pstack-mcp solves this

This maps to the **Refactoring** playbook. The key insight from real pstack usage is anchoring a refactor to comparable external results — fixtures that prove the old and new code produce identical outputs.

## pstack-mcp Tool Calls

**Step 1: Route to the Refactoring playbook**

```json
{
  "tool": "playbook-route",
  "parameters": {
    "task": "Consolidate duplicated article reading-time calculations into one module. This is a refactor only: keep the algorithm and display format. Record current outputs for Traditional Chinese and English fixtures first.",
    "limit": 1
  }
}
```

**Step 2: Load the full Refactoring playbook**

```json
{
  "tool": "get_playbook",
  "parameters": {
    "name": "refactoring",
    "mode": "full"
  }
}
```

**Step 3: Get the principle about minimal changes**

```json
{
  "tool": "get_principles",
  "parameters": {
    "names": ["laziness-protocol", "subtract-before-you-add"],
    "mode": "full"
  }
}
```

**Step 4: Use the Arena skill for design alternatives**

```json
{
  "tool": "skill-prompt",
  "parameters": {
    "skill_name": "arena",
    "task_context": "compare two approaches: (1) extract to a shared utility function, (2) create a reading-time service class"
  }
}
```

**Step 5: Get blast-radius analysis before the change**

```json
{
  "tool": "recommend_skills",
  "parameters": {
    "task": "analyze which callers depend on the reading-time calculation before refactoring",
    "limit": 2
  }
}
```

## Expected Outcome

pstack-mcp returns the Refactoring playbook with explicit steps for:
1. Recording current fixture outputs (Chinese, English, empty content)
2. Running the refactor
3. Re-running all fixtures and comparing outputs
4. Reporting any uncovered cases

The model knows the acceptance criterion is "identical fixture results" rather than vague "it works the same."
