"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { PdfPreview } from "@/components/tools/pdf-preview";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { canvasToBlob } from "@/lib/image";
import { pdfjs } from "@/lib/pdfjs";
import type { Tool } from "@/lib/tools/types";

// Render pages above their point size for legible images, then place them back
// at the original physical page size so the PDF keeps correct dimensions.
const RENDER_SCALE = 1.5;

interface Result {
  blob: Blob;
  url: string;
  name: string;
}

export default function CompressPdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [quality, setQuality] = useState(60);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [notReduced, setNotReduced] = useState(false);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  async function pickFile(files: File[]) {
    const f = files[0] ?? null;
    setResult(null);
    setNotReduced(false);
    setFile(f);
    setPageCount(null);
    if (!f) return;
    try {
      const task = pdfjs.getDocument({ data: await f.arrayBuffer() });
      const doc = await task.promise;
      setPageCount(doc.numPages);
      await task.destroy();
    } catch (err) {
      console.error(err);
      toast.error("Could not read this PDF. Is the file valid?");
      setFile(null);
    }
  }

  async function compress() {
    if (!file || !pageCount) return;
    setBusy(true);
    setResult(null);
    setNotReduced(false);
    try {
      const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
      const doc = await task.promise;
      const out = await PDFDocument.create();

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const ptViewport = page.getViewport({ scale: 1 });
        const renderViewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(renderViewport.width);
        canvas.height = Math.ceil(renderViewport.height);
        await page.render({ canvas, viewport: renderViewport, background: "#ffffff" }).promise;
        page.cleanup();
        const jpg = await canvasToBlob(canvas, "image/jpeg", quality / 100);
        const image = await out.embedJpg(await jpg.arrayBuffer());
        const pdfPage = out.addPage([ptViewport.width, ptViewport.height]);
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: ptViewport.width,
          height: ptViewport.height,
        });
      }

      await task.destroy();
      const bytes = await out.save();

      // Only deliver if we actually made it smaller — never hand back a bigger file.
      if (bytes.length >= file.size) {
        setNotReduced(true);
        toast.info("This PDF is already well optimized — your original was kept.");
        return;
      }
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      setResult({
        blob,
        url: URL.createObjectURL(blob),
        name: `${stripExtension(file.name)}-compressed.pdf`,
      });
      toast.success("PDF compressed.");
    } catch (err) {
      console.error(err);
      toast.error("Could not compress this PDF.");
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
        hint="PDF files only · processed privately in your browser"
      />

      {file && pageCount && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {pageCount} {pageCount === 1 ? "page" : "pages"} · {formatBytes(file.size)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="compress-quality">Quality</Label>
              <span className="text-sm tabular-nums text-muted-foreground">{quality}%</span>
            </div>
            <Slider
              id="compress-quality"
              min={30}
              max={90}
              step={5}
              value={[quality]}
              disabled={busy}
              onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : (v as number))}
            />
            <p className="text-xs text-muted-foreground">
              Basic compression: pages are rebuilt as images, so text becomes non-selectable.
              Works best on scanned or image-heavy PDFs.
            </p>
          </div>

          <Button type="button" size="lg" onClick={compress} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Compressing…" : "Compress PDF"}
          </Button>

          {notReduced && (
            <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              This PDF is already well optimized, so compressing would make it larger. Your
              original file was kept unchanged.
            </p>
          )}

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <PdfPreview blob={result.blob} />
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
                Download compressed PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
