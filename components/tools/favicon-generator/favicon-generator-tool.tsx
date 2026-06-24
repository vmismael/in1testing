"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob } from "@/lib/download";
import { canvasToBlob, drawToCanvas, loadImage } from "@/lib/image";
import type { Tool } from "@/lib/tools/types";

const SIZES = [16, 32, 48, 64, 180, 192, 512];

interface Preview {
  size: number;
  url: string;
}

export default function FaviconGeneratorTool({ tool }: { tool: Tool }) {
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  async function pickFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    try {
      const image = await loadImage(file);
      setImg(image);
      // Small previews at a few key sizes.
      const previewSizes = [16, 32, 64, 180];
      const out: Preview[] = [];
      for (const size of previewSizes) {
        const canvas = drawToCanvas(image, { width: size, height: size });
        const blob = await canvasToBlob(canvas, "image/png");
        out.push({ size, url: URL.createObjectURL(blob) });
      }
      setPreviews(out);
    } catch {
      toast.error("Could not read this image.");
    }
  }

  async function downloadZip() {
    if (!img) return;
    setBusy(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const size of SIZES) {
        const canvas = drawToCanvas(img, { width: size, height: size });
        const blob = await canvasToBlob(canvas, "image/png");
        const name = size === 180 ? "apple-touch-icon.png" : `favicon-${size}x${size}.png`;
        zip.file(name, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      downloadBlob(content, "favicons.zip", "application/zip");
      toast.success("Favicon pack ready.");
    } catch {
      toast.error("Could not build the favicon pack.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDropzone accept={tool.accept} onAdd={pickFile} hint="Square image works best · generated privately in your browser" />

      {previews.length > 0 && (
        <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Preview at common sizes:</p>
          <div className="flex flex-wrap items-end gap-4">
            {previews.map((p) => (
              <div key={p.size} className="flex flex-col items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`${p.size}px favicon`} width={p.size} height={p.size} className="rounded border border-border bg-white" />
                <span className="text-xs text-muted-foreground">{p.size}px</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            The download includes PNG icons at {SIZES.join(", ")} px, plus an apple-touch-icon, packed in a zip.
          </p>
          <Button type="button" size="lg" onClick={downloadZip} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Download />}
            {busy ? "Building…" : "Download favicon pack (.zip)"}
          </Button>
        </div>
      )}
    </div>
  );
}
