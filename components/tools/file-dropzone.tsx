"use client";

import { useId, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  /** Accepted MIME types, e.g. ["application/pdf"]. */
  accept?: string[];
  multiple?: boolean;
  disabled?: boolean;
  /** Called with the (filtered) files the user added. */
  onAdd: (files: File[]) => void;
  hint?: string;
}

export function FileDropzone({
  accept,
  multiple = false,
  disabled = false,
  onAdd,
  hint,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const acceptAttr = accept?.join(",");

  function matchesAccept(file: File): boolean {
    if (!accept || accept.length === 0) return true;
    return accept.some((type) => {
      if (type.endsWith("/*")) return file.type.startsWith(type.slice(0, -1));
      return file.type === type;
    });
  }

  function handleFiles(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list).filter(matchesAccept);
    if (files.length === 0) return;
    onAdd(multiple ? files : files.slice(0, 1));
  }

  return (
    <div>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={acceptAttr}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          // Allow selecting the same file again.
          e.target.value = "";
        }}
      />
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (disabled) return;
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-muted/60",
          dragging && "border-primary bg-primary/5",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="size-6" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium">
          Drag &amp; drop {multiple ? "files" : "a file"} here, or{" "}
          <span className="text-primary underline">browse</span>
        </span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </label>
    </div>
  );
}
