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
  happy: "وزن‌دار و ریتمیک، قافیه‌ای ساده",
  calm: "جملات کوتاه، آرام، با ضرباهنگ ملایم",
  motivational: "جملات کوتاه و قوی، قافیهٔ پایان مصراع",
  nostalgic: "جملات کشیده با مکث، قافیهٔ نرم",
};

const SYSTEM_PROMPT = `تو یک ترانه‌سرای حرفه‌ای فارسی هستی. ترانه‌هایی می‌نویسی که:
- کاملاً فارسی، روان و خوانا باشند
- احساسی، شخصی و صمیمی باشند — انگار گویندهٔ واقعی از دلش می‌گوید
- مناسب اجرای موسیقی باشند (ریتم و وزن رعایت شود)
- از اطلاعات داده‌شده بیشترین استفاده را بکنند
- بدون عنوان، پرانتز، توضیح یا هشتگ — فقط متن خود ترانه

نکتهٔ مهم برای خوانش درست توسط صدای کلون‌شده:
- هیچ عدد یا رقم ننویس؛ همیشه به‌صورت کلمه بنویس
- از مخفف یا حروف لاتین استفاده نکن
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

/** OpenAI-compatible chat completions call (works for Anthropic via proxy, AvvalAI, OpenRouter) */
async function chatCompletion(
  base: string,
  key: string,
  model: string,
  brief: SongBrief,
  extraHeaders: Record<string, string> = {}
): Promise<string> {
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(brief) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${base} ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("پاسخ خالی از AI");
  return text;
}

/** Anthropic native API (Messages API) */
async function anthropicLyrics(brief: SongBrief): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(brief) }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { content?: { type: string; text: string }[] };
  const text = json.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) throw new Error("Anthropic پاسخ خالی برگرداند");
  return text;
}

/**
 * Draft Persian song lyrics.
 * Priority: Anthropic → AvvalAI → OpenRouter → local template
 */
export async function draftLyrics(brief: SongBrief): Promise<string> {
  // 1. Anthropic Claude (best for Persian poetry)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await anthropicLyrics(brief);
    } catch (e) {
      console.warn("[lyrics] Anthropic failed:", (e as Error).message);
    }
  }

  // 2. AvvalAI (OpenAI-compatible, works inside Iran)
  if (process.env.AVALAI_API_KEY) {
    try {
      return await chatCompletion(
        (process.env.AVALAI_API_BASE || "https://api.avalai.ir/v1").replace(/\/$/, ""),
        process.env.AVALAI_API_KEY,
        "gpt-4o-mini",
        brief
      );
    } catch (e) {
      console.warn("[lyrics] AvvalAI failed:", (e as Error).message);
    }
  }

  // 3. OpenRouter (access to many models)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      return await chatCompletion(
        "https://openrouter.ai/api/v1",
        process.env.OPENROUTER_API_KEY,
        "google/gemini-flash-1.5",
        brief,
        { "HTTP-Referer": "https://songai.app", "X-Title": "SongAI" }
      );
    } catch (e) {
      console.warn("[lyrics] OpenRouter failed:", (e as Error).message);
    }
  }

  // 4. Lovable AI Gateway (original)
  if (process.env.LOVABLE_API_KEY) {
    try {
      return await chatCompletion(
        "https://ai.gateway.lovable.dev/v1",
        process.env.LOVABLE_API_KEY,
        "google/gemini-3-flash-preview",
        brief
      );
    } catch (e) {
      console.warn("[lyrics] Lovable AI failed:", (e as Error).message);
    }
  }

  // 5. Local fallback — always works
  return localDraft(brief);
}

const genreTags: Record<Genre, string> = {
  romantic:
    "warm romantic ballad, soft piano, gentle strings, slow tempo, intimate, tender, no upbeat drums, no EDM",
  emotional:
    "intimate piano ballad, close-miked, sparse arrangement, minimal reverb, tender strings, vulnerable, no cinematic swell, no epic drums, no pop hooks",
  happy:
    "upbeat persian pop, bright synth pads, claps, major key, joyful, radio-ready modern production",
  calm:
    "calm acoustic, soft fingerpicked guitar, gentle, peaceful, natural room tone, no synthesizers, no heavy drums",
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
