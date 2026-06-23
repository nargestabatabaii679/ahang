# راه‌اندازی و Deploy

## پیش‌نیازها
- Node.js 22+
- npm 10+

## اجرای محلی (Development)

```bash
npm install
npm run dev
```

سرور روی `http://localhost:3000` اجرا می‌شود.

## Build برای Production (Node.js)

```bash
npm install
npm run build   # NITRO_PRESET=node-server به‌صورت خودکار اعمال می‌شود
npm run start   # راه‌اندازی سرور Node.js روی پورت 3000
```

## Deploy در Liara

```bash
# نصب Liara CLI
npm install -g @liara/cli

# لاگین
liara login

# ایجاد اپ (یکبار)
liara app create --name songai --platform docker

# ایجاد Disk برای فایل‌های دائمی (یکبار)
liara disk create --app songai --name songai-data --size 1
liara disk create --app songai --name songai-media --size 5

# تنظیم متغیرهای محیطی
liara env set --app songai \
  ANTHROPIC_API_KEY=sk-ant-... \
  ELEVENLABS_API_KEY=sk_... \
  STABILITY_API_KEY=sk-sb... \
  OPENROUTER_API_KEY=sk-or-v1-... \
  NODE_ENV=production

# Deploy
liara deploy --app songai --port 3000
```

## متغیرهای محیطی

| متغیر | توضیح |
|-------|-------|
| ANTHROPIC_API_KEY | کلید Anthropic Claude (اولویت اول برای ترانه) |
| ELEVENLABS_API_KEY | کلید ElevenLabs برای کلون صدا + موزیک |
| STABILITY_API_KEY | کلید Stability AI برای موزیک و کاور |
| AVALAI_API_KEY | کلید AvvalAI (fallback داخل ایران) |
| OPENROUTER_API_KEY | کلید OpenRouter (fallback سوم) |
| PIPELINE_MOCK | true برای تست بدون API |
| MUSIC_PROVIDER | stability / elevenlabs / auto (پیش‌فرض: auto) |

## معماری

- **Backend**: TanStack Start + Nitro (node-server preset)
- **Database**: SQLite (data/jobs.db) با WAL mode
- **Storage**: فایل‌سیستم محلی (public/media/)
- **AI**: Anthropic → AvvalAI → OpenRouter → local fallback
- **Music**: Stability Audio 2.0 → ElevenLabs Sound → skip
- **Voice**: ElevenLabs Instant Voice Cloning
- **Cover Art**: Stability AI SD3.5
