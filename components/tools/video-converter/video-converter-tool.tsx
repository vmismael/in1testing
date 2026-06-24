"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { runConversion } from "@/lib/ffmpeg";
import type { Tool } from "@/lib/tools/types";

const MAX_BYTES = 150 * 1024 * 1024;

const FORMATS = [
  {
    label: "MP4",
    ext: "mp4",
    mime: "video/mp4",
    args: (i: string, o: string) => ["-i", i, "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28", "-c:a", "aac", "-b:a", "128k", o],
  },
  {
    label: "WebM",
    ext: "webm",
    mime: "video/webm",
    args: (i: string, o: string) => ["-i", i, "-c:v", "libvpx", "-b:v", "1M", "-c:a", "libvorbis", o],
  },
] as const;

type Ext = (typeof FORMATS)[number]["ext"];

interface Result {
  blob: Blob;
  url: string;
  name: string;
}

export default function VideoConverterTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [ext, setExt] = useState<Ext>("mp4");
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

  const format = FORMATS.find((f) => f.ext === ext)!;

  async function convert() {
    if (!file) return;
    setBusy(true);
    setProgress(null);
    setResult(null);
    try {
      const blob = await runConversion({
        file,
        outputName: `output.${format.ext}`,
        mime: format.mime,
        args: format.args,
        onProgress: (ratio) => setProgress(Math.round(ratio * 100)),
      });
      const name = `${stripExtension(file.name)}.${format.ext}`;
      setResult({ blob, url: URL.createObjectURL(blob), name });
      toast.success(`Converted to ${format.label}.`);
    } catch (err) {
      console.error(err);
      toast.error("Could not convert this video. Please try a shorter clip.");
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

          <div className="space-y-2">
            <Label>Convert to</Label>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <Button
                  key={f.ext}
                  type="button"
                  size="sm"
                  variant={ext === f.ext ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => setExt(f.ext)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          <Button type="button" size="lg" onClick={convert} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Video />}
            {busy ? "Converting…" : `Convert to ${format.label}`}
          </Button>

          {busy && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {progress == null ? "Preparing…" : `Encoding… ${progress}%`} Video encoding is
                heavy and runs on your device; short clips are fastest.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <video controls src={result.url} className="max-h-64 w-full rounded-md border border-border">
                <track kind="captions" />
              </video>
              <div className="text-sm text-muted-foreground">
                {format.label}: <strong className="text-foreground">{formatBytes(result.blob.size)}</strong>
              </div>
              <Button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name, result.blob.type)}
              >
                Download {format.label}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
