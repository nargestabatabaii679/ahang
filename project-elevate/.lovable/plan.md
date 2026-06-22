
## هدف
ارتقای تجربه بصری و دسترسی‌پذیری اپ songai با حفظ هویت Neon Sticker-Pack، بدون تغییر منطق سرور/پایپ‌لاین.

## ۱. دسترسی‌پذیری (a11y)
- افزودن `:focus-visible` سراسری در `styles.css`: حلقه ۲px با `--color-accent` + offset ۲px روی همه عناصر تعاملی (button, a, input, [role]).
- اطمینان از `aria-label` فارسی روی همه دکمه‌های آیکون‌محور (Stepper، Player، Upload، VoiceInput).
- افزودن `<a href="#main" class="sr-only focus:not-sr-only">پرش به محتوا</a>` در `__root.tsx`.
- بازنگری کنتراست: تغییر `--color-muted-foreground` از `#8fb0a7` به `#a8c8be` (AA روی bg تیره).
- ناوبری کیبورد در `OptionGrid`: استفاده از `role="radiogroup"` + `aria-checked` + پیمایش با Arrow Keys.
- اضافه‌کردن `aria-live="polite"` به `GenerationView` برای اعلام مرحله فعلی.
- `aria-hidden` روی Waveform و استیکرهای تزئینی.

## ۲. ری‌دیزاین کارت نتیجه و گیفت (Sticker-Pack)
بازنویسی `ResultView.tsx` و `gift.$id.tsx`:
- بنر بالای صفحه: کارت بزرگ `sticker-card-lime` با چرخش `-rotate-1`، تیتر "YOUR GIFT IS READY" به Archivo Black + زیرنویس فارسی.
- کاور آلبوم: مربع ۲۸۰px با border ۳px primary و shadow هارد، استیکر چرخان "PLAY" در گوشه.
- پلیر دایره‌ای مرکزی با حلقه پالس نئون (`animate-neon-pulse`) و دکمه play بزرگ ۸۰px (تارگت لمسی).
- متن ترانه در کارت `sticker-card` جدا با ۲° rotation، فونت Vazirmatn، line-height بازتر.
- چیپ‌های متادیتا (مدت، سبک، صدا) با `.sticker-chip`.
- دو CTA: «ارسال به واتس‌اپ» (neon-cta) + «دانلود کیپ‌سیک» (outline neon).
- صفحه `/gift/:id` همان لِی‌اوت + استیکر «تقدیم به تو» بالا.

## ۳. تایپوگرافی و فاصله‌گذاری موبایل
- مقیاس fluid در `styles.css`:
  - h1: `clamp(2rem, 8vw, 4.5rem)`
  - h2: `clamp(1.5rem, 5vw, 2.5rem)`
  - body: `clamp(0.95rem, 2.6vw, 1.05rem)`
  - line-height فارسی: `1.85` در body، `1.1` در display.
- padding کانتینر موبایل: `1rem` (از `1.5rem` کم می‌شود).
- gap عمودی بخش‌ها: `clamp(3rem, 8vw, 6rem)`.
- روی موبایل چرخش استیکرها به `±1°` کاهش (mq `max-width: 640px`).
- min tap target: ۴۴×۴۴ روی همه دکمه‌های آیکون.

## ۴. میکرواینترکشن‌های ویزارد
- `Stepper`: انیمیشن انتقال چیپ فعال با `transition: transform/box-shadow 300ms cubic-bezier(.34,1.56,.64,1)` + bounce کوتاه روی mount.
- `OptionGrid`: روی hover کارت ها `translate(-2px,-2px)` + shadow عمیق‌تر؛ روی انتخاب، فلش چک‌مارک با `scale-in`.
- `PhotoUpload`: drag-over → border نئون پالس + متن «رهاش کن!».
- `VoiceInput`: حین ضبط، eq-bar های زنده روی دکمه + ripple دایره‌ای قرمز پالس.
- انتقال بین مراحل: `fade-up` ۳۰۰ms + جابجایی افقی ملایم (RTL: از چپ).
- دکمه «مرحله بعد» با حالت disabled→enabled با گلو نئونی.
- همه انیمیشن‌ها داخل `@media (prefers-reduced-motion: reduce)` غیرفعال.

## ۵. حالت تاریک + سوئیچ پالت رنگی
- پیش‌فرض dark (همین حالا). افزودن light theme با همان ساختار توکن:
  - light: bg `#f3fbf7`, fg `#0d1b2a`, card `#ffffff`, primary `#0fc78f`, accent `#2dd4a8`.
- اضافه‌کردن کلاس `.theme-light` در `<html>` با `@custom-variant`.
- دو پالت جایگزین برای سوئیچ:
  1. **Mint** (پیش‌فرض فعلی)
  2. **Sunset** (`--color-primary: #ff6b35`, `--color-accent: #ffd166`)
  3. **Violet** (`--color-primary: #a78bfa`, `--color-accent: #67e8f9`)
- ذخیره انتخاب در `localStorage` (`songai:theme`, `songai:palette`).
- کامپوننت جدید `src/components/ThemeSwitcher.tsx`: دکمه شناور پایین-چپ با ۲ آیکون (sun/moon) و سه نقطه رنگ. باز کردن popover با ۳ دایره پالت.
- اعمال سمت کلاینت با `data-theme` و `data-palette` روی `<html>`؛ توکن‌ها در `styles.css` با selector `:root[data-palette="sunset"] { ... }`.
- جلوگیری از FOUC: اسکریپت inline کوچک در `__root.tsx` head که قبل از hydration کلاس را می‌چیند.

## ۶. تغییرات صفحه اصلی
- حذف کامل متن/استیکر «ویژه نسل Z» از `src/routes/index.tsx`.
- بالا بردن المان‌های موسیقی به Hero:
  - Waveform زنده تمام‌عرض پشت تیتر (نیمه‌شفاف).
  - استیکر گرد چرخان دیسک وینیل بالا-راست.
  - eq-bar های متحرک کنار CTA.
  - کارت پیش‌نمایش پلیر (آلبوم آرت + کنترل) به‌جای کارت معرفی نسل.
- ترتیب جدید: Hero (موسیقی غالب) → How it works → نمونه گیفت → CTA پایانی.

## فایل‌های تحت تأثیر
```text
src/styles.css                          (توکن‌ها، تم‌ها، focus ring، typography fluid)
src/routes/__root.tsx                   (skip link، theme bootstrap script)
src/routes/index.tsx                    (حذف Gen-Z، تقویت موسیقی hero)
src/components/ThemeSwitcher.tsx        (جدید)
src/components/result/ResultView.tsx    (بازنویسی sticker-pack)
src/routes/gift.$id.tsx                 (هماهنگ‌سازی با ResultView)
src/components/wizard/Stepper.tsx       (میکرواینترکشن + a11y)
src/components/wizard/OptionGrid.tsx    (radiogroup + کیبورد + hover)
src/components/wizard/PhotoUpload.tsx   (drag micro-interactions)
src/components/wizard/VoiceInput.tsx    (ripple + eq زنده)
src/components/wizard/CreateFlow.tsx    (انتقال بین مراحل)
src/components/generation/GenerationView.tsx (aria-live)
src/components/Waveform.tsx             (پشتیبانی از prefers-reduced-motion، prop opacity)
```

## خارج از محدوده
- بدون تغییر در `lib/providers/*`, `pipeline.server.ts`, `api/*`, migration ها، یا منطق ذخیره‌سازی.
- بدون افزودن کتابخانه جدید (تمام انیمیشن‌ها با Tailwind + CSS).

## اعتبارسنجی
- Playwright: اسکرین‌شات `/`, `/create`, `/gift/demo` در viewport های 375 و 1280.
- تست کیبورد: Tab روی index و create، رؤیت حلقه فوکوس.
- بررسی console برای خطا و a11y warnings.
- سوئیچ تم/پالت و رفرش → ماندگاری حالت.
