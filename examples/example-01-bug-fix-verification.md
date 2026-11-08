# Example 1: Fixing a Bug with Verification

## Problem

A user reported a bug: the newsletter subscription form says "Thanks for subscribing" even when the API returns a 500 error. The team needs to reproduce it, fix it, and verify both the error path and success path work correctly.

## How pstack-mcp solves this

This maps to the **Bug Fix** playbook in pstack. Instead of guessing which skills to use, you describe the problem and let pstack-mcp route it to the right workflow.

## pstack-mcp Tool Calls

**Step 1: Route to the correct playbook**

```json
{
  "tool": "playbook-route",
  "parameters": {
    "task": "The newsletter subscription form says 'Thanks for subscribing' even when the API returns a 500 error. Reproduce it first, then fix and verify.",
    "limit": 1
  }
}
```

**Step 2: Load the Bug Fix playbook for step-by-step guidance**

```json
{
  "tool": "get_playbook",
  "parameters": {
    "name": "bug-fix",
    "mode": "full"
  }
}
```

**Step 3: Apply the principle of proving it works**

```json
{
  "tool": "get_principles",
  "parameters": {
    "names": ["prove-it-works", "fix-root-causes"],
    "mode": "full"
  }
}
```

**Step 4: Get a ready-to-use prompt for the investigation**

```json
{
  "tool": "skill-prompt",
  "parameters": {
    "skill_name": "how",
    "task_context": "explain the subscription flow: API call, response handling, and UI feedback"
  }
}
```

## Expected Outcome

pstack-mcp returns:
- The Bug Fix playbook steps (reproduce → find cause → fix → verify)
- The principle text that tells the model to "check the real artifact, not just test results"
- A structured prompt for tracing the subscription flow

The model can then execute the fix with the correct sequence of steps, including verifying the error path produces the correct UI feedback instead of the misleading "Thanks for subscribing" message.
