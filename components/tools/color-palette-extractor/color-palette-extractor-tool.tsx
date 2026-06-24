"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/ui/copy-button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { drawToCanvas, loadImage } from "@/lib/image";
import type { Tool } from "@/lib/tools/types";

function toHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function extractPalette(data: Uint8ClampedArray, count: number): string[] {
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue; // skip transparent
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Quantize to 5 bits per channel to group similar colors.
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.n += 1;
    } else {
      buckets.set(key, { r, g, b, n: 1 });
    }
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((c) => toHex(Math.round(c.r / c.n), Math.round(c.g / c.n), Math.round(c.b / c.n)));
}

export default function ColorPaletteExtractorTool({ tool }: { tool: Tool }) {
  const [palette, setPalette] = useState<string[]>([]);

  async function pickFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    try {
      const img = await loadImage(file);
      // Downscale for fast, representative sampling.
      const scale = Math.min(1, 200 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = drawToCanvas(img, {
        width: Math.max(1, Math.round(img.naturalWidth * scale)),
        height: Math.max(1, Math.round(img.naturalHeight * scale)),
      });
      const data = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data;
      if (!data) return;
      setPalette(extractPalette(data, 8));
    } catch {
      toast.error("Could not read this image.");
    }
  }

  return (
    <div className="space-y-5">
      <FileDropzone accept={tool.accept} onAdd={pickFile} hint="Any image · analyzed privately in your browser" />

      {palette.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Dominant colors — click to copy each hex code.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {palette.map((hex) => (
              <div key={hex} className="overflow-hidden rounded-xl border border-border">
                <div className="h-20" style={{ backgroundColor: hex }} />
                <div className="flex items-center justify-between gap-1 bg-muted/30 px-2 py-2">
                  <span className="font-mono text-sm">{hex}</span>
                  <CopyButton value={hex} label="" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
