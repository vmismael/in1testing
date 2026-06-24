"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link2, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { canvasToBlob, drawToCanvas, loadImage } from "@/lib/image";
import type { Tool } from "@/lib/tools/types";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

interface Result {
  blob: Blob;
  url: string;
  name: string;
  width: number;
  height: number;
}

export default function ImageResizerTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lock, setLock] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  async function pickFile(files: File[]) {
    const f = files[0] ?? null;
    setResult(null);
    setFile(f);
    if (!f) {
      setNatural(null);
      return;
    }
    try {
      const img = await loadImage(f);
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read this image.");
      setFile(null);
      setNatural(null);
    }
  }

  function changeWidth(value: number) {
    const w = Math.max(0, Math.round(value));
    setWidth(w);
    if (lock && natural) setHeight(Math.max(1, Math.round((w * natural.h) / natural.w)));
  }

  function changeHeight(value: number) {
    const h = Math.max(0, Math.round(value));
    setHeight(h);
    if (lock && natural) setWidth(Math.max(1, Math.round((h * natural.w) / natural.h)));
  }

  async function resize() {
    if (!file || !width || !height) return;
    setBusy(true);
    try {
      const img = await loadImage(file);
      const isJpeg = file.type === "image/jpeg";
      const canvas = drawToCanvas(img, {
        width,
        height,
        background: isJpeg ? "#ffffff" : undefined,
      });
      const type = file.type || "image/png";
      const blob = await canvasToBlob(canvas, type);
      const ext = EXT[type] ?? "png";
      const name = `${stripExtension(file.name)}-${width}x${height}.${ext}`;
      setResult({ blob, url: URL.createObjectURL(blob), name, width, height });
      toast.success("Image resized.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Could not resize this image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDropzone
        accept={tool.accept}
        disabled={busy}
        onAdd={pickFile}
        hint="JPG, PNG or WebP · processed privately in your browser"
      />

      {file && natural && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="shrink-0 text-xs text-muted-foreground">
              {natural.w} × {natural.h} · {formatBytes(file.size)}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="resize-width">Width (px)</Label>
              <Input
                id="resize-width"
                type="number"
                min={1}
                value={width || ""}
                disabled={busy}
                onChange={(e) => changeWidth(parseInt(e.target.value, 10) || 0)}
                className="h-10 w-28"
              />
            </div>
            <span className="pb-2.5 text-muted-foreground">×</span>
            <div className="space-y-2">
              <Label htmlFor="resize-height">Height (px)</Label>
              <Input
                id="resize-height"
                type="number"
                min={1}
                value={height || ""}
                disabled={busy}
                onChange={(e) => changeHeight(parseInt(e.target.value, 10) || 0)}
                className="h-10 w-28"
              />
            </div>
            <Button
              type="button"
              variant={lock ? "default" : "outline"}
              size="sm"
              disabled={busy}
              className="mb-0.5"
              aria-pressed={lock}
              onClick={() => setLock((v) => !v)}
            >
              {lock ? <Link2 /> : <Unlink />}
              {lock ? "Ratio locked" : "Ratio free"}
            </Button>
          </div>

          <Button type="button" size="lg" onClick={resize} disabled={busy || !width || !height}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Resizing…" : "Resize image"}
          </Button>

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="Resized preview"
                className="max-h-48 rounded-md border border-border object-contain"
              />
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                  New size:{" "}
                  <strong className="text-foreground">
                    {result.width} × {result.height}
                  </strong>
                </span>
                <span className="text-muted-foreground">
                  File: <strong className="text-foreground">{formatBytes(result.blob.size)}</strong>
                </span>
              </div>
              <Button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name, result.blob.type)}
              >
                Download resized image
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
