/**
 * Shared server-side helpers for providers under `src/lib/providers/`.
 *
 * These two patterns showed up independently, with near-identical logic,
 * in multiple provider files:
 *   - "submit a job, then poll a status endpoint until done/failed/timeout"
 *     (suno.ts, creatify.ts)
 *   - "make a temp dir, do work in it, always clean it up" (ffmpeg.ts ×4,
 *     keepsake.ts, runcomfy.ts)
 *
 * Pulling both out here means each provider only has to express what's
 * actually specific to it (its endpoint, its status field names, its
 * filenames) — not the surrounding control flow.
 */

import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export type PollOutcome<T> =
  | { status: "done"; value: T }
  | { status: "pending" }
  | { status: "failed"; reason: string };

export interface PollOptions {
  /** how often to call `check()` */
  intervalMs?: number;
  /** give up and throw after this long */
  timeoutMs?: number;
  /** used only in error messages, e.g. "Suno", "Creatify Aurora" */
  label: string;
}

/**
 * Generic "submit once, poll until done" loop. The caller supplies only
 * `check()` — how to ask its API for status and how to read the response —
 * everything else (interval, timeout, the wait loop, error shaping) lives
 * here once instead of being re-implemented per provider.
 */
export async function pollUntil<T>(
  check: () => Promise<PollOutcome<T>>,
  { intervalMs = 5000, timeoutMs = 300_000, label }: PollOptions
): Promise<T> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await sleep(intervalMs);
    const outcome = await check();
    if (outcome.status === "done") return outcome.value;
    if (outcome.status === "failed") {
      throw new Error(`${label} شکست خورد: ${outcome.reason}`);
    }
    // "pending" → keep polling
  }
  throw new Error(`${label}: تایم‌اوت در انتظار نتیجه`);
}

/**
 * Create a unique temp directory, run `fn` with its path, and guarantee
 * cleanup afterward (success or failure) — the same try/finally every
 * provider that shells out to ffmpeg/xelatex/a CLI needs, written once.
 */
export async function withTempDir<T>(
  prefix: string,
  fn: (dir: string) => Promise<T>
): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
