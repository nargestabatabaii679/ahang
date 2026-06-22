
import { useEffect, useRef, useState } from "react";
import { Image, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  file: File | null;
  onChange: (f: File | null) => void;
}

export function PhotoUpload({ file, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Create the object URL exactly once per file, and revoke it on cleanup
  // to avoid leaking blob memory (the previous implementation re-created
  // a new URL on every render without ever revoking the old one).
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f?: File | null) => {
    if (f && f.type.startsWith("image/")) onChange(f);
  };

  return (
    <div>
      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="انتخاب یا کشیدن عکس"
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed p-10 text-center transition duration-300",
            drag
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 animate-neon-pulse"
              : "border-[var(--color-primary)]/40 bg-[var(--color-card)] hover:border-[var(--color-accent)]/60 hover:-translate-y-0.5"
          )}
        >
          <span aria-hidden className="grid h-14 w-14 place-items-center bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[3px_3px_0_0_var(--color-accent)]">
            <Image className="h-7 w-7" weight="fill" />
          </span>
          <span className="font-black">{drag ? "رهاش کن!" : "عکس را اینجا بگذار"}</span>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            یک تصویر واضح از چهره · JPG یا PNG
          </span>
        </button>
      ) : (
        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden border-2 border-[var(--color-primary)] shadow-[5px_5px_0_0_var(--color-accent)]">
          <img src={preview} alt="پیش‌نمایش عکس انتخاب‌شده" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="tap absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black/90"
            aria-label="حذف عکس"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
