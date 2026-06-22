import { createFileRoute, Link } from "@tanstack/react-router";
import { MusicNotes } from "@phosphor-icons/react";
import { CreateFlow } from "@/components/wizard/CreateFlow";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "ساختن هدیه · songai" },
      { name: "description", content: "ویزارد ساخت هدیهٔ شخصی با صدای خودت." },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  return (
    <main id="main" className="relative min-h-dvh py-12 sm:py-16">
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-[var(--color-primary)]/15 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-10 right-0 h-64 w-64 rounded-full bg-[var(--color-accent)]/10 blur-[100px]" />

      {/* Nav */}
      <header className="container mb-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-75">
          <span aria-hidden className="grid h-9 w-9 place-items-center border-2 border-[var(--color-accent)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[3px_3px_0_0_var(--color-accent)]">
            <MusicNotes className="h-4 w-4" weight="fill" />
          </span>
          <span className="font-display text-xl tracking-tighter text-[var(--color-primary)]">SONGAI</span>
        </Link>
        <p className="font-counter text-[11px] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">
          ساختن هدیه
        </p>
      </header>

      <div className="container relative">
        <CreateFlow />
      </div>
    </main>
  );
}
