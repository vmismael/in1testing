"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

const ALIGNS = [
  { key: "left", label: "Left" },
  { key: "center", label: "Center" },
  { key: "right", label: "Right" },
] as const;
type Align = (typeof ALIGNS)[number]["key"];

export default function PdfHeaderFooterTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");
  const [align, setAlign] = useState<Align>("center");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  function pickFile(files: File[]) {
    setResult(null);
    setFile(files[0] ?? null);
  }

  function xFor(align: Align, width: number, textWidth: number, margin: number): number {
    if (align === "center") return (width - textWidth) / 2;
    if (align === "right") return width - margin - textWidth;
    return margin;
  }

  async function apply() {
    if (!file || (!header.trim() && !footer.trim())) {
      toast.message("Enter a header or footer first.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const size = 11;
      const margin = 28;
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        if (header.trim()) {
          const tw = font.widthOfTextAtSize(header, size);
          page.drawText(header, { x: xFor(align, width, tw, margin), y: height - margin - size, size, font, color: rgb(0.2, 0.2, 0.2) });
        }
        if (footer.trim()) {
          const tw = font.widthOfTextAtSize(footer, size);
          page.drawText(footer, { x: xFor(align, width, tw, margin), y: margin, size, font, color: rgb(0.2, 0.2, 0.2) });
        }
      }
      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      setResult({ blob, name: `${stripExtension(file.name)}-header-footer.pdf` });
      toast.success("Header and footer added.");
    } catch (err) {
      console.error(err);
      toast.error("Could not process this PDF. Is the file valid?");
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hf-header">Header text</Label>
              <Input id="hf-header" value={header} disabled={busy} onChange={(e) => setHeader(e.target.value)} placeholder="e.g. Confidential" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hf-footer">Footer text</Label>
              <Input id="hf-footer" value={footer} disabled={busy} onChange={(e) => setFooter(e.target.value)} placeholder="e.g. Company name" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Alignment</Label>
            <div className="flex flex-wrap gap-2">
              {ALIGNS.map((a) => (
                <Button key={a.key} type="button" size="sm" variant={align === a.key ? "default" : "outline"} disabled={busy} onClick={() => setAlign(a.key)}>
                  {a.label}
                </Button>
              ))}
            </div>
          </div>

          <Button type="button" size="lg" onClick={apply} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Applying…" : "Add header & footer"}
          </Button>

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <PdfPreview blob={result.blob} />
              <Button type="button" onClick={() => downloadBlob(result.blob, result.name, "application/pdf")}>
                Download PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
