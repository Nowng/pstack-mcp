# pstack-mcp

MCP server that exposes the [pstack](https://github.com/cursor/plugins/tree/main/pstack) Agent Skills collection to any LLM-powered environment — LM Studio, and other MCP hosts.

## Why pstack-mcp?

We first want to extend our sincere gratitude to [poteto](https://github.com/poteto) and the pstack community for sharing such a rich collection of agent skills with the world. The `pstack` skills are extraordinary — they give agents a shared language for collaboration, a deep toolbox of engineering principles, and battle-tested playbooks.

However, pstack has lived primarily as a Cursor plugin. That is wonderful, and deeply appreciated. But it also means that the same skills have been out of reach for the many other LLM environments where agents still need guidance: LM Studio's local model runtime, standalone MCP servers, and any environment where a model needs to reach out and fetch the right skill at just the right moment.

**pstack-mcp was born from one simple idea:** what if the same pstack skills could be available to every LLM, in every environment, on demand?

pstack-mcp makes that a reality. It packages the full pstack skill collection behind a clean MCP tool interface. When a small or large model is working through a task and hits a gap — *"how do I structure this refactoring?"*, *"what principle should guide this design?"*, *"how do I reproduce a flaky test?"* — it can simply call the right pstack-mcp tool, get the full skill content, and return to the task with the guidance it needed. No plugin install. No context limits. Just ask, receive, continue.

## What pstack-mcp provides

pstack-mcp exposes **13 MCP tools** that give any LLM on-demand access to:

| Tool | Purpose |
|------|---------|
| `list_skills` | Browse all 24+ pstack skills by category |
| `search_skills` | Keyword search across skills |
| `get_skill` | Load a skill (summary or full content) |
| `recommend_skills` | Get task-specific skill recommendations |
| `get_principles` | Load any of the 24 engineering principles |
| `get_playbook` | Load a poteto-mode playbook (bug-fix, feature, etc.) |
| `playbook-route` | Route a task → best playbook + skills (like `/poteto-mode`) |
| `skill-graph` | Explore the pstack skill dependency graph |
| `search_skills_embedded` | TF-IDF search (handles phrases and synonyms) |
| `skill-prompt` | Get a ready-to-use prompt template for any skill |
| `principles-index` | Browse all 24 principles organized by hierarchy |
| `model-setup` | Read `pstack-models.mdc` model configuration |
| `automate-workflow` | List or read benny automation pack contents |

## Usage examples

**Example 1 — A model hits a design decision and needs guidance:**

```json
// Ask: "I'm refactoring a React component and need a systematic approach."
// Tool call:
{
  "tool": "playbook-route",
  "parameters": {
    "task": "refactor a large React component into smaller hooks and components",
    "limit": 3
  }
}
```

pstack-mcp responds with the matching playbook, recommended skills, and a ready-to-type prompt — the model can now execute the refactoring with confidence.

**Example 2 — A model needs to verify a test before merging:**

```json
// Ask: "I have a failing test for a Counter state machine. Help me write a proper test."
// Tool call:
{
  "tool": "recommend_skills",
  "parameters": {
    "task": "write a test for a React state machine using statechart",
    "limit": 3
  }
}
```

pstack-mcp recommends `statechart`, `tdd`, and `blast-radius` — the model now has the exact skills it needs.

**Example 3 — A model hits an error and needs a debugging principle:**

```json
// Ask: "My app has a race condition I can't reproduce. What principle should I apply?"
// Tool call:
{
  "tool": "get_principles",
  "parameters": {
    "names": ["fix-root-causes", "sequence-verifiable-units"],
    "mode": "full"
  }
}
```

The model receives the full principle text and can apply the systematic debugging approach immediately.

## Using pstack-mcp in your prompt

Before running pstack-mcp tools, you may want to give the LLM context about what pstack-mcp can do. There are two recommended approaches:

**Approach A — Include the skill document directly in your prompt:**

Copy the contents of `skills/pstack-mcp.md` into your system prompt or user message before describing the task. This tells the model exactly what tools are available and how to use them:

```
Here is the pstack-mcp skill file. Keep it in context and use these tools whenever you need a skill, principle, or playbook to guide your work.
```

Then follow with your actual task description. The model will know to reach out for `recommend_skills`, `playbook-route`, `get_principles`, etc. when it hits a gap.

**Approach B — Use a RAG tool to load the file:**

If you are using an RAG (Retrieval-Augmented Generation) tool like `read_document`, `fetch_web_content`, or a vector-store retrieval tool, you can load `skills/pstack-mcp.md` on demand instead of keeping the full text in context. The RAG tool fetches the skill document, the model reads it, then the model calls pstack-mcp tools as needed.

Either way, the workflow is the same:
1. Load `skills/pstack-mcp.md` (or reference it).
2. Describe your task.
3. Let the model decide which tool to call based on what it needs.
4. The model continues the task with the returned skill content.

## Installation

### Option A — LM Studio Plugin

1. Clone this repository:

```bash
git clone https://github.com/Nowng/pstack-mcp.git
cd pstack-mcp
npm install
npm run build
```

2. Copy the plugin to your LM Studio plugins directory:

```bash
cp -r .lmstudio ~/.lmstudio/extensions/plugins/pstack
```

3. Enable it in LM Studio settings. The plugin will automatically discover the `pstack/` skills directory at build time.

### Option B — Standalone MCP server

1. Clone this repository and install dependencies:

```bash
git clone https://github.com/Nowng/pstack-mcp.git
cd pstack-mcp
npm install
npm run build
```

2. Add to your `mcp.json`:

```json
{
  "mcpServers": {
    "pstack": {
      "command": "node",
      "args": ["/absolute/path/to/pstack-mcp/dist/server.js"],
      "env": {
        "PSTACK_ROOT": "/absolute/path/to/pstack-mcp/pstack"
      }
    }
  }
}
```

### Troubleshooting

- **"PSTACK_ROOT/pstack/automations/benny not found"**: Ensure the `pstack/` directory (the skill clone) exists inside your pstack-mcp project root. The directory `pstack/automations/benny/skills/` must contain subdirectories like `reproduce-and-fix-issues/`, `triage-issue-reports/`, `setup-benny/` with their respective `SKILL.md` files.
- **"pstack-models.mdc not found"**: The `model-setup` tool looks for `~/.cursor/rules/pstack-models.mdc` or `$PSTACK_ROOT/pstack-models.mdc`. If you haven't created this file yet, the tool will return a helpful message listing where to place it.
- **LM Studio plugin not appearing**: Restart LM Studio after copying the `.lmstudio/plugins/pstack` directory. Check `~/.lmstudio/plugins/pstack/manifest.json` for valid JSON.
- **MCP server won't start**: Run `node dist/server.js` directly and check stderr for import errors. Ensure Node.js ≥ 18 and all dependencies are installed.

## License

This server skeleton is licensed under MIT. The pstack skill content — all `SKILL.md` files, playbooks, principles, and automation templates — is the work of its upstream authors under the [pstack project license](https://github.com/cursor/plugins/tree/main/pstack). Please respect upstream licensing when distributing or modifying pstack content.

## Architecture

```text
pstack/                    ← skill content (cloned from upstream)
  ├── automations/benny/
  │   └── skills/<name>/SKILL.md
  └── skills/<name>/SKILL.md

src/
  ├── tool-definitions.ts  ← single source of truth for all 13 tools
  ├── phase4-tools.ts      ← model-setup + automate-workflow implementations
  ├── server.ts            ← MCP server (stdio transport)
  ├── index.ts             ← LM Studio plugin entry point
  └── ...
```

The tool definitions are generated from `src/tool-definitions.ts` — both the MCP server and LM Studio plugin share the same source of truth.
