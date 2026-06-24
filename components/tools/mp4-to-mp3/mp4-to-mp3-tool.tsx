"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileAudio, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileDropzone } from "@/components/tools/file-dropzone";
import { downloadBlob, stripExtension } from "@/lib/download";
import { formatBytes } from "@/lib/format";
import { runConversion } from "@/lib/ffmpeg";
import type { Tool } from "@/lib/tools/types";

// Browser memory ceiling — large videos can crash the tab.
const MAX_BYTES = 150 * 1024 * 1024;
const BITRATES = ["128", "192", "256", "320"];

interface Result {
  blob: Blob;
  url: string;
  name: string;
}

export default function Mp4ToMp3Tool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [bitrate, setBitrate] = useState("192");
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

  async function convert() {
    if (!file) return;
    setBusy(true);
    setProgress(null);
    setResult(null);
    try {
      const blob = await runConversion({
        file,
        outputName: "output.mp3",
        mime: "audio/mpeg",
        args: (input, output) => ["-i", input, "-vn", "-b:a", `${bitrate}k`, output],
        onProgress: (ratio) => setProgress(Math.round(ratio * 100)),
      });
      const name = `${stripExtension(file.name)}.mp3`;
      setResult({ blob, url: URL.createObjectURL(blob), name });
      toast.success("Audio extracted.");
    } catch (err) {
      console.error(err);
      toast.error("Could not convert this video. Please try another file.");
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
            <p className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>

          <div className="space-y-2">
            <Label>Bitrate</Label>
            <div className="flex flex-wrap gap-2">
              {BITRATES.map((b) => (
                <Button
                  key={b}
                  type="button"
                  size="sm"
                  variant={bitrate === b ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => setBitrate(b)}
                >
                  {b} kbps
                </Button>
              ))}
            </div>
          </div>

          <Button type="button" size="lg" onClick={convert} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <FileAudio />}
            {busy ? "Converting…" : "Extract MP3"}
          </Button>

          {busy && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {progress == null ? "Preparing…" : `Converting… ${progress}%`} The first run
                downloads the conversion engine; it&apos;s cached afterward.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <audio controls src={result.url} className="w-full">
                <track kind="captions" />
              </audio>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                  MP3: <strong className="text-foreground">{formatBytes(result.blob.size)}</strong>
                </span>
              </div>
              <Button
                type="button"
                onClick={() => downloadBlob(result.blob, result.name, result.blob.type)}
              >
                Download MP3
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
