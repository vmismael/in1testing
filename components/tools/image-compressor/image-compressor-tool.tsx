"use client";

import { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import type { Tool } from "@/lib/tools/types";

interface Result {
  blob: Blob;
  url: string;
  name: string;
}

export default function ImageCompressorTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(70);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Clean up object URLs to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  function pickFile(files: File[]) {
    setResult(null);
    setFile(files[0] ?? null);
  }

  async function compress() {
    if (!file) return;
    setBusy(true);
    try {
      const compressed = await imageCompression(file, {
        useWebWorker: true,
        initialQuality: quality / 100,
        // No size cap — let the quality setting drive the result.
        maxSizeMB: Number.POSITIVE_INFINITY,
      });
      const name = `${stripExtension(file.name)}-compressed.${file.type.split("/")[1] ?? "jpg"}`;
      const url = URL.createObjectURL(compressed);
      setResult({ blob: compressed, url, name });
      toast.success("Image compressed.");
    } catch (err) {
      console.error(err);
      toast.error("Could not compress this image. Please try another file.");
    } finally {
      setBusy(false);
    }
  }

  const saved =
    file && result ? Math.max(0, Math.round((1 - result.blob.size / file.size) * 100)) : 0;

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
            <div className="flex items-center justify-between">
              <Label htmlFor="quality">Quality</Label>
              <span className="text-sm tabular-nums text-muted-foreground">{quality}%</span>
            </div>
            <Slider
              id="quality"
              min={10}
              max={100}
              step={1}
              value={[quality]}
              disabled={busy}
              onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" size="lg" onClick={compress} disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {busy ? "Compressing…" : "Compress image"}
            </Button>
          </div>

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="Compressed preview"
                className="max-h-48 rounded-md border border-border object-contain"
              />
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                  Original: <strong className="text-foreground">{formatBytes(file.size)}</strong>
                </span>
                <span className="text-muted-foreground">
                  Compressed:{" "}
                  <strong className="text-foreground">{formatBytes(result.blob.size)}</strong>
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {saved}% smaller
                </span>
              </div>
              <Button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name, result.blob.type)}
              >
                Download compressed image
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
