import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert latin digits in a string/number to Persian digits. */
export function toFa(value: string | number): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return String(value).replace(/\d/g, (d) => fa[Number(d)]);
}
