/**
 * Printable lyrics keepsake — a properly-typeset Persian PDF (xepersian +
 * Amiri, SIL OFL licensed) of the song's lyrics, recipient name, and
 * occasion. Optional, on-demand: generated only when the user clicks
 * "download keepsake," not as part of the main pipeline, since it depends
 * on a LaTeX toolchain being installed on the host (not guaranteed on
 * serverless platforms — see README for the hosting note).
 *
 * Setup (Debian/Ubuntu host):
 *   apt-get install texlive-xetex texlive-lang-arabic
 * (texlive-lang-arabic pulls in xepersian + the Amiri font.)
 *
 * Security: recipientName / occasion / lyrics are all user-supplied and get
 * written into a .tex file that is then shelled out to xelatex. Every
 * placeholder is passed through `escapeLatex` first, which neutralizes
 * backslashes before introducing any of its own — so a value like
 * "\input{/etc/passwd}" becomes inert literal text, never a real LaTeX
 * command. xelatex itself is invoked with `-no-shell-escape` as a second
 * layer of defense, so even a successful injection couldn't run shell
 * commands via \write18.
 */

import { spawn } from "child_process";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { SongBrief, Occasion } from "../types";
import { withTempDir } from "../server-utils";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "src/lib/latex/keepsake.tex.tpl"
);

const occasionLabel: Record<Occasion, string> = {
  birthday: "تولد",
  anniversary: "سالگرد",
  appreciation: "قدردانی",
  apology: "عذرخواهی",
  celebration: "تبریک",
  none: "محبت، همین‌طوری",
};

/** Neutralize LaTeX special characters so user text can never be
 *  interpreted as commands. The backslash replacement uses a sentinel
 *  token (not literal braces) so the later brace-escaping pass can't
 *  corrupt it — a real bug caught in testing: escaping braces right after
 *  inserting "\textbackslash{}" would re-escape its own braces. */
function escapeLatex(input: string): string {
  const BACKSLASH_SENTINEL = "\u0000BS\u0000";
  return input
    .replace(/\\/g, BACKSLASH_SENTINEL)
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\$/g, "\\$")
    .replace(/&/g, "\\&")
    .replace(/#/g, "\\#")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/_/g, "\\_")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/%/g, "\\%")
    .split(BACKSLASH_SENTINEL)
    .join("\\textbackslash{}");
}

/** Turn freeform multi-line lyrics into LaTeX line breaks, with a slightly
 *  larger gap between verse blocks (blank lines in the source). */
function formatLyricsForLatex(lyrics: string): string {
  return lyrics
    .split("\n")
    .map((line) => escapeLatex(line.trim()))
    .join("\\\\\n")
    .replace(/(\\\\\n){2,}/g, "\\\\[10pt]\n"); // collapse blank-line gaps into spacing
}

function todayPersian(): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function run(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.stderr.on("data", (d) => (out += d.toString()));
    p.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            "xelatex روی این سرور نصب نیست. برای فعال‌کردن کیتسیک، texlive-xetex و texlive-lang-arabic را نصب کنید."
          )
        );
      } else {
        reject(err);
      }
    });
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`xelatex با کد ${code} خارج شد:\n${out.slice(-1500)}`))
    );
  });
}

/**
 * Render the lyrics keepsake PDF for a finished song. Returns the PDF buffer.
 */
export async function renderKeepsakePdf(
  brief: SongBrief,
  lyrics: string
): Promise<Buffer> {
  const template = await readFile(TEMPLATE_PATH, "utf-8");
  const filled = template
    .replace("{{RECIPIENT}}", escapeLatex(brief.recipientName.trim() || "عزیزم"))
    .replace("{{OCCASION}}", escapeLatex(occasionLabel[brief.occasion]))
    .replace("{{LYRICS}}", formatLyricsForLatex(lyrics))
    .replace("{{DATE}}", escapeLatex(todayPersian()));

  return withTempDir("songai-keepsake-", async (dir) => {
    const texPath = path.join(dir, "keepsake.tex");
    await writeFile(texPath, filled, "utf-8");

    // -no-shell-escape: even if escaping were somehow bypassed, the
    // compiler still can't execute shell commands via \write18.
    await run(
      "xelatex",
      [
        "-no-shell-escape",
        "-interaction=nonstopmode",
        "-halt-on-error",
        "keepsake.tex",
      ],
      dir
    );

    return readFile(path.join(dir, "keepsake.pdf"));
  });
}
