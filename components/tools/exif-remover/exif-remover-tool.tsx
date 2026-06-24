"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { canvasToBlob, drawToCanvas, loadImage } from "@/lib/image";
import type { Tool } from "@/lib/tools/types";

interface Result {
  blob: Blob;
  url: string;
  name: string;
  type: string;
}

const TYPE_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export default function ExifRemoverTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  function pickFile(files: File[]) {
    setResult(null);
    setFile(files[0] ?? null);
  }

  async function clean() {
    if (!file) return;
    setBusy(true);
    try {
      const img = await loadImage(file);
      const type = TYPE_EXT[file.type] ? file.type : "image/png";
      const canvas = drawToCanvas(img, { background: type === "image/jpeg" ? "#ffffff" : undefined });
      // Re-encoding through a canvas drops all EXIF and other metadata.
      const blob = await canvasToBlob(canvas, type, type === "image/png" ? undefined : 0.95);
      const name = `${stripExtension(file.name)}-clean.${TYPE_EXT[type] ?? "png"}`;
      setResult({ blob, url: URL.createObjectURL(blob), name, type });
      toast.success("Metadata removed.");
    } catch {
      toast.error("Could not process this image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDropzone accept={tool.accept} disabled={busy} onAdd={pickFile} hint="JPG, PNG or WebP · cleaned privately in your browser" />

      {file && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            Re-saves the image without EXIF data such as GPS location, camera model and timestamps. The pixels are kept; only the hidden metadata is removed.
          </p>

          <Button type="button" size="lg" onClick={clean} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Cleaning…" : "Remove metadata"}
          </Button>

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.url} alt="Cleaned preview" className="max-h-48 rounded-md border border-border object-contain" />
              <p className="text-sm text-muted-foreground">Clean image: <strong className="text-foreground">{formatBytes(result.blob.size)}</strong></p>
              <Button type="button" onClick={() => downloadBlob(result.blob, result.name, result.type)}>
                Download clean image
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
