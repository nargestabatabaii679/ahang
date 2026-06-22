import { SongBrief, Occasion, Genre, Relationship } from "../types";

const occasionLabel: Record<Occasion, string> = {
  birthday: "تولد",
  anniversary: "سالگرد",
  appreciation: "قدردانی",
  apology: "عذرخواهی",
  celebration: "تبریک",
  none: "بدون مناسبت خاص، فقط از سر دل",
};

const relationshipLabel: Record<Relationship, string> = {
  partner: "عشق و پارتنرش",
  family: "خانواده‌اش",
  friend: "دوستش",
  coworker: "همکارش",
  special: "یک شخص خاص برایش",
  other: "",
};

function relationshipText(brief: SongBrief): string {
  if (brief.relationship === "other") {
    return brief.relationshipOther?.trim() || "یک آدم خاص";
  }
  return relationshipLabel[brief.relationship];
}

/** Mood labels — chosen instead of music-genre jargon (pop/lofi/acoustic)
 *  because picking a *feeling* is far more intuitive for a non-musician
 *  audience than picking a production style. */
const genreLabel: Record<Genre, string> = {
  romantic: "عاشقانه و گرم",
  emotional: "احساسی و دلی",
  happy: "شاد و پرانرژی",
  calm: "آرام و آرامش‌بخش",
  motivational: "انگیزه‌بخش و امیدوارکننده",
  nostalgic: "نوستالژیک و دلتنگ‌کننده",
};

const genreRhyme: Record<Genre, string> = {
  romantic: "جملات نرم و کشیده، قافیهٔ ملایم",
  emotional: "جملات بلند و نفس‌گیر، قافیهٔ انتهای بند",
  happy: "وزن‌دار و ریتمیک، قافیه‌بندی ساده و گوش‌نواز",
  calm: "ساده و محاوره‌ای، قافیهٔ آزاد",
  motivational: "مصراع‌های قوی و کوبنده، قافیهٔ محکم",
  nostalgic: "آزاد و شاعرانه، بدون قید قافیهٔ سخت",
};

function openaiBase() {
  return (process.env.OPENAI_API_BASE || "https://api.openai.com/v1").replace(
    /\/$/,
    ""
  );
}

function openaiKey() {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("OPENAI_API_KEY تنظیم نشده است");
  return k;
}

/**
 * Generate a real Persian song lyric via OpenAI.
 * Always attempts the API call; throws on failure so the pipeline can report it.
 * Only falls back to localDraft when OPENAI_API_KEY is literally absent from env.
 */
export async function draftLyrics(brief: SongBrief): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[lyrics] OPENAI_API_KEY not set — using local draft");
    return localDraft(brief);
  }

  const res = await fetch(`${openaiBase()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_LYRICS_MODEL || "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 600,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(brief) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `OpenAI lyrics API خطا داد (${res.status}): ${body.slice(0, 300)}`
    );
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI پاسخ خالی برگرداند");
  return text;
}

const SYSTEM_PROMPT = `تو یک ترانه‌سرای حرفه‌ای فارسی هستی. ترانه‌هایی می‌نویسی که:
- کاملاً فارسی، روان و خوانا باشند
- احساسی، شخصی و صمیمی باشند — انگار گویندهٔ واقعی از دلش می‌گوید
- مناسب اجرای موسیقی باشند (ریتم و وزن رعایت شود)
- از اطلاعات داده‌شده بیشترین استفاده را بکنند
- بدون عنوان، پرانتز، توضیح یا هشتگ — فقط متن خود ترانه

نکتهٔ مهم برای خوانش درست توسط صدای کلون‌شده (که ترانه را واقعاً «می‌خواند»، نه فقط می‌خواند):
- هیچ عدد یا رقم ننویس؛ همیشه به‌صورت کلمه بنویس (مثلاً «بیست سالگی» نه «۲۰ سالگی»)
- از مخفف یا حروف لاتین استفاده نکن (مثلاً اگر اسم انگلیسی لازم شد، تلفظ فارسی‌اش را بنویس، نه حروف انگلیسی)
- جمله‌ها کوتاه و با مکث‌های طبیعی باشند تا خواننده نفس بکشد`;

function buildPrompt(brief: SongBrief): string {
  const name = brief.recipientName.trim() || "عزیزم";
  const occasion = occasionLabel[brief.occasion];
  const genre = genreLabel[brief.genre];
  const rhyme = genreRhyme[brief.genre];
  const relationship = relationshipText(brief);
  const about = brief.aboutText?.trim();

  const lines = [
    `یک ترانهٔ فارسی کامل بنویس برای «${name}» که گویندهٔ ترانه ${relationship} است، به مناسبت «${occasion}».`,
    `حس‌وحال آهنگ: ${genre}. وزن و قافیه: ${rhyme}.`,
    `ساختار: ۳ بند اصلی (هر بند ۴ مصراع) + یک ترجیع‌بند (refrain) ۲ مصراعی که بین بندها تکرار می‌شود.`,
    `نام «${name}» باید حداقل یک بار در متن بیاید.`,
  ];

  if (about) {
    lines.push(
      `موضوعی که گوینده می‌خواهد ترانه دربارهٔ آن باشد: «${about}»`,
      "این را به شکل شاعرانه در ترانه منعکس کن — نه کلمه‌به‌کلمه."
    );
  }

  lines.push("فقط متن ترانه را بنویس، هیچ چیز دیگری نه.");
  return lines.join("\n");
}

/** Offline fallback — only used when OPENAI_API_KEY is absent. */
function localDraft(brief: SongBrief): string {
  const name = brief.recipientName.trim() || "عزیزم";
  const about = brief.aboutText?.trim();
  return [
    `${name} جان،`,
    `به مناسبت ${occasionLabel[brief.occasion]} برایت می‌نویسم.`,
    "",
    about || "هر لحظه‌ای که با تو می‌گذرد، یک ترانه است.",
    "",
    "این آهنگ را ساختم تا بدانی چقدر برایم عزیزی.",
  ].join("\n");
}

/**
 * Suno's `tags` field is weighted far more heavily than the freeform
 * `prompt`/description text — and on its own, "pop" is a gravity well that
 * nearly every genre drifts toward unless explicitly counteracted (per the
 * suno-song-creator skill's genre-cloud analysis). Each entry below pairs
 * the genre with the specific instrumentation/production language that
 * keeps it sounding distinct, with explicit exclusions where a genre would
 * otherwise default toward pop/cinematic/indie gravity wells.
 */
const genreTags: Record<Genre, string> = {
  romantic:
    "warm romantic ballad, soft piano, gentle strings, slow tempo, intimate, tender, no upbeat drums, no EDM",
  emotional:
    "intimate piano ballad, close-miked, sparse arrangement, minimal reverb, tender strings, vulnerable, no cinematic swell, no epic drums, no pop hooks",
  happy:
    "upbeat persian pop, bright synth pads, claps, major key, joyful, radio-ready modern production",
  calm: "calm acoustic, soft fingerpicked guitar, gentle, peaceful, natural room tone, no synthesizers, no heavy drums",
  motivational:
    "uplifting cinematic, building energy, triumphant strings and brass, driving rhythm, inspiring, hopeful, no lofi, no sad minor key",
  nostalgic:
    "nostalgic warm, dusty vinyl crackle, mellow rhodes piano, tape saturation, wistful, retro warmth, no bright pop hooks",
};

export function buildMusicPrompt(brief: SongBrief): {
  tags: string;
  description: string;
} {
  return {
    tags: `instrumental, no vocals, ${genreTags[brief.genre]}`,
    description: `Instrumental ${genreLabel[brief.genre]} backing track for a personal Persian gift song. Emotional and warm, leaves room for a lead vocal on top. No lead vocals.`,
  };
}
