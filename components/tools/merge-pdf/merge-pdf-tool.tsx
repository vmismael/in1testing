"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { PdfPreview } from "@/components/tools/pdf-preview";
import { downloadBlob } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import type { Tool } from "@/lib/tools/types";

export default function MergePdfTool({ tool }: { tool: Tool }) {
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

  async function merge() {
    if (files.length < 2) {
      toast.warning("Add at least two PDF files to merge.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const out = await merged.save();
      // Copy into a concrete ArrayBuffer-backed view so the bytes satisfy BlobPart.
      const blob = new Blob([new Uint8Array(out)], { type: "application/pdf" });
      setResult({ blob, name: "merged.pdf" });
      toast.success("Your merged PDF is ready.");
    } catch (err) {
      console.error(err);
      toast.error("Could not merge these files. Are they all valid PDFs?");
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
        hint="PDF files only · processed privately in your browser"
      />

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
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
        <Button type="button" size="lg" onClick={merge} disabled={busy || files.length < 2}>
          {busy && <Loader2 className="animate-spin" />}
          {busy ? "Merging…" : files.length >= 2 ? `Merge ${files.length} PDFs` : "Merge PDFs"}
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
            Download merged PDF
          </Button>
        </div>
      )}
    </div>
  );
}
