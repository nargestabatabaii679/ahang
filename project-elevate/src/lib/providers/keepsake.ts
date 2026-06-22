/**
 * Keepsake renderer — produces a printable HTML page of the song lyrics
 * styled to match the mixtape ticket. In the original Next.js project this
 * generated a LaTeX-built PDF; on Cloudflare Workers we serve printable
 * HTML instead (the browser's native "Save as PDF" handles export).
 */

import { SongBrief } from "../types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderKeepsakeHtml(brief: SongBrief, lyrics: string): string {
  const name = esc(brief.recipientName || "عزیزم");
  const body = esc(lyrics).replace(/\n/g, "<br/>");
  return `<!doctype html>
<html lang="fa" dir="rtl"><head>
<meta charset="utf-8"/>
<title>متن ترانهٔ ${name} — songai</title>
<link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet"/>
<style>
  :root { color-scheme: light; }
  body { font-family: Vazirmatn, system-ui, sans-serif; background: #f4ead4; color: #2b2118;
    margin: 0; padding: 48px 24px; }
  .card { max-width: 560px; margin: 0 auto; background: #f6ecd9; border-radius: 24px;
    padding: 40px 32px; box-shadow: 0 24px 60px -30px rgba(43,33,24,.4); }
  .label { letter-spacing: .25em; text-transform: uppercase; font-size: 11px;
    color: #6b5a3f; font-family: ui-monospace, monospace; }
  h1 { font-size: 30px; margin: 6px 0 24px; letter-spacing: -.01em; }
  pre { font-family: inherit; font-size: 16px; line-height: 2; white-space: pre-wrap; margin: 0; }
  .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #6b5a3f; }
  @media print { body { background: #fff; padding: 0 } .card { box-shadow: none } }
</style>
</head><body>
<div class="card">
  <div class="label">side a · متن ترانه</div>
  <h1>برای ${name}</h1>
  <pre>${body}</pre>
</div>
<p class="footer">ساخته‌شده با ❤️ توسط songai</p>
</body></html>`;
}
