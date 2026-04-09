import { loadVerseMeta, loadScript, loadTopics } from "./loader.js";
import { getVerseKeysByField } from "./verse-indexes.js";

type WarmLevel = "minimal" | "standard";

function getWarmLevel(): WarmLevel {
  const v = process.env.WARM_CACHE_LEVEL?.toLowerCase();
  if (v === "minimal") return "minimal";
  return "standard";
}

/**
 * Pre-load frequently accessed data on cold start (fire-and-forget).
 * Call with `void warmCache()` at module scope.
 */
export async function warmCache(): Promise<void> {
  const level = getWarmLevel();

  // Always load verse metadata and the default script.
  const tasks: Promise<unknown>[] = [
    loadVerseMeta(),
    loadScript("uthmani"),
  ];

  if (level === "standard") {
    // Trigger structural index build (page lookup forces full index construction).
    tasks.push(getVerseKeysByField("page", 1));
    // Topics are a single file, frequently accessed.
    tasks.push(loadTopics());
  }

  await Promise.all(tasks.map((p) => p.catch(() => {})));
}
