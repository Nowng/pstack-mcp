/**
 * src/cache.ts — TTL cache for pstack file content.
 * Module-level singleton. No external dependencies.
 */
"use strict";

// TTL in milliseconds
const TTL_FILE_FULL = 30 * 60 * 1000;  // 30 min
const TTL_INDEX     = 5  * 60 * 1000;  // 5 min
const TTL_SEARCH    = 5  * 60 * 1000;  // 5 min

interface CacheEntry {
  data: string;
  expires: number;  // timestamp
}

class PstackCache {
  private entries: Map<string, CacheEntry>;

  constructor() {
    this.entries = new Map();
  }

  /** Get a cached entry, returns null if expired or missing. */
  get(key: string): string | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.entries.delete(key);
      return null;
    }
    return entry.data;
  }

  /** Set a cached entry with a given TTL (milliseconds). */
  set(key: string, data: string, ttlMs: number): void {
    this.entries.set(key, {
      data,
      expires: Date.now() + ttlMs,
    });
  }

  /** Invalidate entries whose key matches the glob pattern. */
  invalidate(pattern: string): void {
    const re = globToRegex(pattern);
    for (const key of this.entries.keys()) {
      if (re.test(key)) {
        this.entries.delete(key);
      }
    }
  }

  /** Clear all entries. */
  clear(): void {
    this.entries.clear();
  }

  /** Get current entry count. */
  size(): number {
    return this.entries.size;
  }
}

/** Simple glob-to-regex conversion for cache key matching. */
function globToRegex(pattern: string): RegExp {
  // Escape regex special chars except * and ?
  let s = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  s = s.replace(/\*/g, ".*");
  s = s.replace(/\?/g, "[^/]");
  return new RegExp(`^${s}$`);
}

// Module-level singleton
export const cache = new PstackCache();
export { PstackCache };
export { TTL_FILE_FULL, TTL_INDEX, TTL_SEARCH };
