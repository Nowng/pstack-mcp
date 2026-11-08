# Example 5: Writing a Test Before Implementation (TDD)

## Problem

A developer needs to write a failing test for a React Counter state machine before writing the implementation. The test should cover edge cases: CounterJump, CounterLoop, CounterDeadlock, and CounterTie.

## How pstack-mcp solves this

This maps to the **TDD** skill combined with the **Bug Fix** playbook (for the "reproduce first" pattern). The real pstack pattern is: write the failing test first, make it pass, then implement.

## pstack-mcp Tool Calls

**Step 1: Get the TDD skill**

```json
{
  "tool": "get_skill",
  "parameters": {
    "name": "tdd",
    "mode": "full"
  }
}
```

**Step 2: Get the Statechart skill for state machine testing**

```json
{
  "tool": "get_skill",
  "parameters": {
    "name": "statechart",
    "mode": "full"
  }
}
```

**Step 3: Route to a playbook that includes TDD**

```json
{
  "tool": "playbook-route",
  "parameters": {
    "task": "Write a test-first implementation of a React Counter state machine. The counter must support: increment, decrement, reset, jump to value, loop detection, deadlock detection, and tie-breaking.",
    "limit": 1
  }
}
```

**Step 4: Get the principle about test behavior**

```json
{
  "tool": "get_principles",
  "parameters": {
    "names": ["test-behavior-not-implementation", "prove-it-works"],
    "mode": "full"
  }
}
```

**Step 5: Use recommend_skills for test-related skills**

```json
{
  "tool": "recommend_skills",
  "parameters": {
    "task": "write a comprehensive test suite for a finite state machine with edge cases",
    "limit": 3
  }
}
```

## Expected Outcome

pstack-mcp returns:
- The TDD skill's step-by-step methodology (red → green → refactor)
- The Statechart skill's test patterns (cover each named state transition)
- A ready-to-use prompt for generating the Counter test fixture

The model writes the failing test first (red), then implements the minimum code to pass (green), then refactors — all guided by the skill's explicit instructions.
