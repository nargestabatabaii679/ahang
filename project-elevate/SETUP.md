# راه‌اندازی و Deploy

## پیش‌نیازها
- Node.js 22+
- npm 10+

## اجرای محلی (Development)

```bash
cd project-elevate
npm install
npm run dev
```

سرور روی `http://localhost:3000` اجرا می‌شود.

## Deploy در Liara

### نصب اولیه (یک‌بار)

```bash
# نصب Liara CLI
npm install -g @liara/cli

# لاگین
liara login

# ایجاد اپ
liara app create --name songai --platform docker

# ایجاد Disk
liara disk create --app songai --name songai-data --size 1
liara disk create --app songai --name songai-media --size 5

# متغیرهای محیطی
liara env set --app songai \
  ANTHROPIC_API_KEY=sk-ant-... \
  ELEVENLABS_API_KEY=sk_... \
  STABILITY_API_KEY=sk-sb... \
  OPENROUTER_API_KEY=sk-or-v1-... \
  NODE_ENV=production
```

### Deploy (هر بار)

**از root پروژه (توصیه‌شده):**
```bash
liara deploy --app songai --port 3000 --no-cache
```

> ⚠️ حتماً `--no-cache` را بزن. بدون آن Liara از cache قدیمی استفاده می‌کنه و build fail می‌شه.

یا از داخل `project-elevate/`:
```bash
cd project-elevate
./deploy.sh
```

### Deploy خودکار با GitHub Actions

۱. از [console.liara.ir/profile/api-tokens](https://console.liara.ir/profile/api-tokens) API token بگیر
۲. در GitHub: **Settings → Secrets → Actions → New secret**
   - Name: `LIARA_TOKEN`  
   - Value: توکن
۳. Push به `main` → deploy خودکار

## متغیرهای محیطی

| متغیر | توضیح |
|-------|-------|
| ANTHROPIC_API_KEY | کلید Anthropic Claude |
| ELEVENLABS_API_KEY | کلید ElevenLabs |
| STABILITY_API_KEY | کلید Stability AI |
| AVALAI_API_KEY | کلید AvvalAI (fallback) |
| OPENROUTER_API_KEY | کلید OpenRouter (fallback) |
| PIPELINE_MOCK | true برای تست بدون API |
| MUSIC_PROVIDER | stability / elevenlabs / auto |

## معماری

- **Backend**: TanStack Start + Nitro (node-server preset)
- **Database**: SQLite (data/jobs.db) با WAL mode
- **Storage**: فایل‌سیستم محلی (public/media/)
