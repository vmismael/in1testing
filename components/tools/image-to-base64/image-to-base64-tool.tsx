"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { formatBytes } from "@/lib/format";
import type { Tool } from "@/lib/tools/types";

interface Result {
  dataUri: string;
  name: string;
  size: number;
}

export default function ImageToBase64Tool({ tool }: { tool: Tool }) {
  const [result, setResult] = useState<Result | null>(null);

  function pickFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setResult({ dataUri: String(reader.result), name: file.name, size: file.size });
    };
    reader.onerror = () => toast.error("Could not read this image.");
    reader.readAsDataURL(file);
  }

  const cssBackground = result ? `background-image: url("${result.dataUri}");` : "";
  const imgTag = result ? `<img src="${result.dataUri}" alt="${result.name}" />` : "";

  return (
    <div className="space-y-5">
      <FileDropzone accept={tool.accept} onAdd={pickFile} hint="Any image · encoded privately in your browser" />

      {result && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {result.name} · {formatBytes(result.size)} · {formatBytes(result.dataUri.length)} as Base64
          </p>

          <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <Label>Data URI</Label>
              <CopyButton value={result.dataUri} />
            </div>
            <Textarea readOnly value={result.dataUri} className="min-h-32 bg-background font-mono text-xs" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <Label>HTML &lt;img&gt;</Label>
                <CopyButton value={imgTag} />
              </div>
              <Textarea readOnly value={imgTag} className="min-h-24 bg-background font-mono text-xs" />
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <Label>CSS background</Label>
                <CopyButton value={cssBackground} />
              </div>
              <Textarea readOnly value={cssBackground} className="min-h-24 bg-background font-mono text-xs" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
