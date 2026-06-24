"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { PdfPreview } from "@/components/tools/pdf-preview";
import { downloadBlob } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { canvasToBlob, drawToCanvas, loadImage } from "@/lib/image";
import type { Tool } from "@/lib/tools/types";

export default function ImageToPdfTool({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  function addFiles(incoming: File[]) {
    setResult(null);
    setFiles((prev) => [...prev, ...incoming]);
  }

  function move(index: number, dir: -1 | 1) {
    setResult(null);
    setFiles((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    setResult(null);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  /** Embeds one image, converting WebP/other formats to PNG first. */
  async function embed(pdf: PDFDocument, file: File) {
    if (file.type === "image/jpeg") return pdf.embedJpg(await file.arrayBuffer());
    if (file.type === "image/png") return pdf.embedPng(await file.arrayBuffer());
    // WebP (and anything else) → re-encode to PNG via canvas.
    const img = await loadImage(file);
    const blob = await canvasToBlob(drawToCanvas(img), "image/png");
    return pdf.embedPng(await blob.arrayBuffer());
  }

  async function convert() {
    if (files.length === 0) {
      toast.warning("Add at least one image.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const pdf = await PDFDocument.create();
      for (const file of files) {
        const image = await embed(pdf, file);
        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      const out = await pdf.save();
      const blob = new Blob([new Uint8Array(out)], { type: "application/pdf" });
      setResult({ blob, name: "images.pdf" });
      toast.success("Your PDF is ready.");
    } catch (err) {
      console.error(err);
      toast.error("Could not build the PDF. Are all files valid images?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone
        accept={tool.accept}
        multiple
        disabled={busy}
        onAdd={addFiles}
        hint="JPG, PNG or WebP · processed privately in your browser"
      />

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <ImageIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy || i === 0}
                  aria-label="Move up"
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy || i === files.length - 1}
                  aria-label="Move down"
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy}
                  aria-label="Remove"
                  onClick={() => remove(i)}
                >
                  <X />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="lg" onClick={convert} disabled={busy || files.length === 0}>
          {busy && <Loader2 className="animate-spin" />}
          {busy ? "Building PDF…" : files.length > 0 ? `Convert ${files.length} to PDF` : "Convert to PDF"}
        </Button>
        {files.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={busy}
            onClick={() => {
              setFiles([]);
              setResult(null);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {result && (
        <div className="space-y-3 rounded-lg bg-muted/50 p-4">
          <PdfPreview blob={result.blob} />
          <Button
            type="button"
            onClick={() => downloadBlob(result.blob, result.name, "application/pdf")}
          >
            Download PDF
          </Button>
        </div>
      )}
    </div>
  );
}
