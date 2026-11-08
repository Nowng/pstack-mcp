#!/usr/bin/env tsx
/**
 * scripts/setup.ts — LM Studio Plugin Hub installer
 *
 * When pstack-mcp is installed from the LM Studio Plugin Hub,
 * this script is automatically invoked. It fetches ONLY the
 * pstack subdirectory (Agent Skills content) from
 * https://github.com/cursor/plugins/tree/main/pstack
 * into this plugin's ./pstack/ directory.
 *
 * Usage:
 *   npx tsx scripts/setup.ts          # normal install (idempotent)
 *   npx tsx scripts/setup.ts --force   # re-download everything
 *   npx tsx scripts/setup.ts --skip    # only download files that don't exist
 *   npx tsx scripts/setup.ts --dry     # list what would be downloaded
 *
 * Idempotent: re-running skips already-downloaded files (unless --force).
 * Concurrent: downloads files in parallel batches (20 at a time).
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

const REPO_OWNER = "cursor";
const REPO_NAME = "plugins";
const BRANCH = "main";
const TARGET_PATH = "pstack";
const OUTPUT_DIR = join(process.cwd(), TARGET_PATH);
const CONCURRENCY = 20; // max parallel downloads

interface Args {
  force: boolean;
  skip: boolean;
  dry: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  return {
    force: args.includes("--force"),
    skip: args.includes("--skip"),
    dry: args.includes("--dry"),
  };
}

async function fetchFile(relPath: string): Promise<Buffer> {
  const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${TARGET_PATH}/${relPath}`;
  const res = await fetch(rawUrl, { signal: AbortSignal.timeout(30_000) });

  if (res.status === 404) return Buffer.alloc(0);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${rawUrl}`);
  return Buffer.from(await res.arrayBuffer());
}

async function downloadWithConcurrency(
  files: { relPath: string; outPath: string }[],
  mode: "force" | "skip"
): Promise<{ ok: number; skipped: number; failed: number }> {
  let ok = 0, skipped = 0, failed = 0;
  let idx = 0;

  async function processBatch(): Promise<void> {
    const batch: Promise<void>[] = [];
    for (let i = 0; i < CONCURRENCY && idx + i < files.length; i++) {
      const { relPath, outPath } = files[idx + i];
      const progress = `[setup] ${idx + i + 1}/${files.length}`;
      const p = (async () => {
        try {
          let buf: Buffer;
          if (mode === "force") {
            buf = await fetchFile(relPath);
            if (buf.length === 0) {
              failed++;
              console.error(`${progress} 404 ${relPath}`);
              return;
            }
            await mkdir(join(outPath, ".."), { recursive: true });
            await writeFile(outPath, buf);
            ok++;
            console.log(`${progress} OK ${relPath} (${buf.length}B)`);
          } else {
            // --skip: only download if file doesn't exist
            let exists = false;
            try {
              const stat = await readFile(outPath);
              exists = stat.length > 0;
            } catch {
              exists = false;
            }
            if (!exists) {
              buf = await fetchFile(relPath);
              if (buf.length === 0) {
                failed++;
                console.error(`${progress} 404 ${relPath}`);
                return;
              }
              await mkdir(join(outPath, ".."), { recursive: true });
              await writeFile(outPath, buf);
              ok++;
              console.log(`${progress} OK ${relPath} (${buf.length}B)`);
            } else {
              skipped++;
            }
          }
        } catch (err: unknown) {
          failed++;
          console.error(
            `${progress} FAIL ${relPath}: ${(err as Error).message}`
          );
        }
      })();
      batch.push(p);
    }
    await Promise.all(batch);
    idx += CONCURRENCY;
    if (idx < files.length) return processBatch();
  }

  await processBatch();
  return { ok, skipped, failed };
}

async function main() {
  const { force, skip, dry } = parseArgs();

  console.log(
    `[setup] Fetching "${TARGET_PATH}/" from ${REPO_OWNER}/${REPO_NAME} (branch: ${BRANCH})`
  );

  // 1. Get recursive tree
  const treeUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=true`;
  const treeRes = await fetch(treeUrl);
  if (!treeRes.ok) throw new Error(`Tree API: ${treeRes.status} ${treeRes.statusText}`);
  const treeData = await treeRes.json();
  const allPaths = (treeData.tree as { path: string }[]).map((t) => t.path);

  // 2. Filter to target subdirectory
  const filtered = allPaths.filter(
    (p) => p === TARGET_PATH || p.startsWith(TARGET_PATH + "/")
  );

  console.log(`[setup] Found ${filtered.length} entries under "${TARGET_PATH}/"`);

  if (dry) {
    filtered.forEach((p) => console.log(`  ${p}`));
    return;
  }

  // 3. Ensure output dir
  await mkdir(OUTPUT_DIR, { recursive: true });

  // 4. Prepare file entries (directories skipped)
  const files = filtered
    .filter((fullPath) => {
      const relPath = fullPath.slice(TARGET_PATH.length + 1);
      return relPath && relPath.includes(".");
    })
    .map((fullPath) => ({
      relPath: fullPath.slice(TARGET_PATH.length + 1),
      outPath: join(OUTPUT_DIR, fullPath.slice(TARGET_PATH.length + 1)),
    }));

  const mode = force ? "force" : "skip";
  const result = await downloadWithConcurrency(files, mode);

  console.log(
    `\n[setup] Done: ${result.ok} downloaded, ${result.skipped} skipped, ${result.failed} failed / ${filtered.length} total`
  );
}

main().catch((err) => {
  console.error("[setup] FATAL:", err.message);
  process.exit(1);
});
