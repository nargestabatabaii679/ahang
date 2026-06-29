import { SongBrief, Occasion, Genre, Relationship } from "../types";

const occasionLabel: Record<Occasion, string> = {
  birthday: "تولد",
  anniversary: "سالگرد ازدواج",
  appreciation: "قدردانی از زحماتش",
  apology: "عذرخواهی صمیمانه",
  celebration: "جشن و شادی",
  none: "بدون مناسبت، فقط از سر عشق",
};

const relationshipLabel: Record<Relationship, string> = {
  partner: "معشوقه و همراه زندگیش",
  family: "عزیزترین خانواده‌اش",
  friend: "بهترین دوستش",
  coworker: "همکار ارزشمندش",
  special: "کسی که جایگاهی ویژه دارد",
  other: "",
};

function relationshipText(brief: SongBrief): string {
  if (brief.relationship === "other") {
    return brief.relationshipOther?.trim() || "یک آدم بسیار خاص";
  }
  return relationshipLabel[brief.relationship];
}

const genreLabel: Record<Genre, string> = {
  romantic:     "عاشقانه، گرم، صمیمی",
  emotional:    "احساسی عمیق، دلتنگ‌کننده",
  happy:        "شاد، پرانرژی، جشنی",
  calm:         "آرام، ملایم، معنوی",
  motivational: "انگیزشی، قوی، امیدبخش",
  nostalgic:    "نوستالژیک، خاطره‌انگیز، دلتنگ",
};

// Per-genre structural and poetic guidance
const genrePoetics: Record<Genre, { rhythm: string; tone: string; technique: string }> = {
  romantic: {
    rhythm:    "وزن کشیده و آهسته، هجاهای بلند، مثل «می‌مانم» و «می‌خوانم»",
    tone:      "نرم، صمیمی، انگار زمزمه می‌کنی — نه فریاد، نه خطابه",
    technique: "از تصویرسازی حسی استفاده کن (بوی موهایت، گرمای دستت) به جای گفتن مستقیم «دوستت دارم»",
  },
  emotional: {
    rhythm:    "وزن شکسته و نفس‌گیر، مصراع‌های ناتمام که دل را می‌فشارند",
    tone:      "خام، بی‌پرده، مثل کسی که گریه‌اش را نگه داشته",
    technique: "از فضاهای خالی و سکوت استفاده کن — چیزی که نگفتی مهم‌تر از چیزی است که گفتی",
  },
  happy: {
    rhythm:    "ریتم تند و کوبنده، ضرب‌آهنگ منظم، مصراع‌های کوتاه و برنده",
    tone:      "بلند، پرجوش، شاد — مثل کسی که می‌خواهد دنیا بشنود",
    technique: "از تکرار اسم و تکرار عبارت‌های کوتاه برای تأثیر ریتمیک استفاده کن",
  },
  calm: {
    rhythm:    "وزن آرام و یکنواخت مثل نفس عمیق، جملات کوتاه با سکوت بین",
    tone:      "آرام، مثل کسی که کنارت نشسته و دستت را گرفته",
    technique: "از طبیعت الهام بگیر (باد، آب، نور) — تصاویر ساده اما عمیق",
  },
  motivational: {
    rhythm:    "وزن مارشی و قوی، هر مصراع مثل یک ضربه — کوتاه و محکم",
    tone:      "قوی، صادق، مثل کسی که به تو باور دارد",
    technique: "از افعال قوی استفاده کن (بلند شو، بتاب، بپرواز) — کمتر صفت، بیشتر عمل",
  },
  nostalgic: {
    rhythm:    "وزن کشیده و آهنگین، مثل ترانه‌های قدیمی ایرانی — فاصیله و مکث دارد",
    tone:      "لطیف، شیرین‌تلخ — نه گریه، نه شادی، جایی بین",
    technique: "از خاطرهٔ یک لحظه شروع کن (همان روز، همان خیابان) و برو به احساس کلی",
  },
};

const SYSTEM_PROMPT = `تو «آهنگ‌ساز» هستی — یک هوش مصنوعی که ترانه‌های فارسی شخصی و احساسی می‌نویسد.
سطح کارت مثل بهترین ترانه‌های ایرانی است: از «مرا ببوس» فریدون مشیری تا آثار شهیار قنبری.

══ قوانین مطلق ══
✦ فقط فارسی روان و سره — بدون کلمهٔ لاتین، عدد (رقم)، مخفف، یا واژهٔ عامیانهٔ زشت
✦ بدون هیچ عنوان، لیبل بند، پرانتز، توضیح یا هشتگ — فقط خودِ ترانه
✦ هر مصراع باید تنها باشد (یعنی یک احساس کامل در خودش داشته باشد)
✦ قافیه‌بندی اجباری: مصراع‌های زوج هر بند باید هم‌قافیه باشند
✦ وزن: هر مصراع در یک بند باید همان تعداد هجای بند مشابه را داشته باشد

══ ساختار اجباری ══
[ورس ۱] ۴ مصراع — معرفی فضا و احساس (از جزئیات کوچک شروع کن)
[خط خالی]
[کورس] ۴ مصراع — شدیدترین احساس، اسم شخص اینجا، به‌یادماندنی‌ترین قسمت
[خط خالی]
[ورس ۲] ۴ مصراع — عمق دادن، یک جنبهٔ دیگر از رابطه
[خط خالی]
[کورس] دقیقاً همان ۴ مصراع کورس — کلمه‌به‌کلمه تکرار
[خط خالی]
[بریج] ۲ مصراع — اوج احساسی، حرفی که تا الان نگفتی، جملهٔ ناگفته
[خط خالی]
[کورس] دقیقاً همان ۴ مصراع کورس — کلمه‌به‌کلمه تکرار

══ تکنیک‌های اجباری ══
• از کلیشه‌های فرسوده («دلم»، «چشمانت»، «قلبم»، «ستاره») حتی‌المقدور پرهیز کن
• به جای گفتن احساس، آن را نشان بده — یک تصویر ملموس یا لحظهٔ واقعی
• اسم شخص را در کورس بیاور — این شخصی‌ترین لحظهٔ آهنگ است`;

// Per-occasion opening device — gives the AI a concrete starting angle
const occasionOpener: Record<Occasion, string> = {
  birthday:    "از لحظه‌ای شروع کن که او متولد شد یا آمد در زندگیت — دنیا از آن روز فرق کرد",
  anniversary: "از اولین لحظه‌ای شروع کن که فهمیدی این آدم خاص است — آن نگاه، آن جمله",
  appreciation:"از یک کار کوچک اما مهمی شروع کن که او برایت کرد و فراموش نمی‌کنی",
  apology:     "از لحظه‌ای شروع کن که فهمیدی اشتباه کردی — سکوت، دوری، پشیمانی",
  celebration: "از اوج شادی شروع کن — این لحظه را برای همیشه نگه دار",
  none:        "از یک لحظهٔ روزمره و عادی شروع کن که بدون هیچ دلیلی فقط یادش کردی",
};

function buildPrompt(brief: SongBrief): string {
  const name = brief.recipientName.trim() || "عزیزم";
  const occasion = occasionLabel[brief.occasion];
  const genre = genreLabel[brief.genre];
  const poetics = genrePoetics[brief.genre];
  const relationship = relationshipText(brief);
  const opener = occasionOpener[brief.occasion];
  const about = brief.aboutText?.trim();

  const parts: string[] = [
    `یک ترانهٔ فارسی کامل بنویس برای «${name}» — ${relationship} گوینده — به مناسبت «${occasion}».`,
    "",
    `═══ راهنمای این ترانه ═══`,
    `🎭 حس کلی: ${genre}`,
    `🎵 ریتم و وزن: ${poetics.rhythm}`,
    `🎤 لحن اجرا: ${poetics.tone}`,
    `✍️ تکنیک ادبی: ${poetics.technique}`,
    `📍 نقطهٔ شروع: ${opener}`,
    `💎 نام «${name}» باید در کورس بیاید — آن‌جا که همه چیز به اوج می‌رسد`,
  ];

  if (about) {
    parts.push(
      "",
      `═══ اطلاعات شخصی خاص ═══`,
      `گوینده این را می‌خواهد در ترانه باشد:`,
      `❝ ${about} ❞`,
      `این را به‌شکل شاعرانه و با تصویر ادبی در ترانه ببند — نه مستقیم، بلکه از پشتِ استعاره.`
    );
  }

  parts.push(
    "",
    `═══ خروجی مورد انتظار ═══`,
    `فقط و فقط متن ترانه — هیچ لیبل بند، هیچ عنوان، هیچ توضیح — فقط کلمات ترانه با خط‌های خالی بین بندها.`
  );

  return parts.join("\n");
}

// ── Fallback lyrics for all occasions ────────────────────────────────────

function localDraft(brief: SongBrief): string {
  const name = brief.recipientName.trim() || "عزیزم";

  const drafts: Record<Occasion, string> = {
    birthday: [
      `هر بار که چشم باز می‌کنی صبح`,
      `دنیا کمی زیباتر از دیروز است`,
      `سال‌هاست که بودنت در کنارم`,
      `بهترین هدیه‌ای که دارم بی‌ضرر است`,
      ``,
      `${name} جان، امروز روز توست`,
      `هر آرزویت بشود، هر چه بخواهی`,
      `بمان کنارم تا آخر این راه`,
      `که بی‌تو این خانه خانه نمی‌ماند`,
      ``,
      `می‌خوانم برایت از صمیم دل`,
      `این ترانه را مثل هر روز صبح`,
      `که تولدت روزی باشد که بدانی`,
      `چقدر مهمی در این دنیای سرد`,
      ``,
      `${name} جان، امروز روز توست`,
      `هر آرزویت بشود، هر چه بخواهی`,
      `بمان کنارم تا آخر این راه`,
      `که بی‌تو این خانه خانه نمی‌ماند`,
      ``,
      `شاید حرفی نزدم آن‌طور که باید`,
      `ولی قلبم همیشه اینجاست برایت`,
      ``,
      `${name} جان، امروز روز توست`,
      `هر آرزویت بشود، هر چه بخواهی`,
      `بمان کنارم تا آخر این راه`,
      `که بی‌تو این خانه خانه نمی‌ماند`,
    ].join("\n"),

    anniversary: [
      `یادم هست آن روز اول که آمدی`,
      `نگاهت افتاد و دنیا ایستاد`,
      `گفتم نه، گفتم شاید، گفتم بله`,
      `از آن روز تا اینجا چه راهی رفتیم ما`,
      ``,
      `${name}، سال‌ها گذشت و نگفتم`,
      `که هر روز عاشق‌ترم از دیروز`,
      `بمان همیشه، بمان کنارم`,
      `که این زندگی بی‌تو معنا ندارد`,
      ``,
      `در هر شب که سخت بود ماندی`,
      `در هر صبح که تاریک بود خندیدی`,
      `همین بود که یادم ماند از تو`,
      `که عشق یعنی ماندن، نه رفتن`,
      ``,
      `${name}، سال‌ها گذشت و نگفتم`,
      `که هر روز عاشق‌ترم از دیروز`,
      `بمان همیشه، بمان کنارم`,
      `که این زندگی بی‌تو معنا ندارد`,
      ``,
      `اگر دوباره به اول بر می‌گشتم`,
      `همین راه را باز هم انتخاب می‌کردم`,
      ``,
      `${name}، سال‌ها گذشت و نگفتم`,
      `که هر روز عاشق‌ترم از دیروز`,
      `بمان همیشه، بمان کنارم`,
      `که این زندگی بی‌تو معنا ندارد`,
    ].join("\n"),

    appreciation: [
      `کارهایی که کردی را فراموش نمی‌کنم`,
      `آن‌هایی که با سکوت و صبر کردی`,
      `نه برای تعریف، نه برای پاداش`,
      `فقط چون دلت می‌خواست — همین بود`,
      ``,
      `${name}، ممنونم که هستی`,
      `ممنونم که ماندی وقتی سخت بود`,
      `این ترانه کم است برای قدرت تو`,
      `ولی از صمیم دل است، بدانی`,
      ``,
      `آدم‌هایی مثل تو کم هستند`,
      `که بدون چشمداشت می‌دهند`,
      `یاد گرفتم از تو که محبت`,
      `یعنی دادن بدون حساب کردن`,
      ``,
      `${name}، ممنونم که هستی`,
      `ممنونم که ماندی وقتی سخت بود`,
      `این ترانه کم است برای قدرت تو`,
      `ولی از صمیم دل است، بدانی`,
      ``,
      `کاش می‌توانستم همهٔ آنچه دادی`,
      `هزار برابر برگردانم به دستانت`,
      ``,
      `${name}، ممنونم که هستی`,
      `ممنونم که ماندی وقتی سخت بود`,
      `این ترانه کم است برای قدرت تو`,
      `ولی از صمیم دل است، بدانی`,
    ].join("\n"),

    apology: [
      `می‌دانم که حرفی که زدم آسیب زد`,
      `می‌دانم که رفتنت درست بود`,
      `نشستم اینجا و فکر کردم بسیار`,
      `و فهمیدم اشتباه کردم`,
      ``,
      `${name}، می‌دانم دیر است شاید`,
      `ولی این کلمه‌ها از قلبم است`,
      `ببخشم اگر می‌توانی، نه اجبار`,
      `فقط بدان که پشیمانم از آن روز`,
      ``,
      `دلم می‌خواهد برگردیم به قبل`,
      `به روزهایی که آسان‌تر بود`,
      `اگر فرصتی دیگر باشد بدانی`,
      `که این بار بهتر می‌مانم کنارت`,
      ``,
      `${name}، می‌دانم دیر است شاید`,
      `ولی این کلمه‌ها از قلبم است`,
      `ببخشم اگر می‌توانی، نه اجبار`,
      `فقط بدان که پشیمانم از آن روز`,
      ``,
      `گاهی آدم باید بشکند تا بفهمد`,
      `که مهم‌ترین چیزش را داشته و نمی‌دانسته`,
      ``,
      `${name}، می‌دانم دیر است شاید`,
      `ولی این کلمه‌ها از قلبم است`,
      `ببخشم اگر می‌توانی، نه اجبار`,
      `فقط بدان که پشیمانم از آن روز`,
    ].join("\n"),

    celebration: [
      `امروز روزی است که باید بخوانیم`,
      `که خندید و شکست آن دیوار`,
      `این لحظه را نگه دار برای همیشه`,
      `چون جایی رسیدی که لایقش بودی`,
      ``,
      `${name}، این لحظه برای توست`,
      `جشن بگیر، بخند، بتاب امشب`,
      `همه می‌دانند که این راه سخت بود`,
      `و تو ماندی و رسیدی — آفرین تو`,
      ``,
      `یادت هست آن روزها که شک داشتی`,
      `که می‌شود یا نه، که ارزش دارد؟`,
      `حالا می‌بینی که جواب «بله» بود`,
      `و تمام آن صبر ارزش داشت`,
      ``,
      `${name}، این لحظه برای توست`,
      `جشن بگیر، بخند، بتاب امشب`,
      `همه می‌دانند که این راه سخت بود`,
      `و تو ماندی و رسیدی — آفرین تو`,
      ``,
      `بتاب، بتاب، نوبت توست که بدرخشی`,
      `دنیا منتظر بود تا این لحظه ببیند`,
      ``,
      `${name}، این لحظه برای توست`,
      `جشن بگیر، بخند، بتاب امشب`,
      `همه می‌دانند که این راه سخت بود`,
      `و تو ماندی و رسیدی — آفرین تو`,
    ].join("\n"),

    none: [
      `امروز هیچ دلیل خاصی ندارم`,
      `جز اینکه یادم افتاد به تو`,
      `همین که هستی برایم کافی است`,
      `همین که می‌دانی که فکرتم هستم`,
      ``,
      `${name}، این ترانه برای توست`,
      `نه برای مناسبت، نه برای خاطره`,
      `فقط چون دلم خواست بگویم امروز`,
      `که بودنت در دنیایم غنیمت است`,
      ``,
      `گاهی آدم فراموش می‌کند که بگوید`,
      `چقدر ممنون است از بودن یک نفر`,
      `من امروز فراموش نکردم، نشستم`,
      `و این آهنگ را ساختم فقط برایت`,
      ``,
      `${name}، این ترانه برای توست`,
      `نه برای مناسبت، نه برای خاطره`,
      `فقط چون دلم خواست بگویم امروز`,
      `که بودنت در دنیایم غنیمت است`,
      ``,
      `شاید سخت باشد گفتن این حرف‌ها`,
      `ولی با آهنگ راحت‌تر می‌توانم`,
      ``,
      `${name}، این ترانه برای توست`,
      `نه برای مناسبت، نه برای خاطره`,
      `فقط چون دلم خواست بگویم امروز`,
      `که بودنت در دنیایم غنیمت است`,
    ].join("\n"),
  };

  return drafts[brief.occasion] ?? drafts.none;
}

/** OpenAI-compatible chat completions call */
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
      max_tokens: 1200,
      temperature: 0.85,
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
      max_tokens: 1200,
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
 * Priority: Anthropic KEY_2 → Anthropic KEY → AvvalAI (gpt-4o) → OpenRouter (gemini-pro) → local
 */
export async function draftLyrics(brief: SongBrief): Promise<string> {
  // 1. Anthropic Claude — try KEY_2 first (higher balance), then KEY
  for (const envKey of ["ANTHROPIC_API_KEY_2", "ANTHROPIC_API_KEY"]) {
    const val = process.env[envKey];
    if (!val) continue;
    const saved = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = val;
    try {
      const result = await anthropicLyrics(brief);
      process.env.ANTHROPIC_API_KEY = saved;
      console.log(`[lyrics] success via Anthropic (${envKey})`);
      return result;
    } catch (e) {
      process.env.ANTHROPIC_API_KEY = saved;
      console.warn(`[lyrics] Anthropic (${envKey}) failed:`, (e as Error).message);
    }
  }

  // 2. AvvalAI with gpt-4o for best quality
  if (process.env.AVALAI_API_KEY) {
    try {
      const result = await chatCompletion(
        (process.env.AVALAI_API_BASE || "https://api.avalai.ir/v1").replace(/\/$/, ""),
        process.env.AVALAI_API_KEY,
        "gpt-4o",
        brief
      );
      console.log("[lyrics] success via AvvalAI");
      return result;
    } catch (e) {
      console.warn("[lyrics] AvvalAI failed:", (e as Error).message);
      // retry with gpt-4o-mini
      try {
        return await chatCompletion(
          (process.env.AVALAI_API_BASE || "https://api.avalai.ir/v1").replace(/\/$/, ""),
          process.env.AVALAI_API_KEY,
          "gpt-4o-mini",
          brief
        );
      } catch { /* fall through */ }
    }
  }

  // 3. OpenRouter with a strong model for Persian
  if (process.env.OPENROUTER_API_KEY) {
    for (const model of ["google/gemini-pro-1.5", "google/gemini-flash-1.5", "meta-llama/llama-3.1-70b-instruct"]) {
      try {
        const result = await chatCompletion(
          "https://openrouter.ai/api/v1",
          process.env.OPENROUTER_API_KEY,
          model,
          brief,
          { "HTTP-Referer": "https://aimusics.liara.run", "X-Title": "SongAI Persian" }
        );
        console.log(`[lyrics] success via OpenRouter (${model})`);
        return result;
      } catch (e) {
        console.warn(`[lyrics] OpenRouter (${model}) failed:`, (e as Error).message);
      }
    }
  }

  // 4. Lovable AI Gateway
  if (process.env.LOVABLE_API_KEY) {
    try {
      return await chatCompletion(
        "https://ai.gateway.lovable.dev/v1",
        process.env.LOVABLE_API_KEY,
        "google/gemini-2-flash-preview",
        brief
      );
    } catch (e) {
      console.warn("[lyrics] Lovable AI failed:", (e as Error).message);
    }
  }

  // 5. Local fallback — always works, actual full lyrics per occasion
  console.warn("[lyrics] all AI providers failed — using local draft");
  return localDraft(brief);
}

// ── ElevenLabs Sound Generation prompts ──────────────────────────────────

/**
 * High-quality, highly specific prompts for ElevenLabs Sound Generation.
 * The more specific and detailed the prompt, the better the output.
 * Max 22 seconds per call — optimised for a backing track that voices sit on.
 */
const genreELMusic: Record<Genre, string> = {
  romantic: [
    "Intimate romantic Persian love song backing track.",
    "Grand piano plays a tender, slow melody in D major at 64 BPM.",
    "A solo cello enters with a warm countermelody.",
    "Lush string section swells gently underneath.",
    "Soft acoustic guitar provides light fingerpicked chords.",
    "Upright bass walks quietly below.",
    "The texture is warm, close-miked, like candlelight in a quiet room.",
    "No drums, no vocals, purely instrumental.",
    "Generous headroom left for a lead vocal.",
    "Studio mastered, silky and intimate.",
  ].join(" "),

  emotional: [
    "Deep emotional ballad instrumental, deeply melancholic.",
    "Solo upright piano in C minor, very slow at 52 BPM.",
    "Notes linger with natural reverb, space between phrases.",
    "A solo cello enters softly, like someone holding back tears.",
    "Sparse pizzicato violin notes appear and disappear.",
    "Silence is part of the music — do not fill every moment.",
    "No percussion, no bass, raw and intimate.",
    "The feeling is of longing and unspoken words.",
    "No vocals, purely instrumental backing track.",
    "Leave space for a voice to breathe over it.",
  ].join(" "),

  happy: [
    "Upbeat joyful Persian pop celebration track.",
    "Bright electric piano plays a hooky melody in G major at 116 BPM.",
    "Punchy kick drum and crispy snare with a tight groove.",
    "Hand claps on beats 2 and 4.",
    "Shaker and tambourine add rhythmic energy.",
    "Funk bass bounces underneath.",
    "Acoustic guitar strums bright 16th-note patterns.",
    "The energy is festive, warm, like a joyful celebration party.",
    "Modern pop production, wide stereo mix.",
    "No vocals, space for singing over it.",
  ].join(" "),

  calm: [
    "Peaceful meditative acoustic instrumental.",
    "Fingerpicked nylon-string classical guitar in A major at 76 BPM.",
    "Gentle kalimba (thumb piano) adds warm overtone sparkle.",
    "Soft ambient pad hums very quietly underneath.",
    "Light, airy, like morning sunlight through curtains.",
    "Minimal processing, natural room tone, no compression artifacts.",
    "No drums, no electric instruments, purely acoustic and organic.",
    "The mood is serene, like a quiet garden in early morning.",
    "No vocals, leave space for a peaceful voice.",
    "Studio recorded, natural and warm.",
  ].join(" "),

  motivational: [
    "Epic cinematic motivational orchestral build.",
    "Starts with solo French horn melody in E major at 96 BPM.",
    "Strings enter and swell into a triumphant motif.",
    "Taiko drums build with power and momentum.",
    "Brass section joins — horns, trombones, trumpets.",
    "Driving 8th-note piano pushes the energy forward.",
    "Stadium-scale reverb on the drums, wide string reverb.",
    "The feeling is of triumph, rising above challenges, believing in yourself.",
    "No vocals, purely instrumental, cinematic quality.",
    "Leave generous headroom for a powerful vocal delivery.",
  ].join(" "),

  nostalgic: [
    "Nostalgic vintage Persian song instrumental, bittersweet warmth.",
    "Warm Rhodes electric piano in F major at 80 BPM.",
    "Soft brushed snare drum with light jazz groove.",
    "Nylon-string guitar plucks gentle chords.",
    "Upright bass walks slowly underneath.",
    "Subtle mellotron strings hum in the background.",
    "Light vinyl crackle texture gives a vintage feel.",
    "Gentle tape saturation warms everything.",
    "The mood is wistful, like looking at old photographs.",
    "No vocals, space for a tender, nostalgic voice.",
  ].join(" "),
};

export function buildELMusicPrompt(brief: SongBrief): string {
  return genreELMusic[brief.genre];
}

// ── Suno / Riffusion music prompts ───────────────────────────────────────

interface GenreMusic {
  tags: string;
  bpm: string;
  key: string;
  instruments: string;
  production: string;
}

const genreMusic: Record<Genre, GenreMusic> = {
  romantic: {
    tags: "romantic Persian ballad, cinematic, lush, intimate",
    bpm: "60-68 BPM",
    key: "D major or A major",
    instruments: "grand piano, solo cello, violin section, soft acoustic guitar, string pad, upright bass",
    production: "warm close-mic intimacy, gentle tape saturation, lush stereo strings, silky mastering",
  },
  emotional: {
    tags: "emotional ballad, melancholic, raw, intimate, Persian",
    bpm: "48-58 BPM",
    key: "C minor or E minor",
    instruments: "upright piano, solo cello, sparse pizzicato strings, distant ambient pad",
    production: "dry piano with natural reverb, silence between phrases, minimal mastering, raw and honest",
  },
  happy: {
    tags: "upbeat Persian pop, celebratory, radio-ready, joyful",
    bpm: "112-122 BPM",
    key: "G major or C major",
    instruments: "electric piano, acoustic guitar, hand claps, shaker, funk bass, punchy kick, crispy snare",
    production: "modern pop mastering, wide stereo, punchy low end, bright sparkly highs, sidechain pump",
  },
  calm: {
    tags: "acoustic, peaceful, organic, meditative, Persian",
    bpm: "70-82 BPM",
    key: "A major or E major",
    instruments: "fingerpicked nylon guitar, kalimba, soft ambient pad, warm bass",
    production: "natural room tone, no compression artifacts, gentle high shelf, organic and breathing",
  },
  motivational: {
    tags: "epic cinematic, orchestral, triumphant, inspiring, Persian",
    bpm: "88-108 BPM",
    key: "E major or B major",
    instruments: "string orchestra, brass section, French horn, taiko drums, driving piano, bass drum",
    production: "cinematic mastering, stadium reverb on drums, wide strings, building dynamics",
  },
  nostalgic: {
    tags: "nostalgic, vintage, retro, bittersweet, Persian warmth",
    bpm: "74-86 BPM",
    key: "F major or G major",
    instruments: "Rhodes piano, nylon guitar, brushed snare, upright bass, mellotron strings, vibraphone",
    production: "vinyl crackle, tape saturation, lo-fi warmth, wow-and-flutter, intimate mastering",
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
      `Professional studio-quality Persian gift song backing track for "${name}", occasion: ${occasion}. ` +
      `Mood: ${genreLabel[brief.genre]}. ` +
      `Instruments: ${m.instruments}. ` +
      `Production: ${m.production}. ` +
      `Dynamics: starts softer and builds through the song. ` +
      `Leaves generous space and headroom for lead Persian vocal. No vocals whatsoever.`,
  };
}

// ── Cover art prompts ──────────────────────────────────────────────────────

interface GenreArt {
  style: string;
  palette: string;
  mood: string;
  elements: string;
  lighting: string;
}

const genreArt: Record<Genre, GenreArt> = {
  romantic: {
    style: "painterly fine art, soft impressionism, cinematic photography",
    palette: "deep rose, burnished gold, champagne, warm burgundy, candlelight amber",
    mood: "intimate, tender, magical golden hour",
    elements: "soft-focus rose petals, bokeh candlelight, flowing silk fabric, warm glow",
    lighting: "warm candlelight, soft golden backlight, dreamy haze",
  },
  emotional: {
    style: "moody fine art photography, chiaroscuro painting, cinematic noir",
    palette: "deep teal, midnight blue, silver moonlight, soft shadow",
    mood: "introspective, raw, heartfelt, quietly powerful",
    elements: "rain on dark glass, single candle flame, mist, delicate wilting flower",
    lighting: "single harsh light source, deep shadows, silver moonlight",
  },
  happy: {
    style: "vibrant digital art, contemporary pop illustration, energetic",
    palette: "sunflower yellow, vivid coral, turquoise, pure white, electric blue",
    mood: "joyful, celebratory, bursting with life",
    elements: "confetti burst, sunburst rays, colorful balloons, sparkling fireworks",
    lighting: "bright midday sun, vivid and crisp, high saturation",
  },
  calm: {
    style: "minimalist watercolor, Japanese zen art, serene landscape",
    palette: "sage green, soft ivory, pale lavender, warm sand, sky blue",
    mood: "peaceful, meditative, gently breathing",
    elements: "single lotus on still water, morning mist over hills, cherry blossom branch",
    lighting: "soft diffused morning light, no harsh shadows, gentle gradients",
  },
  motivational: {
    style: "epic cinematic concept art, digital painting, grand scale",
    palette: "golden sunrise orange, royal blue, pure white light, deep bronze",
    mood: "triumphant, awe-inspiring, breathtaking",
    elements: "mountain summit above clouds, sun rays breaking through, eagle soaring",
    lighting: "dramatic sunrise backlighting, golden rim light, epic scale",
  },
  nostalgic: {
    style: "vintage film photography, retro illustration, analog warmth",
    palette: "warm sepia, faded amber, dusty rose, aged cream, warm brown",
    mood: "wistful, tender, timeless, sweet-melancholic",
    elements: "old photo album, dried flowers in pressed pages, vintage clock, film grain",
    lighting: "warm afternoon window light, golden film leak, soft vignette",
  },
};

export function buildCoverArtPrompt(brief: SongBrief): string {
  const art = genreArt[brief.genre];
  const name = brief.recipientName.trim() || "عزیزم";
  const occasion = occasionLabel[brief.occasion];

  return [
    `Premium music album cover art for a personal Persian gift song dedicated to "${name}", occasion: ${occasion}.`,
    `Art direction: ${art.style}.`,
    `Color palette: ${art.palette}.`,
    `Mood: ${art.mood}.`,
    `Visual elements: ${art.elements}.`,
    `Lighting: ${art.lighting}.`,
    `Format: perfectly square, centered composition with breathing room around main subject.`,
    `Absolutely no text, no words, no letters, no numbers, no watermarks anywhere.`,
    `Quality: ultra-high resolution, professional music industry album cover, stunning and emotionally resonant.`,
  ].join(" ");
}
