import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-28 w-full rounded-2xl border border-input bg-white/[0.03] px-4 py-3 text-sm leading-7 text-foreground transition-colors placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-tape/60 focus-visible:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-tape/15 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
