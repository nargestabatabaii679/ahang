"use client";

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
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"
      )}
      role="radiogroup"
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
            onClick={() => onChange(o.value)}
            whileTap={{ scale: 0.94 }}
            animate={active ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
            className={cn(
              "group relative flex min-h-[52px] items-center gap-3 rounded-2xl border p-4 text-right transition-colors duration-200",
              active
                ? "border-thread/60 bg-gradient-to-l from-tape/15 to-thread/15 text-foreground shadow-[0_10px_30px_-14px_hsl(7_90%_60%/0.5)]"
                : "border-border bg-white/[0.02] text-foreground/80 hover:border-thread/30 hover:bg-white/[0.04]"
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  active ? "text-tape" : "text-muted-foreground"
                )}
                weight="regular"
                aria-hidden="true"
              />
            )}
            <span className="text-sm font-bold">{o.label}</span>
            {active && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="pointer-events-none absolute left-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-tape to-thread text-primary-foreground"
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
