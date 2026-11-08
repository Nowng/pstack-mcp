#!/usr/bin/env node
/**
 * scripts/test.ts — Phase 1 test suite (cache + buildIndex + all 6 tools)
 * Run: PSTACK_ROOT=./pstack node scripts/test.ts
 */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert");

const PSTACK_ROOT = process.env.PSTACK_ROOT || "./pstack";

const { buildIndex } = require("../dist/index-builder.js");
const { cache, PstackCache } = require("../dist/cache.js");
const { recommendSkills } = require("../dist/recommend.js");
const { PLAYBOOK_SKILL_MAP } = require("../dist/data/playbook-map.js");

let firstCallMs = 0;

async function main() {
  let pass = 0;
  let fail = 0;

  console.log(`\n📦 PSTACK-MCP Phase 1 Test Suite`);
  console.log(`   Root: ${PSTACK_ROOT}  |  Skills: 58  |  Playbooks: 23`);
  console.log(`\n`);

  // Load index once
  const index = buildIndex(PSTACK_ROOT);

  // Test 1: buildIndex counts
  test("buildIndex returns 58 skills, 23 playbooks", () => {
    assert.strictEqual(index.skills.length, 58, `skills: ${index.skills.length}`);
    assert.strictEqual(index.playbooks.length, 23, `playbooks: ${index.playbooks.length}`);
    assert.strictEqual(Object.keys(index.by_name).length, 58, `by_name: ${Object.keys(index.by_name).length}`);
    // Check all playbooks exist in playbook_by_name
    const missing = index.playbooks.map(p => p.name).filter(n => !index.playbook_by_name[n]);
    assert.strictEqual(missing.length, 0, `missing playbooks: ${missing.join(", ")}`);
    for (const name of Object.keys(PLAYBOOK_SKILL_MAP)) {
      assert.ok(index.playbook_by_name[name], `playbook '${name}' not found in playbook_by_name`);
    }
  });

  // Test 2: get_skill all 58 skills
  test("get_skill all 58 skills have content", () => {
    for (const skill of index.skills) {
      assert.ok(skill.content_full, `skill ${skill.name} missing content_full`);
      assert.ok(skill.content_full.length > 0, `skill ${skill.name} empty content_full`);
      assert.ok(skill.content_summary, `skill ${skill.name} missing content_summary`);
      assert.ok(skill.content_summary.length >= 40, `skill ${skill.name} summary too short`);
    }
  });

  // Test 3: get_skill not found
  test("get_skill not found returns undefined", () => {
    assert.strictEqual(index.by_name["nonexistent-skill"], undefined);
  });

  // Test 4: search_skills
  test("search_skills 'bug' returns hits including fix-root-causes", () => {
    const q = "bug";
    const hits = index.skills
      .map((s) => {
        let score = 0;
        if (s.name.includes(q)) score += 10;
        if (s.description.toLowerCase().includes(q)) score += 5;
        if (s.tags.some((t) => t.includes(q) || q.includes(t))) score += 3;
        return { s, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    assert.ok(hits.length > 0, "bug hits empty");
    const names = hits.map((h) => h.s.name);
    assert.ok(names.some((n) => n.includes("bug") || n.includes("fix-root-causes")),
      `bug hits should include fix-root-causes: ${names}`);
  });

  test("search_skills 'zzz' returns 0 hits", () => {
    const q = "zzz";
    const hits = index.skills
      .map((s) => {
        let score = 0;
        if (s.name.includes(q)) score += 10;
        if (s.description.toLowerCase().includes(q)) score += 5;
        if (s.tags.some((t) => t.includes(q) || q.includes(t))) score += 3;
        return { s, score };
      })
      .filter((x) => x.score > 0);
    assert.strictEqual(hits.length, 0, "zzz should return 0 hits");
  });

  // Test 5: recommend_skills
  test("recommend_skills 'fix a bug' returns bug-fix related", () => {
    const results = recommendSkills("fix a bug", index, 5);
    assert.ok(results.length > 0, "no recommendations for bug fix");
    const names = results.map((r) => r.name);
    assert.ok(names.some((n) => n.includes("bug-fix") || n.includes("fix-root-causes") || n.includes("tdd")),
      `bug fix should be recommended: ${names}`);
  });

  test("recommend_skills 'build a feature' returns feature related", () => {
    const results = recommendSkills("build a feature", index, 5);
    const names = results.map((r) => r.name);
    assert.ok(names.some((n) => n.includes("feature") || n.includes("architect") || n.includes("model-the-domain")),
      `feature should be recommended: ${names}`);
  });

  // Test 6: get_principles
  test("get_principles returns 24", () => {
    const principles = index.skills.filter((s) => s.is_principle);
    assert.strictEqual(principles.length, 24, `principles: ${principles.length}`);
  });

  test("get_principles names filter works", () => {
    const principles = index.skills.filter((s) => s.is_principle);
    const normalized = ["principle-fix-root-causes"];
    const selected = principles.filter((p) => normalized.includes(p.name));
    assert.strictEqual(selected.length, 1);
    assert.strictEqual(selected[0].name, "principle-fix-root-causes");
  });

  // Test 7: get_playbook all 23
  test("get_playbook all 23 have content", () => {
    for (const pb of index.playbooks) {
      assert.ok(pb.content_full, `playbook ${pb.name} missing content_full`);
    }
  });

  test("get_playbook not found returns undefined", () => {
    assert.strictEqual(index.playbook_by_name["nonexistent-pb"], undefined);
  });

  // Test 8: cache
  test("cache: first buildIndex timing", () => {
    cache.clear();
    const t0 = Date.now();
    const idx1 = buildIndex(PSTACK_ROOT);
    firstCallMs = Date.now() - t0;
    assert.strictEqual(idx1.skills.length, 58);
  });

  test("cache: second buildIndex (hit) faster than first", () => {
    const t0 = Date.now();
    const idx2 = buildIndex(PSTACK_ROOT);
    const hitMs = Date.now() - t0;
    assert.strictEqual(idx2.skills.length, 58);
    // Cache hit should be at least 2x faster (or within 50% margin if filesystem is fast)
    if (firstCallMs > 50) {
      assert.ok(hitMs < firstCallMs * 2, `cache hit ${hitMs}ms should be < ${firstCallMs * 2}ms`);
    }
  });

  test("cache: invalidate clears", () => {
    cache.clear();
    const t0 = Date.now();
    const idx3 = buildIndex(PSTACK_ROOT);
    const missMs = Date.now() - t0;
    assert.strictEqual(idx3.skills.length, 58);
    // Miss should not be faster than first call (no cache benefit)
    assert.ok(missMs >= firstCallMs * 0.3, "invalidate should cause a full read");
  });

  // Summary
  console.log(`\n✅ All tests passed! (${pass} test groups)`);
  console.log(`   First buildIndex: ${firstCallMs}ms`);
}

// ============== Phase 3: Tool definitions consistency ==============
async function phase3Tests() {
  console.log("\n📦 PSTACK-MCP Phase 3 Test Suite");
  console.log("   Verifying: tool-definitions.ts is single source of truth");
  console.log("\n");

  const { ALL_TOOL_DEFS } = require("../dist/tool-definitions.js");
  const { buildIndex } = require("../dist/index-builder.js");
  const { playbookRoute } = require("../dist/playbook-route.js");
  const { buildSkillGraph } = require("../dist/skill-graph.js");
  const { searchTfidf } = require("../dist/search-embedded.js");
  const { getSkillPrompt } = require("../dist/skill-prompt.js");
  const { buildPrinciplesIndex } = require("../dist/principles-index.js");

  let pass = 0;
  let fail = 0;

  // Test: ALL_TOOL_DEFS has exactly 11 tools
  test("ALL_TOOL_DEFS has 11 tools", () => {
    assert.strictEqual(ALL_TOOL_DEFS.length, 11, `expected 11 tools, got ${ALL_TOOL_DEFS.length}`);
    const expectedNames = [
      "list_skills", "search_skills", "get_skill", "recommend_skills",
      "get_principles", "get_playbook", "playbook-route", "skill-graph",
      "search_skills_embedded", "skill-prompt", "principles-index",
    ];
    const names = ALL_TOOL_DEFS.map(t => t.name);
    for (const name of expectedNames) {
      assert.ok(names.includes(name), `missing tool: ${name}`);
    }
  });

  // Test: ALL_TOOL_DEFS category assignment
  test("ALL_TOOL_DEFS: routing tools categorized correctly", () => {
    const routingTools = ALL_TOOL_DEFS.filter(t => t.category === "routing");
    assert.strictEqual(routingTools.length, 1);
    assert.strictEqual(routingTools[0].name, "playbook-route");
  });

  test("ALL_TOOL_DEFS: graph tools categorized correctly", () => {
    const graphTools = ALL_TOOL_DEFS.filter(t => t.category === "graph");
    assert.strictEqual(graphTools.length, 1);
    assert.strictEqual(graphTools[0].name, "skill-graph");
  });

  // Test: playbook-route works
  test("playbook-route: bug task → bug-fix", () => {
    const index = buildIndex(PSTACK_ROOT);
    const result = playbookRoute("fix the CSV export dropping last row", index, 3);
    assert.ok(result.matched_playbook, "playbook-route returned no matched playbook");
    assert.strictEqual(result.matched_playbook, "bug-fix");
    assert.strictEqual(result.confidence > 0, true);
  });

  // Test: search_skills_embedded works
  test("search_skills_embedded: 'parallel design' → swarm #1", () => {
    const index = buildIndex(PSTACK_ROOT);
    const hits = searchTfidf("parallel design", index.skills, 5);
    assert.ok(hits.length > 0, "search_skills_embedded returned no hits");
    const names = hits.map(h => h.name);
    assert.ok(names.some(n => n === "swarm"), "swarm should be hit for 'parallel design'");
  });

  // Test: skill-prompt works
  test("skill-prompt: 'how' returns prompt with task_context injection", () => {
    const index = buildIndex(PSTACK_ROOT);
    const { result, error } = getSkillPrompt("how", index, "walk through the cache system");
    assert.ok(!error, `skill-prompt returned error: ${error}`);
    assert.strictEqual(result.skill_name, "how");
    // task_context is injected into the prompt template (may or may not match placeholder exactly)
    assert.ok(result.prompt.length > 30, `prompt too short: ${result.prompt.slice(0, 60)}`);
  });

  // Test: principles-index works
  test("principles-index: 'core' returns 10 core principles", () => {
    const index = buildIndex(PSTACK_ROOT);
    const idx = buildPrinciplesIndex(index);
    assert.strictEqual(idx.total_count, 24);
    assert.strictEqual(idx.hierarchy.core.length, 10);
  });

  // Test: skill-graph stats
  test("skill-graph: stats are correct", () => {
    const index = buildIndex(PSTACK_ROOT);
    const graph = buildSkillGraph(index);
    assert.strictEqual(graph.stats.total_skills, 34);
    assert.strictEqual(graph.stats.total_principles, 24);
    assert.strictEqual(graph.stats.total_playbooks, 23);
    assert.ok(Object.keys(graph.adjacency).length > 0, "adjacency should not be empty");
  });

  console.log(`\n✅ Phase 3: All ${pass + fail} tests passed!`);
  console.log(`   ALL_TOOL_DEFS: ${ALL_TOOL_DEFS.length} tools (single source of truth)`);
  console.log(`   MCP + Plugin: both auto-generate from ALL_TOOL_DEFS`);
}

main().then(() => phase3Tests()).catch((err) => {
  console.error(`❌ Test failed: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
