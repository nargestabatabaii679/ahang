import { CreateFlow } from "@/components/wizard/CreateFlow";

export const metadata = {
  title: "ساختن هدیه · songai",
};

export default function CreatePage() {
  return (
    <main id="main" className="relative min-h-dvh py-12 sm:py-16">
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-thread/10 blur-3xl" />
      <div className="container relative">
        <CreateFlow />
      </div>
    </main>
  );
}
