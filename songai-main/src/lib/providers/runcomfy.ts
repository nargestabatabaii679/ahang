/**
 * Avatar / lip-sync video provider — RunComfy CLI.
 *
 * Routing follows the `lipsync` Agent Skill exactly: songai's actual input
 * shape is a single PORTRAIT PHOTO + an audio track, not a pre-existing
 * source video. Per the skill's routing table that is the
 * "Portrait still + audio → talking-head video (avatar-style)" case, whose
 * default model is ByteDance OmniHuman — NOT Kling/Sync Labs lipsync, both
 * of which mouth-swap onto an existing VIDEO and have no use for a still
 * photo. (The previous `kling.ts` adapter called Kling's lipsync endpoint
 * with `image_url`, which the real API does not accept — this was a latent
 * bug that would have failed on first real use.)
 *
 * Setup (one-time):
 *   npm i -g @runcomfy/cli
 *   runcomfy login                       # or: export RUNCOMFY_TOKEN=<token>
 *
 * Then in this project's .env.local:
 *   VIDEO_PROVIDER=omnihuman             # default; "kling" still selectable
 *
 * Security, per the skill's own constraints (kept identical here):
 *   - Only ever invoke `runcomfy run <model> --input <json> --output-dir <dir>`.
 *     No other subcommands, no shell interpolation of prompt/URL content
 *     (passed as a single JSON string argument, never shell-expanded).
 *   - image_url / audio_url must be URLs the user explicitly supplied for
 *     THIS job (their own upload) — never a third-party or scraped URL.
 *   - Outbound network from the CLI itself is restricted to
 *     model-api.runcomfy.net and *.runcomfy.net / *.runcomfy.com.
 */

import { spawn } from "child_process";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { withTempDir } from "../server-utils";

const videoProvider = () => process.env.VIDEO_PROVIDER || "omnihuman"; // "omnihuman" | "kling"

const MODEL_BY_PROVIDER: Record<string, string> = {
  omnihuman: "bytedance/omnihuman/api",
  // kling lipsync needs a source VIDEO, not a photo — only meaningful if
  // a future "source video" upload path is added instead of a still photo.
  kling: "kling/lipsync/audio-to-video",
};

/** Exit codes documented by the skill — surfaced as readable errors. */
const EXIT_CODE_MEANING: Record<number, string> = {
  64: "آرگومان CLI نامعتبر",
  65: "ورودی JSON نامعتبر یا schema نادرست",
  69: "خطای سرور RunComfy (5xx)",
  75: "قابل تلاش‌مجدد: timeout یا 429 — محدودیت نرخ",
  77: "وارد حساب RunComfy نشده‌اید یا توکن رد شد",
};

interface RunComfyResult {
  stdout: string;
  stderr: string;
  code: number;
}

function runCli(args: string[]): Promise<RunComfyResult> {
  return new Promise((resolve, reject) => {
    const p = spawn("runcomfy", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d.toString()));
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("error", (err) =>
      reject(
        new Error(
          `runcomfy CLI پیدا نشد یا اجرا نشد. آیا "npm i -g @runcomfy/cli" نصب شده؟ (${err.message})`
        )
      )
    );
    p.on("close", (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
}

/**
 * Generate an avatar/lip-sync video from a portrait photo + an audio track
 * via the RunComfy CLI, following the lipsync skill's documented invocation
 * exactly: `runcomfy run <model> --input '<json>' --output-dir <dir>`.
 *
 * imageUrl/audioUrl must be publicly reachable URLs the user supplied for
 * this job (the skill's consent + provenance requirement — see SKILL.md
 * "Security & Privacy"). Returns the local path of the downloaded video.
 */
export async function lipSyncVideo(
  imageUrl: string,
  audioUrl: string
): Promise<Buffer> {
  const model = MODEL_BY_PROVIDER[videoProvider()] || MODEL_BY_PROVIDER.omnihuman;
  const input =
    videoProvider() === "kling"
      ? { video_url: imageUrl, audio_url: audioUrl }
      : { image_url: imageUrl, audio_url: audioUrl };

  return withTempDir("songai-runcomfy-", async (outDir) => {
    const { code, stderr } = await runCli([
      "run",
      model,
      "--input",
      JSON.stringify(input),
      "--output-dir",
      outDir,
    ]);

    if (code !== 0) {
      const meaning = EXIT_CODE_MEANING[code] || `کد خروج ناشناخته ${code}`;
      throw new Error(`RunComfy (${model}) شکست خورد — ${meaning}: ${stderr.slice(-400)}`);
    }

    const files = await readdir(outDir);
    const videoFile = files.find((f) => /\.(mp4|mov|webm)$/i.test(f));
    if (!videoFile) {
      throw new Error("RunComfy: هیچ فایل ویدیویی در خروجی پیدا نشد");
    }
    return readFile(path.join(outDir, videoFile));
  });
}
