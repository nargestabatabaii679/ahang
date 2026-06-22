"use client";

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
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-10 text-center transition duration-300",
            drag
              ? "border-tape/70 bg-tape/10"
              : "border-border bg-white/[0.02] hover:border-tape/40 hover:bg-white/[0.04]"
          )}
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-tape/10 text-tape">
            <Image className="h-7 w-7" />
          </span>
          <span className="font-bold">عکس را اینجا بگذار</span>
          <span className="text-xs text-muted-foreground">
            یک تصویر واضح از چهره · JPG یا PNG
          </span>
        </button>
      ) : (
        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-3xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="پیش‌نمایش عکس" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
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
