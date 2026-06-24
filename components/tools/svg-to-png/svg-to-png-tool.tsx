"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { canvasToBlob, drawToCanvas, loadImage } from "@/lib/image";
import type { Tool } from "@/lib/tools/types";

interface Result {
  blob: Blob;
  url: string;
  name: string;
}

export default function SvgToPngTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [width, setWidth] = useState(512);
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

  async function convert() {
    if (!file) return;
    setBusy(true);
    try {
      const img = await loadImage(file);
      const ratio = img.naturalHeight && img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1;
      const w = Math.max(1, Math.min(4096, width));
      const canvas = drawToCanvas(img, { width: w, height: Math.round(w * ratio) });
      const blob = await canvasToBlob(canvas, "image/png");
      const name = `${stripExtension(file.name)}.png`;
      setResult({ blob, url: URL.createObjectURL(blob), name });
      toast.success("Converted to PNG.");
    } catch {
      toast.error("Could not convert this SVG. Make sure it's a valid SVG file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDropzone accept={tool.accept} disabled={busy} onAdd={pickFile} hint="SVG · rasterized privately in your browser" />

      {file && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <p className="truncate text-sm font-medium">{file.name}</p>

          <div className="space-y-2">
            <Label htmlFor="svg-width">Output width (px)</Label>
            <Input
              id="svg-width"
              type="number"
              min={16}
              max={4096}
              value={width}
              onChange={(e) => setWidth(Math.max(16, Math.min(4096, Number(e.target.value) || 16)))}
              className="max-w-40"
            />
            <p className="text-xs text-muted-foreground">Height is scaled automatically to keep the aspect ratio.</p>
          </div>

          <Button type="button" size="lg" onClick={convert} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Converting…" : "Convert to PNG"}
          </Button>

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.url} alt="PNG preview" className="max-h-48 rounded-md border border-border bg-white object-contain" />
              <Button type="button" onClick={() => downloadBlob(result.blob, result.name, "image/png")}>
                Download PNG
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
