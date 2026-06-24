"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { pdfjs } from "@/lib/pdfjs";
import type { Tool } from "@/lib/tools/types";

interface TextItem {
  str: string;
  hasEOL?: boolean;
}

export default function PdfToTextTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");

  function pickFile(files: File[]) {
    setText("");
    setFile(files[0] ?? null);
  }

  async function extract() {
    if (!file) return;
    setBusy(true);
    setText("");
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    try {
      const doc = await loadingTask.promise;
      const parts: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        let pageText = "";
        for (const item of content.items as TextItem[]) {
          pageText += item.str;
          if (item.hasEOL) pageText += "\n";
        }
        parts.push(pageText.trim());
      }
      const joined = parts.join("\n\n");
      setText(joined);
      if (!joined.trim()) {
        toast.message("No selectable text found — this PDF may be scanned images.");
      } else {
        toast.success("Text extracted.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not read this PDF. Is the file valid?");
    } finally {
      loadingTask.destroy();
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FileDropzone accept={tool.accept} disabled={busy} onAdd={pickFile} hint="PDF files only · read privately in your browser" />

      {file && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
          </div>

          <Button type="button" size="lg" onClick={extract} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {busy ? "Extracting…" : "Extract text"}
          </Button>

          {text && (
            <div className="space-y-2 rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <Label>Extracted text</Label>
                <div className="flex gap-2">
                  <CopyButton value={text} />
                  <Button type="button" size="sm" onClick={() => downloadBlob(text, `${stripExtension(file.name)}.txt`, "text/plain")}>
                    Download .txt
                  </Button>
                </div>
              </div>
              <Textarea readOnly value={text} className="min-h-64 bg-background font-mono text-sm" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
