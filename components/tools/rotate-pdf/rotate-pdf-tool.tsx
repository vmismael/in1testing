"use client";

import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { toast } from "sonner";
import { FileText, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { PdfPreview } from "@/components/tools/pdf-preview";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import type { Tool } from "@/lib/tools/types";

const ANGLES = [90, 180, 270];

export default function RotatePdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState(90);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  function pickFile(files: File[]) {
    setResult(null);
    setFile(files[0] ?? null);
  }

  async function rotate() {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      for (const page of doc.getPages()) {
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + angle) % 360));
      }
      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      setResult({ blob, name: `${stripExtension(file.name)}-rotated.pdf` });
      toast.success("PDF rotated.");
    } catch (err) {
      console.error(err);
      toast.error("Could not rotate this PDF. Is the file valid?");
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
            <Label>Rotation</Label>
            <div className="flex flex-wrap gap-2">
              {ANGLES.map((a) => (
                <Button
                  key={a}
                  type="button"
                  size="sm"
                  variant={angle === a ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => setAngle(a)}
                >
                  {a}°
                </Button>
              ))}
            </div>
          </div>

          <Button type="button" size="lg" onClick={rotate} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <RotateCw />}
            {busy ? "Rotating…" : `Rotate ${angle}°`}
          </Button>

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <PdfPreview blob={result.blob} />
              <Button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name, "application/pdf")}
              >
                Download rotated PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
