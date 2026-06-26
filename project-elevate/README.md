# songai 🎵

ساخت آهنگ هدیه با **صدای کلون‌شدهٔ کاربر** + موسیقی پس‌زمینهٔ تولیدشده توسط AI و (اختیاری) ویدیوی لب‌سینک از روی عکس. زبان پیش‌فرض رابط: فارسی (RTL).

> «یه آهنگ، با صدای خودِ تو، فقط برای یک نفر خاص.»

---

## ✨ ویژگی‌ها

- 📝 نوشتن خودکار متن ترانه با **Anthropic Claude**
- 🎼 تولید موسیقی پس‌زمینه با **Stability Audio 2.0** / **Suno** / **Riffusion** / **ElevenLabs** (با انتخاب خودکار)
- 🎙️ کلون صدای کاربر و خوانش متن با **ElevenLabs**
- 🎬 ویدیوی لب‌سینک از روی عکس با **Creatify Aurora** / **HeyGen** / **Stability SVD** (اختیاری)
- 🖼️ کاور آرت اختصاصی برای هر آهنگ
- 📤 خروجی دانلودی + اشتراک‌گذاری واتس‌اپ / تلگرام / اینستاگرام
- 📄 خروجی PDF «کیپ‌سیک» شامل متن ترانه

---

## 🏗️ معماری

- **Frontend / SSR:** TanStack Start v1 + React 19 + Vite 7
- **Styling:** Tailwind CSS v4 (CSS variables, semantic tokens)
- **Backend Logic:** TanStack `createServerFn` + Server Routes (`src/routes/api/*`)
- **Database:** SQLite (better-sqlite3)
- **Storage:** Local filesystem (`public/media/`) — فایل‌ها به‌صورت استاتیک سرو می‌شوند
- **Runtime:** Node.js + Docker + Liara (nitro node-server preset)

```
src/
  routes/            # File-based routing (TanStack)
    api/jobs.ts      # POST: ایجاد job
    api/jobs.$id.ts  # GET: وضعیت job
  lib/
    pipeline.server.ts  # ارکستراسیون مراحل تولید
    providers/
      lyrics.ts         # Anthropic Claude (متن ترانه)
      stability.ts      # موسیقی پس‌زمینه + کاور آرت + SVD
      suno.ts           # موسیقی (جایگزین)
      riffusion.ts      # موسیقی + کاور (جایگزین)
      elevenlabs.ts     # کلون صدا + سنتز + موسیقی (جایگزین)
      creatify.ts       # ویدیوی لب‌سینک (Aurora)
      heygen.ts         # ویدیوی آواتار (جایگزین)
    storage.server.ts   # ذخیره‌سازی روی فایل‌سیستم محلی
  components/
    wizard/           # فلوی ساخت (عکس، صدا، متن)
    generation/       # نمایش پیشرفت
    result/           # نمایش نتیجه + پخش
```

---

## 🔑 متغیرهای محیطی

| نام | الزامی؟ | کاربرد |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | متن ترانه (Claude) |
| `ELEVENLABS_API_KEY` | ✅ | کلون صدا و سنتز خوانش |
| `STABILITY_API_KEY` | 🟡 | موسیقی پس‌زمینه + کاور آرت (پیشنهادی) |
| `SUNO_API_BASE` | ⚪ | جایگزین موسیقی (Suno) |
| `RIFFUSION_API_BASE` | ⚪ | جایگزین موسیقی (Riffusion) |
| `MUSIC_PROVIDER` | ⚪ | `auto` (پیش‌فرض) / `stability` / `suno` / `riffusion` / `elevenlabs` |
| `VIDEO_PROVIDER` | ⚪ | `aurora` / `heygen` / `stability` |
| `CREATIFY_API_KEY` | ⚪ | کلید Creatify برای لب‌سینک Aurora |
| `HEYGEN_API_KEY` | ⚪ | کلید HeyGen برای ویدیوی آواتار |
| `PIPELINE_MOCK` | ⚪ | `true` برای تست بدون فراخوانی واقعی |

> اگر هیچ‌کدام از providerهای موسیقی تنظیم نشده باشند، آهنگ نهایی فقط شامل صدای کلون‌شده خواهد بود و در UI پیام «موسیقی پس‌زمینه ساخته نشد» نمایش داده می‌شود.

---

## 🚀 اجرا

```bash
npm install
npm run dev     # http://localhost:8080
```

برای build و deploy روی Liara با Docker:

```bash
docker build -t songai .
docker run -p 8080:8080 --env-file .env songai
```

---

## 🎵 خط لولهٔ تولید (Pipeline)

`runPipeline(jobId)` پنج مرحله را ترتیبی اجرا می‌کند:

1. **lyrics** — متن ترانه با Anthropic Claude
2. **music** — Stability / Suno / Riffusion / ElevenLabs → MP3 + کاور
3. **voice** — کلون و سنتز با ElevenLabs
4. **video** — (اختیاری) لب‌سینک با Creatify Aurora / HeyGen / Stability SVD
5. **finalize** — جمع‌بندی و علامت‌گذاری `done`

پیشرفت هر مرحله در SQLite ذخیره می‌شود و فرانت با Polling روی `/api/jobs/:id` آپدیت می‌شود.

---

## 🛠️ عیب‌یابی

### موسیقی پخش نمی‌شود
1. تب **Network** را باز کن و درخواست `…-music.mp3` را بررسی کن:
   - `200 OK` با `Content-Type: audio/mpeg` ✅
   - `404` → آپلود انجام نشده؛ لاگ سرور را چک کن (`[pipeline] music provider failed: …`).
2. در کنسول دنبال این خطوط بگرد:
   - `[stability] generated NNN bytes` → تولید موفق
   - `[pipeline] music ok` → آپلود موفق
   - `[music] attempt N failed` → فرانت در حال retry است
3. اگر پیام «موسیقی پس‌زمینه ساخته نشد» می‌بینی، یعنی `musicError` در job ست شده — متن خطا را داخل کارت نتیجه بخوان.
4. مطمئن شو `STABILITY_API_KEY` در Secrets فعال است و اعتبار حساب Stability کافی است.

### کلون صدا کار نمی‌کند
- نمونهٔ صدا باید حداقل ۱۵–۳۰ ثانیه و واضح باشد.
- اگر `ElevenLabs` خطا بدهد، fallback همان فایل آپلودی کاربر به‌عنوان «صدا» استفاده می‌شود.

### ویدیو ساخته نمی‌شود
- ویدیو فقط در صورت ست بودن `CREATIFY_API_KEY` و `VIDEO_PROVIDER=aurora` تولید می‌شود؛ در غیر این صورت خروجی فقط صوتی است.
- برای HeyGen: `HEYGEN_API_KEY` و `VIDEO_PROVIDER=heygen`
- برای Stability SVD: `STABILITY_API_KEY` و `VIDEO_PROVIDER=stability`

---

## 📦 خروجی نهایی

برای هر job در نهایت این فیلدها در `result` ست می‌شوند:

```ts
{
  lyrics?: string;       // متن ترانه
  audioUrl?: string;     // صدای کلون‌شدهٔ خوانش متن
  musicUrl?: string;     // موسیقی پس‌زمینه
  musicError?: string;   // علت نبود موسیقی (در صورت خطا)
  coverArtUrl?: string;  // کاور آهنگ
  videoUrl?: string;     // ویدیوی لب‌سینک (اختیاری)
}
```

پخش‌کنندهٔ نتیجه (`ResultView`) به‌صورت موازی `voice` و `music` را پخش می‌کند، با retry روی موسیقی و افت‌کردن خودکار اگر استریم موسیقی بیش از ۳ ثانیه stall کند — صدای اصلی همیشه پخش می‌شود.

---

## 📄 لایسنس

این پروژه برای استفادهٔ شخصی ساخته شده. هرگونه بازنشر محتوای تولیدشده با صدای دیگران نیاز به اجازهٔ صاحب صدا دارد.
