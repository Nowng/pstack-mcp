# Example 7: Long-Running Unattended Work with Show-Me-Your-Work

## Problem

A developer is starting a large multi-phase project: building a new feature with a design, implementation, and testing phase. They want to step away for a few hours and come back to review what was done, ensuring no hallucinations or incorrect decisions were made during the unattended run.

## How pstack-mcp solves this

This maps to the **Show-Me-Your-Work** skill and the **Autonomous Run** playbook. The real pstack pattern from the Rob Shocks video: use show-me-your-work to keep a TSV decision log with one row per decision (what, why, evidence, result). When an agent hallucinated details, the trail made the catch visible and reviewable.

## pstack-mcp Tool Calls

**Step 1: Route to the Autonomous Run playbook**

```json
{
  "tool": "playbook-route",
  "parameters": {
    "task": "Build a new user onboarding feature across three phases: (1) design the state machine, (2) implement the flow, (3) write verification. Run unattended. Keep a decision log. Stop at each phase checkpoint for my review.",
    "limit": 1
  }
}
```

**Step 2: Get the Show-Me-Your-Work skill**

```json
{
  "tool": "get_skill",
  "parameters": {
    "name": "show-me-your-work",
    "mode": "full"
  }
}
```

**Step 3: Get the principle about not blocking on the human**

```json
{
  "tool": "get_principles",
  "parameters": {
    "names": ["never-block-on-the-human", "guard-the-context-window"],
    "mode": "full"
  }
}
```

**Step 4: Use the pause-safely playbook for checkpoints**

```json
{
  "tool": "get_playbook",
  "parameters": {
    "name": "pause-safely",
    "mode": "full"
  }
}
```

## Expected Outcome

pstack-mcp returns:
- The Autonomous Run playbook with explicit checkpoint instructions
- The Show-Me-Your-Work skill's TSV log format
- The never-block principle ensuring the agent doesn't wait for human input between phases

The agent creates a decision trail log like:

```
| Step | Decision | Why | Evidence | Result |
|------|----------|-----|----------|--------|
| 1 | Use statechart for onboarding | Complex multi-step flow | pstack statechart skill | State machine designed |
| 2 | ... | ... | ... | ... |
```

When the developer returns, they review the TSV log first, catch any hallucinated decisions, and continue from the correct checkpoint — rather than blindly trusting the output.
