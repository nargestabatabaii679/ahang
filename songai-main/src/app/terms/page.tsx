import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "شرایط استفاده · songai",
};

export default function TermsPage() {
  return (
    <main className="container max-w-2xl py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به خانه
      </Link>

      <h1 className="font-display mt-6 text-3xl">شرایط استفاده</h1>
      <p className="mt-2 text-sm text-muted-foreground">آخرین به‌روزرسانی: تیر ۱۴۰۴</p>

      <div className="mt-8 space-y-6 text-sm leading-8 text-foreground/85">
        <section>
          <h2 className="text-base font-bold text-foreground">اجازهٔ استفاده از صدا</h2>
          <p className="mt-2">
            با آپلود نمونهٔ صدا، تأیید می‌کنید که خودِ آن فرد اجازهٔ این کار را داده، یا صدای خودتان
            است. ساختن آهنگ با صدای کسی بدون اجازه‌اش مجاز نیست.
          </p>
        </section>
        <section>
          <h2 className="text-base font-bold text-foreground">مالکیت نتیجهٔ نهایی</h2>
          <p className="mt-2">
            آهنگ، ویدیو و متن ترانه‌ای که ساخته می‌شود، مال شماست و می‌توانید آزادانه دانلودش کنید
            و به اشتراک بگذارید.
          </p>
        </section>
        <section>
          <h2 className="text-base font-bold text-foreground">محدودیت‌ها</h2>
          <p className="mt-2">
            استفاده از این سرویس برای ساخت محتوای آزاردهنده، توهین‌آمیز یا جعل صدای افراد مشهور
            بدون اجازه ممنوع است و می‌تواند به قطع دسترسی منجر شود.
          </p>
        </section>
        <section>
          <h2 className="text-base font-bold text-foreground">تماس</h2>
          <p className="mt-2">برای هر سوالی دربارهٔ این شرایط، با ما در ارتباط باشید.</p>
        </section>
      </div>
    </main>
  );
}
