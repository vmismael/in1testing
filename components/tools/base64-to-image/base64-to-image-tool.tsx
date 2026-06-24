"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob } from "@/lib/download";

function normalize(input: string): { dataUri: string; ext: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:image/")) {
    const match = trimmed.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/);
    return { dataUri: trimmed, ext: match ? match[1].replace("svg+xml", "svg") : "png" };
  }
  // Raw base64 — assume PNG.
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed)) {
    return { dataUri: `data:image/png;base64,${trimmed.replace(/\s+/g, "")}`, ext: "png" };
  }
  return null;
}

function dataUriToBlob(dataUri: string): Blob | null {
  try {
    const [header, b64] = dataUri.split(",");
    const mime = header.match(/data:([^;]+)/)?.[1] ?? "image/png";
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

export default function Base64ToImageTool() {
  const [input, setInput] = useState("");
  const [broken, setBroken] = useState(false);

  const parsed = useMemo(() => normalize(input), [input]);

  function download() {
    if (!parsed) return;
    const blob = dataUriToBlob(parsed.dataUri);
    if (blob) downloadBlob(blob, `image.${parsed.ext}`, blob.type);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="b2i-input">Base64 or data URI</Label>
        <Textarea
          id="b2i-input"
          value={input}
          onChange={(e) => { setInput(e.target.value); setBroken(false); }}
          placeholder="data:image/png;base64,iVBORw0KGgo… or raw base64"
          className="min-h-32 font-mono text-xs"
        />
      </div>

      {input.trim() && !parsed && <p className="text-sm text-destructive">That doesn&apos;t look like valid Base64 image data.</p>}
      {parsed && broken && <p className="text-sm text-destructive">The data decoded, but it isn&apos;t a displayable image.</p>}

      {parsed && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/30 p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={parsed.dataUri}
            alt="Decoded preview"
            className="max-h-64 rounded-lg border border-border bg-white object-contain"
            onError={() => setBroken(true)}
          />
          <Button type="button" size="lg" onClick={download} disabled={broken}>
            <Download />
            Download image
          </Button>
        </div>
      )}
    </div>
  );
}
