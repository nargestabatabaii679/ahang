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

const SYSTEM_PROMPT = `تو یک ترانه‌سرای بسیار حرفه‌ای فارسی هستی با سال‌ها تجربه در ترانه‌نویسی ایرانی.
ترانه‌هایت مثل بهترین آثار استادان ترانه‌سرایی مثل شهیار قنبری و فریدون مشیری است.

قوانین مطلق:
- فقط فارسی سره و روان بنویس — هیچ کلمه‌ی لاتین، مخفف یا عدد (رقم) نه
- هیچ عنوان، پرانتز، توضیح، لیبل بند یا هشتگ نگذار — فقط خودِ متن ترانه
- هر مصراع حداکثر ۱۰ کلمه باشد (کوتاه و ضربدار)
- قافیه‌بندی دقیق: انتهای مصراع‌های زوج باید هم‌قافیه باشند
- وزن عروضی یا سیلابیک رعایت کن — هر مصراع همان ریتم مصراع قبلی را داشته باشد

ساختار آهنگ:
- بند اول (ورس ۱): ۴ مصراع — معرفی حال و احساس
- ترجیع‌بند (کورس): ۴ مصراع — جملهٔ اصلی و احساسی‌ترین قسمت، باید به‌یادماندنی باشد
- بند دوم (ورس ۲): ۴ مصراع — عمق‌دادن به داستان
- ترجیع‌بند (کورس): همان ۴ مصراع قبل، تکرار
- بریج (پل): ۲ مصراع — اوج احساسی، متفاوت از بقیه
- ترجیع‌بند (کورس): همان ۴ مصراع تکرار

فاصله‌گذاری: بین هر بخش یک خط خالی بگذار.

نکته‌ٔ حیاتی برای اجرای موسیقی:
- هر مصراع با یک احساس کامل تمام شود
- از تکرار کلیشه‌ها مثل «دلم» «چشمانت» پرهیز کن — جملات تازه و شاعرانه بنویس
- اسم شخص را در ترجیع‌بند بیاور تا تأثیرگذارترین قسمت شخصی باشد`;



function buildPrompt(brief: SongBrief): string {
  const name = brief.recipientName.trim() || "عزیزم";
  const occasion = occasionLabel[brief.occasion];
  const genre = genreLabel[brief.genre];
  const rhyme = genreRhyme[brief.genre];
  const relationship = relationshipText(brief);
  const about = brief.aboutText?.trim();

  const lines = [
    `یک ترانهٔ فارسی حرفه‌ای و احساسی بساز که گویندهٔ آن برای «${name}» — که ${relationship} است — می‌خواند، به مناسبت «${occasion}».`,
    "",
    `🎵 حس و حال: ${genre}`,
    `🎵 وزن و قافیه: ${rhyme}`,
    `🎵 نام «${name}» باید در ترجیع‌بند (کورس) بیاید تا شخصی‌ترین لحظه باشد.`,
  ];

  if (about) {
    lines.push(
      "",
      `📝 موضوع خاصی که گوینده می‌خواهد در ترانه باشد:`,
      `«${about}»`,
      `این موضوع را به‌شکل شاعرانه و غیرمستقیم در ترانه ببند — از کلمه‌به‌کلمه پرهیز کن.`
    );
  }

  lines.push(
    "",
    `ساختار دقیق (با خط خالی بین هر بخش):`,
    `[ورس ۱] ۴ مصراع`,
    `[کورس] ۴ مصراع — به‌یادماندنی‌ترین بخش، نام «${name}» اینجاست`,
    `[ورس ۲] ۴ مصراع`,
    `[کورس] همان ۴ مصراع قبل`,
    `[بریج] ۲ مصراع — اوج احساسی`,
    `[کورس] همان ۴ مصراع قبل`,
    "",
    `فقط متن ترانه بنویس — هیچ لیبل، عنوان یا توضیح نه.`
  );
  return lines.join("\n");
}

function localDraft(brief: SongBrief): string {
  const name = brief.recipientName.trim() || "عزیزم";
  const occasion = occasionLabel[brief.occasion];
  const templates: Record<string, string[]> = {
    birthday: [
      `امروز روز توست، روز تولدت`,
      `دنیا برای من با تو رنگ دارد`,
      `هر سال که می‌گذرد بیشتر می‌فهمم`,
      `چقدر خوشحالم که در کنارم هستی`,
      "",
      `${name} جان، ${name} جانم`,
      `تولدت مبارک باد، ای آرامش جانم`,
      `بمان کنارم تا آخر این راه`,
      `که بی‌تو این دنیا معنایی ندارد`,
      "",
      `صدایت در گوشم، خنده‌ات در قلبم`,
      `هر روز که بودی بهترین هدیه بود`,
      `امروز می‌خوانم برایت از صمیم دل`,
      `که دوستت دارم، که عاشقتم من`,
    ],
    default: [
      `به مناسبت ${occasion} برایت می‌خوانم`,
      `از اعماق قلبم، با تمام وجودم`,
      `کلماتی که هیچ‌وقت نگفتم`,
      `امروز می‌گویم، فقط برای تو`,
      "",
      `${name} جان، ${name} عزیزم`,
      `می‌خواهم بدانی که چقدر مهمی`,
      `در این دنیای پر از هیاهو`,
      `تو آرامش من، تو معنای منی`,
      "",
      `وقتی نیستی، جهان خاموش است`,
      `وقتی هستی، قلبم پر از نور است`,
      `این آهنگ را ساختم که بدانی همیشه`,
      `در فکرتم، در دلم، در تمام لحظه‌ها`,
    ],
  };
  const lines = templates[brief.occasion] || templates.default;
  return lines.join("\n");
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
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022",
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
  // 1. Anthropic Claude (best for Persian poetry) — try both keys
  for (const envKey of ["ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY_2"]) {
    if (process.env[envKey]) {
      const saved = process.env.ANTHROPIC_API_KEY;
      if (envKey !== "ANTHROPIC_API_KEY") process.env.ANTHROPIC_API_KEY = process.env[envKey];
      try {
        const result = await anthropicLyrics(brief);
        if (envKey !== "ANTHROPIC_API_KEY") process.env.ANTHROPIC_API_KEY = saved;
        return result;
      } catch (e) {
        if (envKey !== "ANTHROPIC_API_KEY") process.env.ANTHROPIC_API_KEY = saved;
        console.warn(`[lyrics] Anthropic (${envKey}) failed:`, (e as Error).message);
      }
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

// ── Music prompts ─────────────────────────────────────────────────────────

interface GenreMusic {
  tags: string;
  bpm: string;
  key: string;
  instruments: string;
  production: string;
}

const genreMusic: Record<Genre, GenreMusic> = {
  romantic: {
    tags: "romantic ballad, cinematic, lush",
    bpm: "60-72 BPM",
    key: "D major or A major",
    instruments: "grand piano, cello, violin section, soft acoustic guitar, subtle strings pad, gentle bass",
    production: "warm mastering, intimate close-mic room reverb, gentle tape saturation, lush stereo width on strings",
  },
  emotional: {
    tags: "emotional ballad, intimate, raw",
    bpm: "50-65 BPM",
    key: "C minor or E minor",
    instruments: "upright piano, solo cello, sparse pizzicato strings, subtle ambient pad, soft kick on 2 and 4",
    production: "close-miked dry piano, minimal reverb, subtle tape compression, space and silence between phrases",
  },
  happy: {
    tags: "upbeat persian pop, joyful, radio-ready",
    bpm: "108-120 BPM",
    key: "G major or C major",
    instruments: "bright synth pads, electric guitar stabs, hand claps, shaker, funk bass, punchy kick, crispy snare",
    production: "modern pop mastering, sidechain compression, bright high-end air, wide stereo mix, punchy low end",
  },
  calm: {
    tags: "calm acoustic, peaceful, organic",
    bpm: "72-84 BPM",
    key: "A major or E major",
    instruments: "fingerpicked acoustic guitar, soft nylon string guitar, light cajón, subtle kalimba, warm bass",
    production: "natural room tone, minimal processing, gentle compression, soft high shelf, no synthesizers",
  },
  motivational: {
    tags: "uplifting cinematic, triumphant, epic",
    bpm: "90-110 BPM",
    key: "E major or B major",
    instruments: "brass section, string orchestra, epic taiko drums, driving 8th-note piano, french horn, bass drum",
    production: "cinematic mastering, wide room reverb on strings, stadium-sized reverb on drums, building energy",
  },
  nostalgic: {
    tags: "nostalgic, vintage warmth, retro",
    bpm: "76-88 BPM",
    key: "F major or G major",
    instruments: "rhodes piano, nylon guitar, soft vibraphone, brushed snare, upright bass, subtle mellotron strings",
    production: "vinyl crackle layer, tape saturation, low-pass filter warmth, slight wow-and-flutter, lo-fi mastering",
  },
};

export function buildMusicPrompt(brief: SongBrief): {
  tags: string;
  description: string;
} {
  const m = genreMusic[brief.genre];
  const name = brief.recipientName.trim() || "عزیزم";
  const occasion = occasionLabel[brief.occasion];

  return {
    tags: [
      "instrumental",
      "no vocals",
      "no singing",
      "no lyrics",
      m.tags,
      m.bpm,
      m.key,
    ].join(", "),
    description:
      `A professional studio-quality instrumental backing track for a personal Persian gift song dedicated to "${name}" for ${occasion}. ` +
      `Mood: ${genreLabel[brief.genre]}. ` +
      `Instruments: ${m.instruments}. ` +
      `Production style: ${m.production}. ` +
      `Leaves generous space and headroom for a lead vocal to sit on top. No lead vocals, no lyrics, purely instrumental.`,
  };
}

// ── Cover art prompts ──────────────────────────────────────────────────────

interface GenreArt {
  style: string;
  palette: string;
  mood: string;
  elements: string;
}

const genreArt: Record<Genre, GenreArt> = {
  romantic: {
    style: "painterly digital art, soft impressionism, dreamy",
    palette: "deep rose, gold, champagne, warm burgundy, candlelight",
    mood: "intimate, tender, magical evening",
    elements: "rose petals, soft bokeh lights, flowing silk, warm candlelight glow",
  },
  emotional: {
    style: "fine art photography aesthetic, moody chiaroscuro",
    palette: "deep teal, cobalt, silver moonlight, shadow blue",
    mood: "raw, heartfelt, introspective",
    elements: "rain on glass, solitary light, misty atmosphere, delicate flowers",
  },
  happy: {
    style: "vibrant contemporary digital illustration, pop art energy",
    palette: "sunflower yellow, coral, turquoise, bright white, electric blue",
    mood: "joyful, celebratory, energetic",
    elements: "confetti, sunbursts, colorful ribbons, sparkles, blooming flowers",
  },
  calm: {
    style: "minimalist watercolor, zen art, serene",
    palette: "sage green, soft ivory, pale lavender, warm sand, sky blue",
    mood: "peaceful, meditative, gentle",
    elements: "lotus flower, still water reflection, morning mist, single branch in bloom",
  },
  motivational: {
    style: "epic cinematic concept art, grand scale",
    palette: "golden sunrise, royal blue, white light, deep orange, silver",
    mood: "triumphant, inspiring, powerful",
    elements: "mountain peak, rays of light breaking through clouds, eagle soaring, horizon",
  },
  nostalgic: {
    style: "vintage film photography, retro illustration, analog warmth",
    palette: "sepia, faded amber, dusty rose, cream, warm brown",
    mood: "wistful, tender memories, timeless",
    elements: "old photographs, dried flowers, vintage clock, soft grain texture, film light leak",
  },
};

export function buildCoverArtPrompt(brief: SongBrief): string {
  const art = genreArt[brief.genre];
  const name = brief.recipientName.trim() || "عزیزم";
  const occasion = occasionLabel[brief.occasion];

  return [
    `Premium album cover art for a personal Persian gift song for "${name}", occasion: ${occasion}.`,
    `Art style: ${art.style}.`,
    `Color palette: ${art.palette}.`,
    `Mood and atmosphere: ${art.mood}.`,
    `Visual elements: ${art.elements}.`,
    `Square format, centered composition, no text, no words, no letters, no numbers.`,
    `Ultra high quality, professional music album cover, sharp details, stunning visuals.`,
  ].join(" ");
}

// ── ElevenLabs Sound Generation prompt ────────────────────────────────────

const genreELMusic: Record<Genre, string> = {
  romantic:
    "Soft romantic instrumental background music. Grand piano melody with gentle cello and warm strings. Slow 65 BPM. No vocals. Tender and intimate atmosphere. Studio quality.",
  emotional:
    "Emotional piano ballad instrumental. Solo upright piano, sparse strings. Very slow 55 BPM. No vocals. Melancholic yet beautiful. Close-miked intimate sound.",
  happy:
    "Upbeat joyful instrumental background music. Bright piano, hand claps, acoustic guitar strumming. 115 BPM major key. No vocals. Cheerful and energetic.",
  calm:
    "Calm peaceful acoustic instrumental. Soft fingerpicked nylon guitar, gentle kalimba. 78 BPM. No vocals. Meditative and serene atmosphere. Natural room tone.",
  motivational:
    "Epic cinematic orchestral instrumental. Triumphant strings, French horn, building percussion. 100 BPM. No vocals. Inspiring and powerful. Cinematic quality.",
  nostalgic:
    "Nostalgic retro instrumental. Warm Rhodes piano, soft bass, brushed snare. 82 BPM. No vocals. Vintage tape warmth. Wistful and tender.",
};

export function buildELMusicPrompt(brief: SongBrief): string {
  return genreELMusic[brief.genre];
}
