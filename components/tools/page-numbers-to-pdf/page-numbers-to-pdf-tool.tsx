"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toast } from "sonner";
import { FileText, Loader2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { PdfPreview } from "@/components/tools/pdf-preview";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import type { Tool } from "@/lib/tools/types";

const POSITIONS = [
  { key: "bottom-center", label: "Bottom center" },
  { key: "bottom-right", label: "Bottom right" },
  { key: "bottom-left", label: "Bottom left" },
  { key: "top-center", label: "Top center" },
  { key: "top-right", label: "Top right" },
] as const;
type PositionKey = (typeof POSITIONS)[number]["key"];

export default function PageNumbersToPdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<PositionKey>("bottom-center");
  const [start, setStart] = useState(1);
  const [showTotal, setShowTotal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  function pickFile(files: File[]) {
    setResult(null);
    setFile(files[0] ?? null);
  }

  async function apply() {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const total = pages.length;
      const size = 11;
      const margin = 28;
      pages.forEach((page, i) => {
        const num = start + i;
        const label = showTotal ? `${num} of ${start + total - 1}` : String(num);
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(label, size);
        const top = position.startsWith("top");
        const y = top ? height - margin - size : margin;
        let x = margin;
        if (position.endsWith("center")) x = (width - textWidth) / 2;
        else if (position.endsWith("right")) x = width - margin - textWidth;
        page.drawText(label, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
      });
      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      setResult({ blob, name: `${stripExtension(file.name)}-numbered.pdf` });
      toast.success("Page numbers added.");
    } catch (err) {
      console.error(err);
      toast.error("Could not number this PDF. Is the file valid?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDropzone accept={tool.accept} disabled={busy} onAdd={pickFile} hint="PDF files only · processed privately in your browser" />

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
            <Label>Position</Label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((p) => (
                <Button key={p.key} type="button" size="sm" variant={position === p.key ? "default" : "outline"} disabled={busy} onClick={() => setPosition(p.key)}>
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="pn-start">Start at</Label>
              <Input id="pn-start" type="number" min={0} value={start} disabled={busy} onChange={(e) => setStart(Math.max(0, Number(e.target.value) || 0))} className="w-28" />
            </div>
            <Button type="button" size="sm" variant={showTotal ? "default" : "outline"} disabled={busy} onClick={() => setShowTotal((v) => !v)}>
              Show &quot;X of N&quot;
            </Button>
          </div>

          <Button type="button" size="lg" onClick={apply} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Hash />}
            {busy ? "Adding…" : "Add page numbers"}
          </Button>

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <PdfPreview blob={result.blob} />
              <Button type="button" onClick={() => downloadBlob(result.blob, result.name, "application/pdf")}>
                Download numbered PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
