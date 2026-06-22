import { useEffect, useState } from "react";
import { Sun, Moon, Palette } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";
type Palette = "mint" | "sunset" | "violet";

const PALETTES: { id: Palette; label: string; swatch: string; ring: string }[] = [
  { id: "mint",   label: "Mint",   swatch: "#2dd4a8", ring: "#73ffb8" },
  { id: "sunset", label: "Sunset", swatch: "#ff6b35", ring: "#ffd166" },
  { id: "violet", label: "Violet", swatch: "#a78bfa", ring: "#67e8f9" },
];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [palette, setPalette] = useState<Palette>("mint");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const t = (localStorage.getItem("songai:theme") as Theme) || "dark";
      const p = (localStorage.getItem("songai:palette") as Palette) || "mint";
      setTheme(t);
      setPalette(p);
    } catch {}
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-palette", palette);
    try {
      localStorage.setItem("songai:theme", theme);
      localStorage.setItem("songai:palette", palette);
    } catch {}
  }, [theme, palette]);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
      {open && (
        <div className="sticker-card animate-fade-up flex flex-col gap-2 p-3" role="dialog" aria-label="انتخاب پالت رنگ">
          <p className="font-counter text-[10px] uppercase tracking-widest opacity-70">پالت رنگ</p>
          <div className="flex gap-2">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                aria-label={`پالت ${p.label}`}
                aria-pressed={palette === p.id}
                className={cn(
                  "tap relative h-10 w-10 rounded-full border-2 transition",
                  palette === p.id ? "scale-110" : "opacity-80 hover:scale-105"
                )}
                style={{
                  background: p.swatch,
                  borderColor: palette === p.id ? p.ring : "transparent",
                  boxShadow: palette === p.id ? `0 0 18px ${p.ring}` : "none",
                }}
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
          className="tap grid h-11 w-11 place-items-center border-2 border-[var(--color-primary)] bg-[var(--color-card)] text-[var(--color-foreground)] shadow-[4px_4px_0_0_var(--color-primary)] transition hover:-translate-y-0.5"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" weight="fill" /> : <Moon className="h-5 w-5" weight="fill" />}
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="انتخاب پالت رنگ"
          aria-expanded={open}
          className="tap grid h-11 w-11 place-items-center border-2 border-[var(--color-accent)] bg-[var(--color-card)] text-[var(--color-foreground)] shadow-[4px_4px_0_0_var(--color-accent)] transition hover:-translate-y-0.5"
        >
          <Palette className="h-5 w-5" weight="fill" />
        </button>
      </div>
    </div>
  );
}
