/**
 * Worker-safe variants of the original Node helpers. We only need
 * `sleep` and `pollUntil`; the `withTempDir` helper from the Next.js
 * version is irrelevant in a Worker runtime and has been dropped.
 */

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export type PollOutcome<T> =
  | { status: "done"; value: T }
  | { status: "pending" }
  | { status: "failed"; reason: string };

export interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
  label: string;
}

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
  }
  throw new Error(`${label}: تایم‌اوت در انتظار نتیجه`);
}
