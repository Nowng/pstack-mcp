# Example 3: Investigating a Flaky Test Before Making Changes

## Problem

A test fails intermittently on CI but passes locally. The developer needs to understand the root cause without modifying any production code first. They need a read-only investigation.

## How pstack-mcp solves this

This maps to the **Investigation** playbook. The key pattern from pstack usage is: state the goal, explicitly request no code changes, and ask for a reproducible trace with source locations.

## pstack-mcp Tool Calls

**Step 1: Route to the Investigation playbook**

```json
{
  "tool": "playbook-route",
  "parameters": {
    "task": "Investigate why a Counter state machine test fails intermittently on CI but passes locally. Do not modify any files. Trace the state transitions with source locations and reproduction steps.",
    "limit": 1
  }
}
```

**Step 2: Load the Investigation playbook**

```json
{
  "tool": "get_playbook",
  "parameters": {
    "name": "investigation",
    "mode": "full"
  }
}
```

**Step 3: Use the Why skill for root-cause analysis**

```json
{
  "tool": "get_skill",
  "parameters": {
    "name": "why",
    "mode": "full"
  }
}
```

**Step 4: Get the principle about verifiable units**

```json
{
  "tool": "get_principles",
  "parameters": {
    "names": ["sequence-verifiable-units", "exhaust-the-design-space"],
    "mode": "full"
  }
}
```

**Step 5: Use the Interrogate skill for failure demonstration**

```json
{
  "tool": "skill-prompt",
  "parameters": {
    "skill_name": "interrogate",
    "task_context": "hand a failing test diff to several models and ask each to demonstrate the failure with executable reproduction steps"
  }
}
```

## Expected Outcome

pstack-mcp returns:
- The Investigation playbook steps (trace flow → separate confirmed behavior from hypotheses → list unknowns)
- The Why skill's methodology for discovering evidence across source control, issue trackers, and chat logs
- A structured prompt for the Interrogate skill that asks multiple models to independently demonstrate the failure

The model produces a findings report rather than a patch, including what could not be confirmed given the environment constraints.
