"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { canvasToBlob } from "@/lib/image";
import { pdfjs } from "@/lib/pdfjs";
import type { Tool } from "@/lib/tools/types";

const THUMB_WIDTH = 150;

interface PageItem {
  index: number; // original 0-based page index
  url: string;
}

export default function OrganizePdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  async function pickFile(files: File[]) {
    const f = files[0] ?? null;
    items.forEach((it) => URL.revokeObjectURL(it.url));
    setItems([]);
    setFile(f);
    if (!f) return;
    setLoading(true);
    try {
      const task = pdfjs.getDocument({ data: await f.arrayBuffer() });
      const doc = await task.promise;
      const next: PageItem[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: THUMB_WIDTH / base.width });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, viewport, background: "#ffffff" }).promise;
        page.cleanup();
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.7);
        next.push({ index: i - 1, url: URL.createObjectURL(blob) });
      }
      await task.destroy();
      setItems(next);
    } catch (err) {
      console.error(err);
      toast.error("Could not read this PDF. Is the file valid?");
      setFile(null);
    } finally {
      setLoading(false);
    }
  }

  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = i + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  }

  function remove(i: number) {
    const url = items[i]?.url;
    if (url) URL.revokeObjectURL(url);
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function apply() {
    if (!file || items.length === 0) return;
    setBusy(true);
    try {
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, items.map((it) => it.index));
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      downloadBlob(
        new Uint8Array(bytes),
        `${stripExtension(file.name)}-organized.pdf`,
        "application/pdf",
      );
      toast.success("PDF reorganized.");
    } catch (err) {
      console.error(err);
      toast.error("Could not rebuild this PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDropzone
        accept={tool.accept}
        disabled={loading || busy}
        onAdd={pickFile}
        hint="PDF files only · processed privately in your browser"
      />

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Rendering page thumbnails…
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((it, i) => (
              <div
                key={`${it.index}-${i}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.url}
                  alt={`Page ${it.index + 1}`}
                  className="mx-auto max-h-40 w-full rounded border border-border object-contain"
                />
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={busy || i === 0}
                      aria-label="Move left"
                      onClick={() => move(i, -1)}
                    >
                      <ArrowLeft />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={busy || i === items.length - 1}
                      aria-label="Move right"
                      onClick={() => move(i, 1)}
                    >
                      <ArrowRight />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={busy}
                      aria-label="Remove page"
                      onClick={() => remove(i)}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" size="lg" onClick={apply} disabled={busy || items.length === 0}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Rebuilding…" : `Rebuild PDF (${items.length} ${items.length === 1 ? "page" : "pages"})`}
          </Button>
        </>
      )}
    </div>
  );
}
