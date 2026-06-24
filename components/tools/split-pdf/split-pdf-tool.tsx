"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { PdfPreview } from "@/components/tools/pdf-preview";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import type { Tool } from "@/lib/tools/types";

type Mode = "range" | "all";

export default function SplitPdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("range");
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  async function pickFile(files: File[]) {
    const f = files[0] ?? null;
    setFile(f);
    setPageCount(null);
    setResult(null);
    if (!f) return;
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      const count = doc.getPageCount();
      setPageCount(count);
      setFrom(1);
      setTo(count);
    } catch (err) {
      console.error(err);
      toast.error("Could not read this PDF. Is the file valid?");
      setFile(null);
    }
  }

  async function extractRange() {
    if (!file || !pageCount) return;
    if (from < 1 || to > pageCount || from > to) {
      toast.warning(`Enter a valid range between 1 and ${pageCount}.`);
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const indices = Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
      const pages = await out.copyPages(src, indices);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      setResult({ blob, name: `${stripExtension(file.name)}-pages-${from}-${to}.pdf` });
      toast.success("Pages extracted.");
    } catch (err) {
      console.error(err);
      toast.error("Could not extract these pages.");
    } finally {
      setBusy(false);
    }
  }

  async function splitAll() {
    if (!file || !pageCount) return;
    setBusy(true);
    setResult(null);
    try {
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const zip = new JSZip();
      const pad = String(pageCount).length;
      for (let i = 0; i < pageCount; i++) {
        const out = await PDFDocument.create();
        const [page] = await out.copyPages(src, [i]);
        out.addPage(page);
        const bytes = await out.save();
        zip.file(`page-${String(i + 1).padStart(pad, "0")}.pdf`, bytes);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${stripExtension(file.name)}-pages.zip`, "application/zip");
      toast.success(`Split into ${pageCount} files.`);
    } catch (err) {
      console.error(err);
      toast.error("Could not split this PDF.");
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

          <div className="space-y-2">
            <Label>Mode</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "range" ? "default" : "outline"}
                disabled={busy}
                onClick={() => {
                  setMode("range");
                  setResult(null);
                }}
              >
                Extract a range
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "all" ? "default" : "outline"}
                disabled={busy}
                onClick={() => {
                  setMode("all");
                  setResult(null);
                }}
              >
                Split all pages
              </Button>
            </div>
          </div>

          {mode === "range" ? (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-2">
                  <Label htmlFor="split-from">From page</Label>
                  <Input
                    id="split-from"
                    type="number"
                    min={1}
                    max={pageCount}
                    value={from || ""}
                    disabled={busy}
                    onChange={(e) => {
                      setFrom(parseInt(e.target.value, 10) || 0);
                      setResult(null);
                    }}
                    className="h-10 w-24"
                  />
                </div>
                <span className="pb-2.5 text-muted-foreground">to</span>
                <div className="space-y-2">
                  <Label htmlFor="split-to">To page</Label>
                  <Input
                    id="split-to"
                    type="number"
                    min={1}
                    max={pageCount}
                    value={to || ""}
                    disabled={busy}
                    onChange={(e) => {
                      setTo(parseInt(e.target.value, 10) || 0);
                      setResult(null);
                    }}
                    className="h-10 w-24"
                  />
                </div>
              </div>
              <Button type="button" size="lg" onClick={extractRange} disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {busy ? "Extracting…" : "Extract pages"}
              </Button>

              {result && (
                <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                  <PdfPreview blob={result.blob} />
                  <Button
                    type="button"
                    onClick={() => downloadBlob(result.blob, result.name, "application/pdf")}
                  >
                    Download extracted PDF
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Every page becomes its own PDF, delivered together in a ZIP file.
              </p>
              <Button type="button" size="lg" onClick={splitAll} disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {busy ? "Splitting…" : `Split into ${pageCount} files`}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
