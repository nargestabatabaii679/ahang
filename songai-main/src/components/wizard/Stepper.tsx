"use client";

import { Check } from "@phosphor-icons/react";
import { cn, toFa } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  current: number; // 0-based
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-bold transition duration-300",
                  done && "border-tape bg-tape text-primary-foreground",
                  active &&
                    "border-tape bg-tape/15 text-tape shadow-[0_0_0_4px_hsl(38_78%_55%/0.16)]",
                  !done && !active && "border-border text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <span className="nums">{toFa(i + 1)}</span>}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-bold transition-colors sm:block",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "h-px w-6 transition-colors sm:w-10",
                  done ? "bg-tape" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
