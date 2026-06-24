"use client";

import { useEffect, useState } from "react";
import { removeBackground } from "@imgly/background-removal";
import { toast } from "sonner";
import { Loader2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import type { Tool } from "@/lib/tools/types";

// Large images strain memory and CPU on-device; keep a sane ceiling.
const MAX_BYTES = 25 * 1024 * 1024;

// Soft checkerboard so transparent areas of the result are visible.
const CHECKERBOARD =
  "repeating-conic-gradient(#e5e5e5 0% 25%, #ffffff 0% 50%) 50% / 20px 20px";

interface Result {
  blob: Blob;
  url: string;
  name: string;
}

export default function BackgroundRemoverTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  function pickFile(files: File[]) {
    const f = files[0] ?? null;
    setResult(null);
    if (f && f.size > MAX_BYTES) {
      toast.warning(`Please use an image under ${formatBytes(MAX_BYTES)}.`);
      setFile(null);
      return;
    }
    setFile(f);
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    setResult(null);
    setProgress(null);
    try {
      const blob = await removeBackground(file, {
        output: { format: "image/png" },
        progress: (_key, current, total) => {
          if (total > 0) setProgress(Math.round((current / total) * 100));
        },
      });
      const name = `${stripExtension(file.name)}-no-bg.png`;
      setResult({ blob, url: URL.createObjectURL(blob), name });
      toast.success("Background removed.");
    } catch (err) {
      console.error(err);
      toast.error("Could not remove the background. Try another image.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-5">
      <FileDropzone
        accept={tool.accept}
        disabled={busy}
        onAdd={pickFile}
        hint="JPG, PNG or WebP · processed privately on your device"
      />

      {file && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>

          <Button type="button" size="lg" onClick={run} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <WandSparkles />}
            {busy ? "Removing…" : "Remove background"}
          </Button>

          {busy && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {progress == null
                  ? "Processing on your device…"
                  : `Loading AI model… ${progress}%`}{" "}
                The first run downloads the model (a few MB); it&apos;s cached afterward.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <div className="overflow-hidden rounded-md border border-border" style={{ background: CHECKERBOARD }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.url}
                  alt="Background removed preview"
                  className="mx-auto max-h-64 object-contain"
                />
              </div>
              <Button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name, result.blob.type)}
              >
                Download transparent PNG
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
