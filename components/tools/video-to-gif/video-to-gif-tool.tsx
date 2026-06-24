"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clapperboard, Loader2 } from "lucide-react";
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
const MAX_DURATION = 15;
const FPS = [5, 10, 15];
const WIDTHS = [320, 480, 640];

interface Result {
  blob: Blob;
  url: string;
  name: string;
}

export default function VideoToGifTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(480);
  const [start, setStart] = useState(0);
  const [duration, setDuration] = useState(5);
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
      toast.warning(`Please use a video under ${formatBytes(MAX_BYTES)}.`);
      setFile(null);
      return;
    }
    setFile(f);
  }

  async function create() {
    if (!file) return;
    const dur = Math.min(Math.max(1, duration), MAX_DURATION);
    setBusy(true);
    setProgress(null);
    setResult(null);
    try {
      const blob = await runConversion({
        file,
        outputName: "output.gif",
        mime: "image/gif",
        args: (input, output) => [
          "-ss",
          String(start),
          "-t",
          String(dur),
          "-i",
          input,
          "-vf",
          `fps=${fps},scale=${width}:-1:flags=lanczos`,
          output,
        ],
        onProgress: (ratio) => setProgress(Math.round(ratio * 100)),
      });
      const name = `${stripExtension(file.name)}.gif`;
      setResult({ blob, url: URL.createObjectURL(blob), name });
      toast.success("GIF created.");
    } catch (err) {
      console.error(err);
      toast.error("Could not create the GIF. Please try a shorter clip.");
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
        hint="Short video clips work best · processed privately on your device"
      />

      {file && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="gif-start">Start (s)</Label>
              <Input
                id="gif-start"
                type="number"
                min={0}
                value={start || ""}
                disabled={busy}
                onChange={(e) => setStart(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="h-10 w-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gif-duration">Length (s, max {MAX_DURATION})</Label>
              <Input
                id="gif-duration"
                type="number"
                min={1}
                max={MAX_DURATION}
                value={duration || ""}
                disabled={busy}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="h-10 w-20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Frame rate (fps)</Label>
            <div className="flex flex-wrap gap-2">
              {FPS.map((f) => (
                <Button
                  key={f}
                  type="button"
                  size="sm"
                  variant={fps === f ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => setFps(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Width (px)</Label>
            <div className="flex flex-wrap gap-2">
              {WIDTHS.map((w) => (
                <Button
                  key={w}
                  type="button"
                  size="sm"
                  variant={width === w ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => setWidth(w)}
                >
                  {w}
                </Button>
              ))}
            </div>
          </div>

          <Button type="button" size="lg" onClick={create} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Clapperboard />}
            {busy ? "Creating…" : "Create GIF"}
          </Button>

          {busy && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {progress == null ? "Preparing…" : `Building GIF… ${progress}%`} The first run
                downloads the engine; it&apos;s cached afterward.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="GIF preview"
                className="mx-auto max-h-64 rounded-md border border-border"
              />
              <div className="text-sm text-muted-foreground">
                GIF: <strong className="text-foreground">{formatBytes(result.blob.size)}</strong>
              </div>
              <Button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name, result.blob.type)}
              >
                Download GIF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
