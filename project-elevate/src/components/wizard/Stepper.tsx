
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
        const tilt = i % 2 === 0 ? "-rotate-2" : "rotate-2";
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-3">
            <div className={cn("flex items-center gap-2 transition-transform", tilt)}>
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center border-2 text-sm font-black transition duration-300",
                  done && "border-[#06121b] bg-[#73ffb8] text-[#06121b] shadow-[3px_3px_0_0_#2dd4a8]",
                  active &&
                    "border-[#73ffb8] bg-[#2dd4a8] text-[#06121b] shadow-[3px_3px_0_0_#73ffb8] animate-neon-pulse",
                  !done && !active && "border-[#2dd4a8]/40 bg-transparent text-[#8fb0a7]"
                )}
              >
                {done ? <Check className="h-4 w-4" weight="bold" /> : <span className="nums">{toFa(i + 1)}</span>}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-black uppercase tracking-wider transition-colors sm:block",
                  active ? "text-[#73ffb8]" : done ? "text-[#2dd4a8]" : "text-[#8fb0a7]"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "h-0.5 w-6 transition-colors sm:w-10",
                  done ? "bg-[#73ffb8]" : "bg-[#2dd4a8]/25"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
