"use client";

import { useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import JSZip from "jszip";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { PdfPreview } from "@/components/tools/pdf-preview";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { canvasToBlob } from "@/lib/image";
import { pdfjs } from "@/lib/pdfjs";
import type { Tool } from "@/lib/tools/types";

// Higher scale = sharper JPGs (at the cost of a bigger image).
const SCALE = 2;
const QUALITY = 0.92;

export default function PdfToJpgTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function pickFile(files: File[]) {
    const f = files[0] ?? null;
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

  async function renderPage(doc: PDFDocumentProxy, index: number): Promise<Blob> {
    const page = await doc.getPage(index);
    const viewport = page.getViewport({ scale: SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    page.cleanup();
    return canvasToBlob(canvas, "image/jpeg", QUALITY);
  }

  async function convert() {
    if (!file || !pageCount) return;
    setBusy(true);
    try {
      const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
      const doc = await task.promise;
      const base = stripExtension(file.name);
      if (doc.numPages === 1) {
        const blob = await renderPage(doc, 1);
        downloadBlob(blob, `${base}.jpg`, "image/jpeg");
      } else {
        const zip = new JSZip();
        const pad = String(doc.numPages).length;
        for (let i = 1; i <= doc.numPages; i++) {
          const blob = await renderPage(doc, i);
          zip.file(`${base}-page-${String(i).padStart(pad, "0")}.jpg`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, `${base}-jpg.zip`, "application/zip");
      }
      await task.destroy();
      toast.success(pageCount === 1 ? "Your JPG is ready." : `Converted ${pageCount} pages.`);
    } catch (err) {
      console.error(err);
      toast.error("Could not convert this PDF.");
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

          <PdfPreview blob={file} />

          <p className="text-sm text-muted-foreground">
            {pageCount === 1
              ? "Your page will be converted to a single JPG image."
              : "Each page becomes a JPG, delivered together in a ZIP file. Flip through the preview above to see every page."}
          </p>

          <Button type="button" size="lg" onClick={convert} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {busy
              ? "Converting…"
              : pageCount === 1
                ? "Convert to JPG"
                : `Convert ${pageCount} pages to JPG`}
          </Button>
        </div>
      )}
    </div>
  );
}
