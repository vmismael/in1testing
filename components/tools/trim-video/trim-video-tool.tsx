"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { runConversion } from "@/lib/ffmpeg";
import type { Tool } from "@/lib/tools/types";

const MAX_BYTES = 150 * 1024 * 1024;

interface Result {
  blob: Blob;
  url: string;
  name: string;
}

export default function TrimVideoTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
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
    setDuration(null);
    if (f && f.size > MAX_BYTES) {
      toast.warning(`Please use a video under ${formatBytes(MAX_BYTES)}.`);
      setFile(null);
      return;
    }
    setFile(f);
    if (!f) return;
    const url = URL.createObjectURL(f);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const d = Number.isFinite(v.duration) ? v.duration : 0;
      setDuration(d || null);
      setStart(0);
      setEnd(Math.floor(d));
      URL.revokeObjectURL(url);
    };
    v.onerror = () => URL.revokeObjectURL(url);
    v.src = url;
  }

  async function trim() {
    if (!file) return;
    if (end <= start) {
      toast.warning("End time must be greater than start time.");
      return;
    }
    setBusy(true);
    setProgress(null);
    setResult(null);
    try {
      const ext = file.name.includes(".") ? file.name.split(".").pop()! : "mp4";
      const blob = await runConversion({
        file,
        outputName: `output.${ext}`,
        mime: file.type || "video/mp4",
        args: (input, output) => ["-i", input, "-ss", String(start), "-to", String(end), "-c", "copy", output],
        onProgress: (ratio) => setProgress(Math.round(ratio * 100)),
      });
      const name = `${stripExtension(file.name)}-trimmed.${ext}`;
      setResult({ blob, url: URL.createObjectURL(blob), name });
      toast.success("Video trimmed.");
    } catch (err) {
      console.error(err);
      toast.error("Could not trim this video. Please try another file.");
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
        hint="MP4, MOV, WebM and other video files · processed privately on your device"
      />

      {file && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="shrink-0 text-xs text-muted-foreground">
              {duration ? `${Math.floor(duration)}s · ` : ""}
              {formatBytes(file.size)}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="trim-start">Start (s)</Label>
              <Input
                id="trim-start"
                type="number"
                min={0}
                max={duration ?? undefined}
                value={start || ""}
                disabled={busy}
                onChange={(e) => setStart(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="h-10 w-24"
              />
            </div>
            <span className="pb-2.5 text-muted-foreground">to</span>
            <div className="space-y-2">
              <Label htmlFor="trim-end">End (s)</Label>
              <Input
                id="trim-end"
                type="number"
                min={0}
                max={duration ?? undefined}
                value={end || ""}
                disabled={busy}
                onChange={(e) => setEnd(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="h-10 w-24"
              />
            </div>
          </div>

          <Button type="button" size="lg" onClick={trim} disabled={busy || end <= start}>
            {busy ? <Loader2 className="animate-spin" /> : <Scissors />}
            {busy ? "Trimming…" : "Trim video"}
          </Button>

          {busy && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {progress == null ? "Preparing…" : `Trimming… ${progress}%`} The first run
                downloads the engine; it&apos;s cached afterward.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <video controls src={result.url} className="max-h-64 w-full rounded-md border border-border">
                <track kind="captions" />
              </video>
              <div className="text-sm text-muted-foreground">
                Trimmed clip: <strong className="text-foreground">{formatBytes(result.blob.size)}</strong>
              </div>
              <Button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name, result.blob.type)}
              >
                Download trimmed video
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
