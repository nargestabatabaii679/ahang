
import { motion } from "framer-motion";
import { Check, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface Option<T extends string> {
  value: T;
  label: string;
  icon?: Icon;
}

interface OptionGridProps<T extends string> {
  options: Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
  columns?: 2 | 3;
}

export function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
}: OptionGridProps<T>) {
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const idx = options.findIndex((o) => o.value === value);
    let next = idx;
    // RTL: ArrowLeft moves forward visually, ArrowRight backward
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = (idx + 1 + options.length) % options.length;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = (idx - 1 + options.length) % options.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = options.length - 1;
    if (next < 0) next = 0;
    onChange(options[next].value);
  };

  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"
      )}
      role="radiogroup"
      onKeyDown={handleKey}
    >
      {options.map((o) => {
        const active = value === o.value;
        const Icon = o.icon;
        return (
          <motion.button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (!value && options[0].value === o.value) ? 0 : -1}
            onClick={() => onChange(o.value)}
            whileTap={{ scale: 0.94 }}
            whileHover={{ y: -2, x: -2 }}
            animate={active ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
            className={cn(
              "group tap relative flex min-h-[56px] items-center gap-3 border-2 p-4 text-right transition-colors duration-200",
              active
                ? "border-[var(--color-accent)] bg-[var(--color-primary)]/10 text-[var(--color-foreground)] shadow-[5px_5px_0_0_var(--color-accent)]"
                : "border-[var(--color-primary)]/30 bg-[var(--color-card)] text-[var(--color-foreground)]/85 hover:border-[var(--color-accent)]/60 hover:shadow-[4px_4px_0_0_var(--color-primary)]"
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  active ? "text-[var(--color-accent)]" : "text-[var(--color-muted-foreground)]"
                )}
                weight={active ? "fill" : "regular"}
                aria-hidden="true"
              />
            )}
            <span className="text-sm font-black">{o.label}</span>
            {active && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="pointer-events-none absolute left-2 top-2 grid h-5 w-5 place-items-center bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                aria-hidden="true"
              >
                <Check className="h-3 w-3" weight="bold" />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

