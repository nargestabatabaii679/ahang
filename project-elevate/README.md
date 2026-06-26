# songai

ساخت آهنگ هدیه با **صدای کلون‌شدهٔ کاربر** + موسیقی پس‌زمینهٔ تولیدشده توسط هوش مصنوعی + (اختیاری) ویدیوی لب‌سینک از روی عکس. رابط کاربری کاملاً فارسی (RTL).

> «یه آهنگ، با صدای خودِ تو، فقط برای یک نفر خاص.»

---

## ویژگی‌ها

- نوشتن خودکار متن ترانهٔ فارسی با **Anthropic Claude**
- تولید موسیقی پس‌زمینه با **Stability Audio 2.0** / **Suno** / **Riffusion** / **ElevenLabs**
- کلون صدای کاربر از روی ۱۵–۳۰ ثانیه نمونه با **ElevenLabs**
- خوانش ترانه با صدای کلون‌شده (Text-to-Speech چندزبانه)
- ساخت ویدیوی لب‌سینک از روی عکس با **Creatify Aurora** / **HeyGen** / **Stability SVD**
- تولید کاور آرت اختصاصی با **Stable Diffusion 3.5**
- اشتراک‌گذاری از طریق واتس‌اپ، تلگرام، اینستاگرام
- دانلود ویدیو، صدا، و موسیقی
- خروجی «کیپ‌سیک» (متن ترانه به صورت HTML قابل چاپ)
- بدون نیاز به ثبت‌نام

---

## معماری

```
Frontend/SSR  →  TanStack Start v1 + React 19 + Vite 7
Styling       →  Tailwind CSS v4 (CSS variables)
Backend       →  TanStack createServerFn + Server Routes
Database      →  SQLite (better-sqlite3) — فایل jobs.db
Storage       →  Local filesystem (/app/public/media/)
Runtime       →  Node.js 22 + Docker + Liara (nitro: node-server)
CI/CD         →  GitHub Actions → Liara CLI
```

### ساختار فایل‌ها

```
project-elevate/
├── src/
│   ├── routes/
│   │   ├── index.tsx                  # صفحه اصلی
│   │   ├── create.tsx                 # ویزارد ساخت آهنگ
│   │   ├── gift.$id.tsx               # صفحه نمایش هدیه
│   │   ├── privacy.tsx
│   │   ├── terms.tsx
│   │   └── api/
│   │       ├── jobs.ts                # POST /api/jobs
│   │       ├── jobs.$id.ts            # GET  /api/jobs/:id
│   │       └── jobs.$id.keepsake.ts   # GET  /api/jobs/:id/keepsake
│   ├── components/
│   │   ├── wizard/
│   │   │   ├── CreateFlow.tsx         # کنترلر ویزارد ۳ مرحله‌ای
│   │   │   ├── Stepper.tsx
│   │   │   ├── OptionGrid.tsx
│   │   │   ├── PhotoUpload.tsx
│   │   │   └── VoiceInput.tsx
│   │   ├── generation/
│   │   │   └── GenerationView.tsx     # نمایش پیشرفت با polling
│   │   └── result/
│   │       └── ResultView.tsx         # پخش‌کننده + دانلود + اشتراک‌گذاری
│   └── lib/
│       ├── pipeline.server.ts         # ارکستراسیون ۵ مرحله‌ای تولید
│       ├── jobs-store.server.ts       # CRUD روی SQLite
│       ├── storage.server.ts          # ذخیره فایل روی دیسک
│       ├── types.ts                   # تایپ‌های Job، SongBrief، Stage
│       └── providers/
│           ├── lyrics.ts              # Anthropic Claude
│           ├── elevenlabs.ts          # کلون صدا + TTS + موسیقی
│           ├── stability.ts           # موسیقی + کاور آرت + SVD
│           ├── suno.ts                # موسیقی (Suno)
│           ├── riffusion.ts           # موسیقی (Riffusion)
│           ├── creatify.ts            # ویدیو لب‌سینک (Aurora)
│           ├── heygen.ts              # ویدیو آواتار (HeyGen)
│           └── keepsake.ts            # رندر HTML کیپ‌سیک
├── Dockerfile
├── liara.json
└── .github/workflows/deploy.yml
```

---

## خط لوله تولید (Pipeline)

`runPipeline(jobId)` پنج مرحله را به‌ترتیب اجرا می‌کند:

```
1. lyrics    (20%)  →  متن ترانهٔ فارسی با Claude
                       fallback: AvvalAI → OpenRouter → template ثابت

2. music     (20%)  →  موسیقی پس‌زمینه MP3 + کاور آرت JPEG
                       fallback chain: Stability → Suno → Riffusion → ElevenLabs

3. voice     (35%)  →  کلون صدا از نمونهٔ کاربر (ElevenLabs Instant Clone)
                       → خوانش ترانه با صدای کلون‌شده (eleven_multilingual_v2)
                       → حذف صدای کلون‌شده بعد از ساخت (پاکسازی)
                       fallback: فایل اصلی آپلودی کاربر

4. video     (20%)  →  (اختیاری) ویدیوی لب‌سینک: عکس + صدا → MP4
                       Creatify Aurora → HeyGen Avatar V → Stability SVD

5. finalize  (5%)   →  ثبت نهایی وضعیت done در SQLite
```

پیشرفت هر مرحله بلادرنگ در SQLite ذخیره می‌شود. فرانت هر ۳ ثانیه روی `GET /api/jobs/:id` polling می‌کند.

---

## متغیرهای محیطی

### الزامی

| متغیر | کاربرد |
|-------|--------|
| `ANTHROPIC_API_KEY` | تولید متن ترانه (Claude Haiku) |
| `ELEVENLABS_API_KEY` | کلون صدا و Text-to-Speech |

### موسیقی (حداقل یکی)

| متغیر | کاربرد |
|-------|--------|
| `STABILITY_API_KEY` | موسیقی Stable Audio 2.0 + کاور SD3.5 + ویدیو SVD |
| `SUNO_API_BASE` | آدرس سرور Suno (مثلاً `http://localhost:3000`) |
| `SUNO_API_KEY` | کلید Suno (اختیاری) |
| `RIFFUSION_API_BASE` | آدرس سرور Riffusion |
| `MUSIC_PROVIDER` | انتخاب دستی: `stability` / `suno` / `riffusion` / `elevenlabs` / `none` |

> اگر هیچ provider موسیقی تنظیم نشده باشد، آهنگ فقط شامل صدای کلون‌شده خواهد بود.

### ویدیو (اختیاری — یکی)

| متغیر | کاربرد |
|-------|--------|
| `VIDEO_PROVIDER` | `aurora` (پیش‌فرض) / `heygen` / `stability` / `none` |
| `CREATIFY_API_ID` | شناسهٔ Creatify |
| `CREATIFY_API_KEY` | کلید Creatify Aurora |
| `HEYGEN_API_KEY` | کلید HeyGen |
| `HEYGEN_AVATAR_ID` | شناسهٔ آواتار HeyGen |
| `HEYGEN_VOICE_ID` | شناسهٔ صدای HeyGen |

### جایگزین‌های متن ترانه

| متغیر | کاربرد |
|-------|--------|
| `AVALAI_API_KEY` | کلید AvvalAI (سازگار با OpenAI، داخل ایران) |
| `AVALAI_API_BASE` | آدرس پایه AvvalAI |
| `OPENROUTER_API_KEY` | کلید OpenRouter (fallback دوم) |

### تنظیمات دیگر

| متغیر | کاربرد |
|-------|--------|
| `ELEVENLABS_API_BASE` | آدرس پایه ElevenLabs (پیش‌فرض: `api.elevenlabs.io`) |
| `PIPELINE_MOCK` | `true` برای تست بدون فراخوانی واقعی API |
| `NODE_ENV` | `production` در محیط Docker |

---

## نصب و اجرا

### محلی (Development)

```bash
cd project-elevate
npm install
cp .env.example .env   # مقادیر کلیدها را پر کن
npm run dev            # http://localhost:8080
```

### build برای production

```bash
npm run build
# خروجی در .output/
npm start              # اجرا روی پورت 3000
```

### Docker (محلی)

```bash
# ابتدا build کن
npm run build

# سپس image بساز و اجرا کن
docker build -t songai .
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=... \
  -e ELEVENLABS_API_KEY=... \
  -e STABILITY_API_KEY=... \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/public/media:/app/public/media \
  songai
```

---

## Deploy روی Liara

### پیش‌نیازها

۱. در [Liara](https://liara.ir) یک اپ با پلتفرم **Docker** و نام `songai` بساز
۲. secret `LIARA_TOKEN` را در GitHub تنظیم کن
۳. متغیرهای محیطی را در Liara Console → Environment Variables وارد کن

### deploy خودکار (GitHub Actions)

هر push روی شاخهٔ `main` که فایل‌های `project-elevate/**` را تغییر دهد، به‌صورت خودکار deploy می‌شود:

```
push to main
    → npm ci
    → npm run build  (NITRO_PRESET=node-server)
    → liara deploy --app songai
```

### deploy دستی

```bash
npm install -g @liara/cli
liara login
cd project-elevate
npm run build
liara deploy --app songai --port 3000
```

### disk های مورد نیاز

برای ماندگاری داده‌ها (پایگاه داده و فایل‌های رسانه) باید دو disk در Liara بسازی:

```bash
liara disk create --name songai-data  --app songai --size 1
liara disk create --name songai-media --app songai --size 1
```

سپس در `liara.json`:

```json
{
  "platform": "docker",
  "port": 3000,
  "app": "songai",
  "disks": [
    { "name": "songai-data",  "mountTo": "/app/data" },
    { "name": "songai-media", "mountTo": "/app/public/media" }
  ]
}
```

---

## API

### `POST /api/jobs`

ایجاد یک job جدید.

**Body (multipart/form-data یا JSON):**

```ts
{
  recipientName: string       // نام دریافت‌کننده (max 60 کاراکتر)
  relationship: "partner" | "family" | "friend" | "coworker" | "special" | "other"
  relationshipOther?: string  // اگر relationship = "other" (max 40 کاراکتر)
  occasion: "birthday" | "anniversary" | "appreciation" | "apology" | "celebration" | "none"
  genre: "romantic" | "emotional" | "happy" | "calm" | "motivational" | "nostalgic"
  aboutText?: string          // توضیحات بیشتر (max 600 کاراکتر)
  photoUrl: string            // URL عکس دریافت‌کننده
  voiceUrl: string            // URL نمونهٔ صدای کاربر (۱۵–۳۰ ثانیه)
  consent: boolean            // رضایت برای استفادهٔ AI از عکس و صدا
}
```

**Response:**

```json
{ "id": "a3f1b2c4d5e6" }
```

---

### `GET /api/jobs/:id`

وضعیت job.

**Response:**

```ts
{
  id: string
  status: "queued" | "running" | "done" | "error"
  progress: number  // 0 تا 100
  stages: Array<{
    id: "lyrics" | "music" | "voice" | "video" | "finalize"
    status: "pending" | "running" | "done" | "error"
  }>
  result?: {
    lyrics?: string
    audioUrl?: string
    musicUrl?: string
    musicError?: string
    coverArtUrl?: string
    videoUrl?: string
  }
  error?: string
  createdAt: number  // Unix timestamp (ms)
}
```

---

### `GET /api/jobs/:id/keepsake`

HTML قابل چاپ از متن ترانه (فقط وقتی `status = done`).

---

## عیب‌یابی

### اپ بالا نمی‌آید

```bash
# لاگ‌های Liara را ببین
liara logs --app songai
```

دنبال این خطا بگرد:
- `better-sqlite3` → مطمئن شو از image `node:22-bookworm-slim` استفاده می‌شود (نه Alpine)
- `ENOENT /app/data` → disk را mount کن (بخش «disk های مورد نیاز» را ببین)

---

### موسیقی پخش نمی‌شود

۱. تب Network مرورگر را باز کن و درخواست `…-music.mp3` را بررسی کن:
   - `200 OK` با `Content-Type: audio/mpeg` → درست است
   - `404` → آپلود انجام نشده؛ لاگ سرور را چک کن
۲. در لاگ سرور دنبال این بگرد:
   - `[stability] generated NNN bytes` → تولید موفق بود
   - `[pipeline] music provider failed` → provider خطا داد
۳. اگر پیام «موسیقی پس‌زمینه ساخته نشد» نمایش می‌دهد، `musicError` را در job result بخوان
۴. اعتبار `STABILITY_API_KEY` را بررسی کن

---

### کلون صدا کار نمی‌کند

- نمونهٔ صدا باید حداقل ۱۵–۳۰ ثانیه، واضح، و بدون نویز پس‌زمینه باشد
- فرمت‌های قابل قبول: MP3، WAV، M4A، OGG
- اگر ElevenLabs خطا بدهد، فایل اصلی آپلودی کاربر به‌عنوان fallback استفاده می‌شود

---

### ویدیو ساخته نمی‌شود

- **Aurora**: نیاز به `CREATIFY_API_ID` + `CREATIFY_API_KEY` + `VIDEO_PROVIDER=aurora`
- **HeyGen**: نیاز به `HEYGEN_API_KEY` + `HEYGEN_AVATAR_ID` + `VIDEO_PROVIDER=heygen`
- **SVD**: نیاز به `STABILITY_API_KEY` + `VIDEO_PROVIDER=stability`
- تولید ویدیو تا ۱۰ دقیقه طول می‌کشد (polling هر ۱۰ ثانیه)
- اگر ویدیو شکست بخورد، pipeline ادامه پیدا می‌کند و خروجی فقط صوتی خواهد بود

---

### خطای deploy در Liara

```
Error: Deployment failed.
```

احتمالاً مشکل موقتی شبکه یا token منقضی‌شده است:

```bash
# دوباره امتحان کن
liara deploy --app songai --port 3000 --debug

# یا token را تجدید کن
liara login
```

---

## ساختار داده‌ها

### SongBrief (ورودی کاربر)

```ts
{
  recipientName: string
  relationship: "partner" | "family" | "friend" | "coworker" | "special" | "other"
  relationshipOther?: string
  occasion: "birthday" | "anniversary" | "appreciation" | "apology" | "celebration" | "none"
  genre: "romantic" | "emotional" | "happy" | "calm" | "motivational" | "nostalgic"
  aboutText?: string
  photoUrl: string
  voiceUrl: string
  consent: boolean
}
```

### Job (وضعیت پردازش)

```ts
{
  id: string           // 12 کاراکتر hex
  status: "queued" | "running" | "done" | "error"
  brief: SongBrief
  stages: StageState[]
  progress: number     // 0..100
  error?: string
  result: {
    lyrics?: string
    audioUrl?: string      // صدای کلون‌شده + ترانه (MP3)
    musicUrl?: string      // موسیقی پس‌زمینه (MP3)
    musicError?: string    // علت نبود موسیقی
    coverArtUrl?: string   // کاور آرت (JPEG)
    videoUrl?: string      // ویدیوی لب‌سینک (MP4)
  }
  createdAt: number    // Unix timestamp (ms)
}
```

### جدول SQLite

```sql
CREATE TABLE jobs (
  id         TEXT PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'queued',
  brief      TEXT NOT NULL,   -- JSON
  stages     TEXT NOT NULL,   -- JSON
  progress   INTEGER NOT NULL DEFAULT 0,
  error      TEXT,
  result     TEXT NOT NULL DEFAULT '{}',  -- JSON
  created_at INTEGER NOT NULL             -- Unix ms
);
```

---

## لایسنس

این پروژه برای استفادهٔ شخصی ساخته شده. هرگونه بازنشر محتوای تولیدشده با صدای دیگران نیاز به اجازهٔ صریح صاحب صدا دارد.
