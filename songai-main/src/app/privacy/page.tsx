import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "حریم خصوصی · songai",
};

export default function PrivacyPage() {
  return (
    <main className="container max-w-2xl py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به خانه
      </Link>

      <h1 className="font-display mt-6 text-3xl">حریم خصوصی</h1>
      <p className="mt-2 text-sm text-muted-foreground">آخرین به‌روزرسانی: تیر ۱۴۰۴</p>

      <div className="mt-8 space-y-6 text-sm leading-8 text-foreground/85">
        <section>
          <h2 className="text-base font-bold text-foreground">چه چیزی از شما می‌گیریم</h2>
          <p className="mt-2">
            برای ساختن هر هدیه، یک عکس و یک نمونه‌صدا از کسی که برایش می‌سازید آپلود می‌کنید،
            به‌علاوهٔ نام، مناسبت، سبک موسیقی و پیام دلخواه شما. این‌ها فقط برای ساخت همان آهنگ
            استفاده می‌شوند.
          </p>
        </section>
        <section>
          <h2 className="text-base font-bold text-foreground">چقدر نگه‌داری می‌شود</h2>
          <p className="mt-2">
            فایل‌های صدا و عکس برای مدت پردازش سفارش روی سرور نگه‌داری می‌شوند. نمونهٔ صدای
            کلون‌شده بلافاصله بعد از تولید ترانه حذف می‌شود.
          </p>
        </section>
        <section>
          <h2 className="text-base font-bold text-foreground">با چه کسی به اشتراک گذاشته می‌شود</h2>
          <p className="mt-2">
            فایل صدا و عکس شما برای ساخت آهنگ و ویدیو به سرویس‌های پردازش صوت و تصویری که با آن‌ها
            کار می‌کنیم ارسال می‌شود؛ این اطلاعات هرگز برای تبلیغات یا هیچ هدف دیگری فروخته نمی‌شود.
          </p>
        </section>
        <section>
          <h2 className="text-base font-bold text-foreground">حذف اطلاعات</h2>
          <p className="mt-2">
            هر زمان بخواهید می‌توانید درخواست حذف کامل اطلاعات خود را بدهید.
          </p>
        </section>
      </div>
    </main>
  );
}
