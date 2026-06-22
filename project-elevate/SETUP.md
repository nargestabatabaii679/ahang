# راه‌اندازی project-elevate

## ۱. متغیرهای محیطی الزامی

فایل `.env` را باز کن و این مقادیر را پر کن:

### Supabase (ضروری — بدونش بک‌اند کار نمی‌کند)
```
SUPABASE_URL=https://<your-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from Supabase → Settings → API → service_role>
```
> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` را از داشبورد Supabase → Settings → API بگیر.

### پس از راه‌اندازی Supabase، migration ها را اجرا کن:
```bash
npx supabase db push
# یا مستقیم در SQL editor داشبورد Supabase بزن
```

---

## ۲. API های اختیاری (هر کدام که داری)

| سرویس | متغیر | کجا بگیری |
|--------|--------|-----------|
| **HeyGen** (ویدیوی آواتار) | `HEYGEN_API_KEY` + `HEYGEN_AVATAR_ID` + `HEYGEN_VOICE_ID` | app.heygen.com → Settings → API |
| **ElevenLabs** (کلون صدا) | `ELEVENLABS_API_KEY` | elevenlabs.io → Profile |
| **Creatify Aurora** (lipsync از عکس) | `CREATIFY_API_ID` + `CREATIFY_API_KEY` | creatify.ai |
| **Riffusion** (موسیقی) | `RIFFUSION_API_BASE=http://localhost:3013` | self-hosted |

---

## ۳. انتخاب provider ویدیو

در `.env` یکی از این‌ها را فعال کن:
```bash
VIDEO_PROVIDER=heygen   # آواتار HeyGen — نیاز به HEYGEN_* keys
VIDEO_PROVIDER=aurora   # lipsync از عکس — نیاز به CREATIFY_* keys
```

---

## ۴. بدون هیچ key — حالت mock

برای تست بدون هیچ API:
```bash
PIPELINE_MOCK=true
```
ترانه تولید می‌شود (از قالب محلی) ولی موسیقی و ویدیو placeholder خواهد بود.

---

## ۵. اجرای محلی

```bash
cd project-elevate
bun install
bun run dev
```

---

## مسیر کامل با API key های واقعی

```
کاربر فرم را پر می‌کند
  → POST /api/jobs (عکس + صدا آپلود، job ساخته می‌شود)
  → pipeline شروع می‌شود:
      ① lyrics   — ترانه فارسی (Lovable AI / قالب محلی)
      ② music    — موسیقی (Riffusion / Suno)
      ③ voice    — کلون صدا + TTS (ElevenLabs)
      ④ video    — ویدیوی آواتار (HeyGen) یا lipsync (Creatify)
      ⑤ finalize — ذخیره نهایی
  → کاربر نتیجه را دانلود / اشتراک می‌گذارد
  → لینک /gift/:id برای گیرنده
```
