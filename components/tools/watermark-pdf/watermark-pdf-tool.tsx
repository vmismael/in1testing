"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { toast } from "sonner";
import { FileText, Loader2, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { PdfPreview } from "@/components/tools/pdf-preview";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import type { Tool } from "@/lib/tools/types";

export default function WatermarkPdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(20);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  function pickFile(files: File[]) {
    setResult(null);
    setFile(files[0] ?? null);
  }

  async function apply() {
    if (!file) return;
    const watermark = text.trim();
    if (!watermark) {
      toast.warning("Type some watermark text.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const rad = Math.PI / 4;
      const widthAt1 = font.widthOfTextAtSize(watermark, 1) || 1;
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        // Size the text so it spans ~70% of the page diagonal.
        const size = Math.min((0.7 * Math.hypot(width, height)) / widthAt1, Math.min(width, height));
        const tw = font.widthOfTextAtSize(watermark, size);
        page.drawText(watermark, {
          x: width / 2 - (Math.cos(rad) * tw) / 2,
          y: height / 2 - (Math.sin(rad) * tw) / 2,
          size,
          font,
          rotate: degrees(45),
          color: rgb(0.5, 0.5, 0.5),
          opacity: opacity / 100,
        });
      }
      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      setResult({ blob, name: `${stripExtension(file.name)}-watermarked.pdf` });
      toast.success("Watermark added.");
    } catch (err) {
      console.error(err);
      toast.error("Could not watermark this PDF. Is the file valid?");
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
        hint="PDF files only · processed privately in your browser"
      />

      {file && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="watermark-text">Watermark text</Label>
            <Input
              id="watermark-text"
              value={text}
              maxLength={60}
              disabled={busy}
              onChange={(e) => setText(e.target.value)}
              placeholder="CONFIDENTIAL"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="watermark-opacity">Opacity</Label>
              <span className="text-sm tabular-nums text-muted-foreground">{opacity}%</span>
            </div>
            <Slider
              id="watermark-opacity"
              min={5}
              max={60}
              step={5}
              value={[opacity]}
              disabled={busy}
              onValueChange={(v) => setOpacity(Array.isArray(v) ? v[0] : (v as number))}
            />
          </div>

          <Button type="button" size="lg" onClick={apply} disabled={busy || !text.trim()}>
            {busy ? <Loader2 className="animate-spin" /> : <Stamp />}
            {busy ? "Applying…" : "Add watermark"}
          </Button>

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <PdfPreview blob={result.blob} />
              <Button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name, "application/pdf")}
              >
                Download watermarked PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
