"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { canvasToBlob, drawToCanvas, loadImage } from "@/lib/image";
import type { Tool } from "@/lib/tools/types";

const FORMATS = [
  { mime: "image/png", label: "PNG", ext: "png", lossy: false },
  { mime: "image/jpeg", label: "JPG", ext: "jpg", lossy: true },
  { mime: "image/webp", label: "WebP", ext: "webp", lossy: true },
] as const;

type Mime = (typeof FORMATS)[number]["mime"];

interface Result {
  blob: Blob;
  url: string;
  name: string;
}

export default function ImageConverterTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [mime, setMime] = useState<Mime>("image/png");
  const [quality, setQuality] = useState(90);
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

  const format = FORMATS.find((f) => f.mime === mime)!;

  async function convert() {
    if (!file) return;
    setBusy(true);
    try {
      const img = await loadImage(file);
      const canvas = drawToCanvas(img, {
        // JPG has no alpha channel: paint transparent areas white.
        background: mime === "image/jpeg" ? "#ffffff" : undefined,
      });
      const blob = await canvasToBlob(canvas, mime, format.lossy ? quality / 100 : undefined);
      const name = `${stripExtension(file.name)}.${format.ext}`;
      setResult({ blob, url: URL.createObjectURL(blob), name });
      toast.success(`Converted to ${format.label}.`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Could not convert this image.");
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

      {file && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>

          <div className="space-y-2">
            <Label>Convert to</Label>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <Button
                  key={f.mime}
                  type="button"
                  size="sm"
                  variant={mime === f.mime ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => {
                    setMime(f.mime);
                    setResult(null);
                  }}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {format.lossy && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="convert-quality">Quality</Label>
                <span className="text-sm tabular-nums text-muted-foreground">{quality}%</span>
              </div>
              <Slider
                id="convert-quality"
                min={10}
                max={100}
                step={1}
                value={[quality]}
                disabled={busy}
                onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : (v as number))}
              />
            </div>
          )}

          <Button type="button" size="lg" onClick={convert} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Converting…" : `Convert to ${format.label}`}
          </Button>

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="Converted preview"
                className="max-h-48 rounded-md border border-border object-contain"
              />
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                  Original: <strong className="text-foreground">{formatBytes(file.size)}</strong>
                </span>
                <span className="text-muted-foreground">
                  {format.label}: <strong className="text-foreground">{formatBytes(result.blob.size)}</strong>
                </span>
              </div>
              <Button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name, result.blob.type)}
              >
                Download {format.label}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
