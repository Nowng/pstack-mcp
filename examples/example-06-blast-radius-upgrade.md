# Example 6: Resolving a Dependency Conflict with Blast Radius

## Problem

A developer wants to upgrade a package (e.g., React from 18 to 19) but needs to understand what else might break. The team has a large codebase with many consumers of the updated package.

## How pstack-mcp solves this

This maps to the **Blast Radius** skill and the **Refactoring** playbook. The real pstack pattern is: answer "what else could this small change break?" with a safety fact proven by running code, not by assertion.

## pstack-mcp Tool Calls

**Step 1: Get the Blast Radius skill**

```json
{
  "tool": "get_skill",
  "parameters": {
    "name": "blast-radius",
    "mode": "full"
  }
}
```

**Step 2: Get the relevant principles**

```json
{
  "tool": "get_principles",
  "parameters": {
    "names": ["separate-before-serializing-shared-state", "migrate-callers-then-delete-legacy-apis"],
    "mode": "full"
  }
}
```

**Step 3: Route to a playbook for large changes**

```json
{
  "tool": "playbook-route",
  "parameters": {
    "task": "Upgrade React from 18 to 19 across a large codebase. Analyze the blast radius: which files import React directly, which use React APIs, and which might break. Plan the migration in phases.",
    "limit": 2
  }
}
```

**Step 4: Get the Skill Graph to find related skills**

```json
{
  "tool": "skill-graph",
  "parameters": {
    "skill_name": "blast-radius"
  }
}
```

## Expected Outcome

pstack-mcp returns:
- The Blast Radius skill's methodology: trace dependencies, data formats, and callers; try to execute code to establish the key safety assumption
- The Refactoring playbook with phased migration strategy
- Principles about migrating callers before deleting legacy APIs (safe deletion)

The model produces a phased migration plan with a "blast radius" report showing exactly which files, imports, and patterns need updating — not a guess, but a traced analysis.
